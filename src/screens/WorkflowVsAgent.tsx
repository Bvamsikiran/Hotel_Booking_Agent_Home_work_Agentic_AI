import { formatINR, searchHotels } from '../utils/hotelData';

const TODAY = new Date();
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CHECKIN_DAYS = 2; // 2 days from today → triggers 6.1 violation for workflow
const NIGHTS = 3;
const GRADE = 'L4';
const CITY = 'Paris';

const workflowHotels = searchHotels(CITY, CHECKIN_DAYS, NIGHTS, 'standard');
const cheapestWorkflow = workflowHotels[0];

const agentHotels8 = searchHotels(CITY, 8, NIGHTS, 'standard');
const cheapestAgent = agentHotels8[0];

interface StepProps {
  num: number;
  title: string;
  subtitle: string;
  status?: 'ok' | 'error' | 'warn' | 'done';
  detail?: string;
}

function WorkflowStep({ num, title, subtitle, status, detail }: StepProps) {
  const statusColors = {
    ok: 'border-[var(--color-border)]',
    error: 'border-[var(--color-red)] bg-[var(--color-red-bg)]',
    warn: 'border-amber-300 bg-[var(--color-amber-bg)]',
    done: 'border-[var(--color-green)] bg-[var(--color-green-bg)]',
  };
  return (
    <div className={`rounded-xl border-2 px-4 py-3 ${statusColors[status || 'ok']}`}>
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-mono font-semibold flex items-center justify-center flex-shrink-0">
          {num}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        </div>
        {status === 'error' && (
          <span className="text-xs font-semibold text-[var(--color-red)] bg-white px-2 py-0.5 rounded-full border border-red-200">FAIL</span>
        )}
        {status === 'done' && (
          <span className="text-xs font-semibold text-[var(--color-green)] bg-white px-2 py-0.5 rounded-full border border-green-200">PASS</span>
        )}
      </div>
      {detail && (
        <p className="mt-2 ml-10 text-xs text-[var(--color-muted)] leading-relaxed">{detail}</p>
      )}
    </div>
  );
}

function AgentStep({ num, type, content, status }: { num: number; type: 'THINK' | 'ACT' | 'SEE'; content: string; status?: 'ok' | 'error' | 'done' }) {
  const typeStyle = {
    THINK: 'bg-purple-100 text-purple-700',
    ACT: 'bg-[var(--color-blue-bg)] text-[var(--color-primary)]',
    SEE: status === 'error' ? 'bg-[var(--color-red-bg)] text-[var(--color-red)]' : status === 'done' ? 'bg-[var(--color-green-bg)] text-[var(--color-green)]' : 'bg-gray-100 text-gray-600',
  };
  return (
    <div className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-mono font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
      <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--color-border)]">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${typeStyle[type]}`}>{type}</span>
        </div>
        <p className="px-3 py-2 text-xs text-[var(--color-text)] leading-relaxed font-mono">{content}</p>
      </div>
    </div>
  );
}

