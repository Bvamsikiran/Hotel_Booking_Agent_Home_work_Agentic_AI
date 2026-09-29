export const HOTELS = ['Hotel Lumiere', 'Seine Grand', 'Marais Boutique', 'Gare du Nord Inn'];
export const CITIES = ['Paris', 'London', 'Dubai', 'Singapore'];
export const GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

const HOTEL_OFFSETS: Record<string, number> = {
  'Hotel Lumiere': 1200,
  'Seine Grand': 3500,
  'Marais Boutique': -500,
  'Gare du Nord Inn': 800,
};

export function formatINR(amount: number): string {
  return (
    'Rs ' +
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
  );
}

export function getBaseRate(daysBeforeCheckin: number): number {
  return 9000 + Math.max(0, 10 - daysBeforeCheckin) * 600;
}

export function getRoomMultiplier(roomType: string): number {
  if (roomType === 'deluxe') return 1.6;
  if (roomType === 'suite') return 2.8;
  return 1.0;
}

export function getHotelRate(hotel: string, daysBeforeCheckin: number, roomType: string): number {
  const base = Math.round(getBaseRate(daysBeforeCheckin) * getRoomMultiplier(roomType));
  return base + HOTEL_OFFSETS[hotel];
}

export interface HotelResult {
  hotel: string;
  nightlyRate: number;
  totalCost: number;
  roomType: string;
}

export function searchHotels(
  city: string,
  daysBeforeCheckin: number,
  nights: number,
  roomType: string
): HotelResult[] {
  return HOTELS.map((hotel) => {
    const nightlyRate = getHotelRate(hotel, daysBeforeCheckin, roomType);
    return { hotel, nightlyRate, totalCost: nightlyRate * nights, roomType };
  }).sort((a, b) => a.nightlyRate - b.nightlyRate);
}

export interface PolicyResult {
  compliant: boolean;
  violations: string[];
}

export function checkPolicy(
  roomType: string,
  daysBeforeCheckin: number,
  grade: string,
  nightlyRate: number,
  cheapestCompliantRate: number
): PolicyResult {
  const violations: string[] = [];
  const gradeNum = parseInt(grade.replace('L', ''), 10);

  if (daysBeforeCheckin < 7) {
    violations.push(
      `6.1 Booking window: check-in is in ${daysBeforeCheckin} day${daysBeforeCheckin === 1 ? '' : 's'}, policy requires at least 7`
    );
  }

  if (roomType === 'standard' && gradeNum < 1) {
    // standard always allowed for L1-L4
  } else if (roomType === 'deluxe' && gradeNum < 5) {
    violations.push(`6.2 Room type: deluxe requires grade L5 or above (your grade is ${grade})`);
  } else if (roomType === 'suite' && gradeNum < 7) {
    violations.push(`6.2 Room type: suite requires L7 plus VP approval (your grade is ${grade})`);
  }

  if (nightlyRate > cheapestCompliantRate * 1.15) {
    violations.push(
      `6.3 Lowest logical rate: chosen rate ${formatINR(nightlyRate)}/night is more than 15% above cheapest compliant rate ${formatINR(cheapestCompliantRate)}/night`
    );
  }

  return { compliant: violations.length === 0, violations };
}

// Allowed room type for grade
export function allowedRoomType(grade: string): string {
  const g = parseInt(grade.replace('L', ''), 10);
  if (g >= 7) return 'suite';
  if (g >= 5) return 'deluxe';
  return 'standard';
}

export interface AgentStep {
  id: number;
  think: string;
  act: string;
  actArgs: string;
  see: string;
  caption: string;
  status: 'think' | 'act' | 'see' | 'error' | 'done';
}

export interface AgentRunResult {
  steps: AgentStep[];
  verified: boolean;
  finalAnswer: FinalAnswer | null;
}

export interface FinalAnswer {
  hotel: string;
  city: string;
  checkinDate: string;
  checkoutDate: string;
  roomType: string;
  nightlyRate: number;
  totalCost: number;
  withinBudget: boolean;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function generateAgentRun(
  city: string,
  checkinDaysFromNow: number,
  nights: number,
  grade: string,
  budget: number
): AgentRunResult {
  const today = new Date();
  const gradeNum = parseInt(grade.replace('L', ''), 10);
  const roomType = gradeNum >= 5 ? 'deluxe' : 'standard';
  const steps: AgentStep[] = [];
  let stepId = 1;

  // Step 1: retrieve policy
  steps.push({
    id: stepId++,
    think: `Before doing anything, the policy says I must retrieve it first. Query: "hotel booking window".`,
    act: 'retrieve_policy',
    actArgs: `query: "hotel booking window"`,
    see: `[6.1] Hotels must be booked at least 7 days before check-in.\n[6.2] Standard for L1–L4, Deluxe for L5+, Suite for L7 + VP approval.\n[6.3] Chosen rate ≤ cheapest compliant rate × 1.15.\n[6.4] Rs 4,500/day meal allowance on international trips.`,
    caption: 'The agent reads the company policy before proposing anything — no hallucination.',
    status: 'see',
  });

  // Step 2: check if booking window violated
  let currentDays = checkinDaysFromNow;
  const policyResult1 = checkPolicy(roomType, currentDays, grade, 0, 0);
  const windowViolation = policyResult1.violations.find((v) => v.startsWith('6.1'));

  if (windowViolation) {
    steps.push({
      id: stepId++,
      think: `Check-in is in ${currentDays} day${currentDays === 1 ? '' : 's'}. Clause 6.1 requires 7 days. Let me verify with check_policy before searching.`,
      act: 'check_policy',
      actArgs: `room_type: ${roomType}, checkin_days_from_now: ${currentDays}, grade: ${grade}`,
      see: `compliant: false\nviolations:\n  • ${windowViolation}`,
      caption: 'Caught the booking window violation before spending time searching for hotels.',
      status: 'error',
    });

    // Move check-in to 8 days from now
    currentDays = 8;
    steps.push({
      id: stepId++,
      think: `Booking window violated. I'll move check-in to ${currentDays} days from now to satisfy clause 6.1, then search for hotels.`,
      act: 'search_hotels',
      actArgs: `city: ${city}, checkin_days_from_now: ${currentDays}, nights: ${nights}, room_type: ${roomType}`,
      see: (() => {
        const results = searchHotels(city, currentDays, nights, roomType);
        return results
          .map((r, i) => `${i + 1}. ${r.hotel}: ${formatINR(r.nightlyRate)}/night (total ${formatINR(r.totalCost)})`)
          .join('\n');
      })(),
      caption: `Moved check-in to comply with clause 6.1, then searched ${city} for ${roomType} rooms.`,
      status: 'see',
    });
  } else {
    steps.push({
      id: stepId++,
      think: `Check-in is in ${currentDays} days. Clause 6.1 is satisfied. Now search for ${roomType} rooms in ${city}.`,
      act: 'search_hotels',
      actArgs: `city: ${city}, checkin_days_from_now: ${currentDays}, nights: ${nights}, room_type: ${roomType}`,
      see: (() => {
        const results = searchHotels(city, currentDays, nights, roomType);
        return results
          .map((r, i) => `${i + 1}. ${r.hotel}: ${formatINR(r.nightlyRate)}/night (total ${formatINR(r.totalCost)})`)
          .join('\n');
      })(),
      caption: `Searched ${city} for available ${roomType} rooms sorted by price.`,
      status: 'see',
    });
  }

  // Step 4: check_policy with actual rate
  const searchResults = searchHotels(city, currentDays, nights, roomType);
  const cheapest = searchResults[0];
  const chosen = searchResults[0]; // pick cheapest
  const policyFinal = checkPolicy(roomType, currentDays, grade, chosen.nightlyRate, cheapest.nightlyRate);

  steps.push({
    id: stepId++,
    think: `Cheapest option is ${chosen.hotel} at ${formatINR(chosen.nightlyRate)}/night. Run check_policy to confirm all clauses pass.`,
    act: 'check_policy',
    actArgs: `room_type: ${roomType}, checkin_days_from_now: ${currentDays}, grade: ${grade}, nightly_rate_inr: ${chosen.nightlyRate}, cheapest_compliant_rate_inr: ${cheapest.nightlyRate}`,
    see: policyFinal.compliant
      ? `compliant: true\nAll clauses satisfied — booking approved.`
      : `compliant: false\nviolations:\n${policyFinal.violations.map((v) => `  • ${v}`).join('\n')}`,
    caption: policyFinal.compliant
      ? 'All policy checks passed. The agent is cleared to book.'
      : 'Found additional violations — will fix and retry.',
    status: policyFinal.compliant ? 'done' : 'error',
  });

  const checkinDate = addDays(today, currentDays);
  const checkoutDate = addDays(checkinDate, nights);
  const totalCost = chosen.nightlyRate * nights;

  return {
    steps,
    verified: policyFinal.compliant,
    finalAnswer: policyFinal.compliant
      ? {
          hotel: chosen.hotel,
          city,
          checkinDate: fmtDate(checkinDate),
          checkoutDate: fmtDate(checkoutDate),
          roomType,
          nightlyRate: chosen.nightlyRate,
          totalCost,
          withinBudget: totalCost <= budget,
        }
      : null,
  };
}