export default function WorkflowVsAgent() {
  const checkinDate = addDays(TODAY, CHECKIN_DAYS);
  const checkin8 = addDays(TODAY, 8);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex gap-2">
            <span className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-semibold font-mono">5</span>
            <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold font-mono">6</span>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Workflow vs Agent</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          Same goal: book a hotel in {CITY}, check-in in {CHECKIN_DAYS} days, {NIGHTS} nights, grade {GRADE}, budget {formatINR(45000)}.
          A workflow follows fixed steps. An agent chooses the next step based on what it observes.
        </p>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Workflow column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-gray-400 text-white text-xs font-semibold flex items-center justify-center font-mono">5</span>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Workflow</h3>
            <span className="text-xs text-[var(--color-muted)] bg-gray-100 px-2 py-0.5 rounded-full">Fixed steps, no checks</span>
          </div>

          <div className="flex flex-col gap-3">
            <WorkflowStep
              num={1}
              title="search_hotels(Paris, 2 days, 3 nights, standard)"
              subtitle={`Found ${cheapestWorkflow.hotel} — ${formatINR(cheapestWorkflow.nightlyRate)}/night`}
              status="ok"
            />
            <WorkflowStep
              num={2}
              title="pick_cheapest()"
              subtitle={`Selected: ${cheapestWorkflow.hotel}, total ${formatINR(cheapestWorkflow.totalCost)}`}
              status="ok"
            />
            <WorkflowStep
              num={3}
              title="book_hotel()"
              subtitle={`Confirmed for ${fmtDate(checkinDate)} — ${fmtDate(addDays(checkinDate, NIGHTS))}`}
              status="ok"
            />
          </div>

          {/* Outcome */}
          <div className="rounded-xl border-2 border-[var(--color-red)] bg-[var(--color-red-bg)] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[var(--color-red)]">Booking Confirmed</span>
              <span className="text-xs font-semibold text-[var(--color-green)] bg-[var(--color-green-bg)] border border-green-200 px-2 py-0.5 rounded-full">Within budget</span>
            </div>
            <div className="rounded-lg bg-white border border-red-200 px-3 py-2.5 flex items-start gap-2">
              <svg className="w-4 h-4 text-[var(--color-red)] flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="text-xs font-semibold text-[var(--color-red)] mb-0.5">Policy violation — booking rejected by Finance</p>
                <p className="text-xs text-[var(--color-text)]">[6.1] Check-in in 2 days violates 7-day booking window. Nobody checked the policy — booking submitted with total confidence.</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-red)] mt-3 font-medium italic">
              "Within budget and non-compliant, with total confidence."
            </p>
          </div>
        </div>

        {/* Agent column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold flex items-center justify-center font-mono">6</span>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Agent</h3>
            <span className="text-xs text-[var(--color-muted)] bg-[var(--color-blue-bg)] px-2 py-0.5 rounded-full text-[var(--color-primary)]">Decides + verifies</span>
          </div>

          <div className="flex flex-col gap-2">
            <AgentStep num={1} type="THINK" content="Policy first. Query: hotel booking window." />
            <AgentStep num={1} type="ACT" content="retrieve_policy(query='hotel booking window')" />
            <AgentStep num={1} type="SEE" content="[6.1] Must book at least 7 days before check-in." />

            <AgentStep num={2} type="THINK" content={`Check-in is in ${CHECKIN_DAYS} days. Clause 6.1 requires 7. Check before searching.`} />
            <AgentStep num={2} type="ACT" content={`check_policy(standard, checkin_days=${CHECKIN_DAYS}, grade=L4)`} />
            <AgentStep num={2} type="SEE" content={`compliant: false\n• [6.1] Booking window: ${CHECKIN_DAYS} days < 7 required`} status="error" />

            <AgentStep num={3} type="THINK" content="Violation caught. Move check-in to 8 days from now. Re-search." />
            <AgentStep num={3} type="ACT" content="search_hotels(Paris, checkin_days=8, nights=3, standard)" />
            <AgentStep num={3} type="SEE" content={agentHotels8.map((r, i) => `${i + 1}. ${r.hotel}: ${formatINR(r.nightlyRate)}/night`).join('\n')} />

            <AgentStep num={4} type="THINK" content={`Cheapest: ${cheapestAgent.hotel} at ${formatINR(cheapestAgent.nightlyRate)}/night. Run check_policy.`} />
            <AgentStep num={4} type="ACT" content={`check_policy(standard, checkin_days=8, grade=L4, rate=${formatINR(cheapestAgent.nightlyRate)}, cheapest=${formatINR(cheapestAgent.nightlyRate)})`} />
            <AgentStep num={4} type="SEE" content="compliant: true\nAll clauses satisfied. Booking approved." status="done" />
          </div>

          {/* Outcome */}
          <div className="rounded-xl border-2 border-[var(--color-green)] bg-[var(--color-green-bg)] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[var(--color-green)]">Booking Verified</span>
              <div className="flex gap-2">
                <span className="text-xs font-semibold text-[var(--color-green)] bg-white border border-green-200 px-2 py-0.5 rounded-full">Within budget</span>
                <span className="text-xs font-semibold text-[var(--color-green)] bg-white border border-green-200 px-2 py-0.5 rounded-full">✓ Compliant</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                <p className="text-[var(--color-muted)] mb-0.5">Hotel</p>
                <p className="font-semibold text-[var(--color-text)]">{cheapestAgent.hotel}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                <p className="text-[var(--color-muted)] mb-0.5">Check-in</p>
                <p className="font-semibold text-[var(--color-text)]">{fmtDate(checkin8)}</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                <p className="text-[var(--color-muted)] mb-0.5">Room</p>
                <p className="font-semibold text-[var(--color-text)]">Standard</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                <p className="text-[var(--color-muted)] mb-0.5">Total ({NIGHTS} nights)</p>
                <p className="font-semibold text-[var(--color-text)]">{formatINR(cheapestAgent.totalCost)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
