import { useState } from 'react';
import { searchHotels, checkPolicy, formatINR, CITIES, GRADES, HOTELS } from '../utils/hotelData';

interface ToolResult {
  raw: string;
  error?: boolean;
}

function PolicyChunkCard({ clause, text }: { clause: string; text: string }) {
  return (
    <div className="text-xs rounded-lg bg-[var(--color-blue-bg)] px-3 py-2 border border-blue-100">
      <span className="font-mono font-medium text-[var(--color-primary)]">[{clause}]</span>{' '}
      <span className="text-[var(--color-text)]">{text}</span>
    </div>
  );
}

function ToolCard({
  name,
  signature,
  description,
  constraint,
  children,
  result,
  onRun,
}: {
  name: string;
  signature: string;
  description: string;
  constraint?: string;
  children: React.ReactNode;
  result: ToolResult | null;
  onRun: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--color-green)]" />
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">MCP Tool</span>
            </div>
            <h3 className="font-mono text-base font-medium text-[var(--color-text)]">{name}</h3>
            <p className="font-mono text-xs text-[var(--color-muted)] mt-0.5">{signature}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)] mt-2 leading-relaxed">{description}</p>
        {constraint && (
          <div className="mt-2 text-xs text-[var(--color-amber)] bg-[var(--color-amber-bg)] border border-amber-200 rounded-lg px-3 py-1.5">
            {constraint}
          </div>
        )}
      </div>

      {/* Try-it form */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">Try It</p>
        <div className="flex flex-col gap-3">
          {children}
          <button
            onClick={onRun}
            className="self-start text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors font-medium"
          >
            Run tool
          </button>
        </div>

        {result && (
          <div className="mt-4 animate-fade-slide">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">Raw Result</p>
            <pre className="text-xs font-mono bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap text-[var(--color-text)] leading-relaxed">
              {result.raw}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToolsExplorer() {
  // retrieve_policy state
  const [policyQuery, setPolicyQuery] = useState('hotel booking window');
  const [policyResult, setPolicyResult] = useState<ToolResult | null>(null);

  // search_hotels state
  const [searchCity, setSearchCity] = useState('Paris');
  const [searchDays, setSearchDays] = useState(8);
  const [searchNights, setSearchNights] = useState(3);
  const [searchRoomType, setSearchRoomType] = useState('standard');
  const [searchResult, setSearchResult] = useState<ToolResult | null>(null);

  // check_policy state
  const [cpRoomType, setCpRoomType] = useState('standard');
  const [cpDays, setCpDays] = useState(8);
  const [cpGrade, setCpGrade] = useState('L4');
  const [cpNightlyRate, setCpNightlyRate] = useState(10200);
  const [cpCheapest, setCpCheapest] = useState(9700);
  const [cpResult, setCpResult] = useState<ToolResult | null>(null);

  function runRetrievePolicy() {
    const q = policyQuery.toLowerCase();
    const chunks = [];
    if (q.includes('window') || q.includes('booking') || q.includes('book')) {
      chunks.push('[6.1] Hotels must be booked at least 7 days before check-in. Last-minute bookings require VP approval.');
    }
    if (q.includes('room') || q.includes('deluxe') || q.includes('grade') || q.includes('suite')) {
      chunks.push('[6.2] Grades L1–L4: standard room. L5+: deluxe. L7 + VP: suite.');
    }
    if (q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('logical')) {
      chunks.push('[6.3] Chosen rate ≤ 115% of cheapest compliant rate. Exceptions need Finance approval.');
    }
    if (q.includes('allowance') || q.includes('meal') || q.includes('food') || q.includes('daily')) {
      chunks.push('[6.4] International: Rs 4,500/day for meals and local transport. Receipts required.');
    }
    if (chunks.length === 0) {
      chunks.push('[6.1] Hotels must be booked at least 7 days before check-in.');
      chunks.push('[6.2] Room eligibility depends on employee grade.');
    }
    setPolicyResult({ raw: chunks.join('\n\n') });
  }

  function runSearchHotels() {
    const results = searchHotels(searchCity, searchDays, searchNights, searchRoomType);
    const lines = results.map(
      (r, i) =>
        `${i + 1}. ${r.hotel}\n   Nightly rate: ${formatINR(r.nightlyRate)}\n   Total (${searchNights} nights): ${formatINR(r.totalCost)}\n   Room type: ${r.roomType}`
    );
    setSearchResult({ raw: lines.join('\n\n') });
  }

  function runCheckPolicy() {
    const result = checkPolicy(cpRoomType, cpDays, cpGrade, cpNightlyRate, cpCheapest);
    const raw = result.compliant
      ? `compliant: true\n\nAll policy clauses satisfied.\nBooking approved.`
      : `compliant: false\n\nViolations:\n${result.violations.map((v) => `  • ${v}`).join('\n')}`;
    setCpResult({ raw, error: !result.compliant });
  }

  const inputCls = 'text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-white outline-none focus:border-[var(--color-primary)] transition-colors';
  const selectCls = inputCls + ' cursor-pointer';
  const labelCls = 'text-xs text-[var(--color-muted)] font-medium';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold font-mono">4</span>
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Stage 4 — Tools (MCP Server)</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          Three tools are discovered at runtime from an MCP server. The agent calls exactly one tool per step. Try each tool below with your own arguments.
        </p>
      </div>

      {/* Tool 1 */}
      <ToolCard
        name="retrieve_policy"
        signature="retrieve_policy(query: str) → list[PolicyChunk]"
        description="Searches the company hotel policy using semantic similarity. Must be called before proposing any hotel or rate."
        constraint="⚠ Rule: This tool must be the first call in every agent run."
        result={policyResult}
        onRun={runRetrievePolicy}
      >
        <div className="flex flex-col gap-1">
          <label className={labelCls}>query</label>
          <input
            value={policyQuery}
            onChange={(e) => setPolicyQuery(e.target.value)}
            className={inputCls}
            placeholder="e.g. hotel booking window"
          />
        </div>
      </ToolCard>

      {/* Tool 2 */}
      <ToolCard
        name="search_hotels"
        signature="search_hotels(city, checkin_days_from_now, nights, room_type) → list[HotelRate]"
        description="Returns nightly rates in INR for four hotels sorted cheapest first. Rate = base(9,000 + 600×max(0,10−days)) × room_multiplier + hotel_offset."
        result={searchResult}
        onRun={runSearchHotels}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>city</label>
            <select value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className={selectCls}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>check-in days from now</label>
            <input type="number" min={1} max={60} value={searchDays} onChange={(e) => setSearchDays(+e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>nights</label>
            <input type="number" min={1} max={14} value={searchNights} onChange={(e) => setSearchNights(+e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>room_type</label>
            <select value={searchRoomType} onChange={(e) => setSearchRoomType(e.target.value)} className={selectCls}>
              <option value="standard">standard</option>
              <option value="deluxe">deluxe</option>
              <option value="suite">suite</option>
            </select>
          </div>
        </div>
      </ToolCard>

      {/* Tool 3 */}
      <ToolCard
        name="check_policy"
        signature="check_policy(room_type, checkin_days_from_now, employee_grade, nightly_rate_inr, cheapest_compliant_rate_inr) → PolicyResult"
        description="Verifies all four policy clauses. Returns compliant: true/false and a list of specific violations. The agent cannot finish until this returns compliant: true."
        constraint="⚠ Rule: Agent may not finish without a compliant: true result from this tool."
        result={cpResult}
        onRun={runCheckPolicy}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>room_type</label>
            <select value={cpRoomType} onChange={(e) => setCpRoomType(e.target.value)} className={selectCls}>
              <option value="standard">standard</option>
              <option value="deluxe">deluxe</option>
              <option value="suite">suite</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>checkin_days_from_now</label>
            <input type="number" min={0} max={60} value={cpDays} onChange={(e) => setCpDays(+e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>employee_grade</label>
            <select value={cpGrade} onChange={(e) => setCpGrade(e.target.value)} className={selectCls}>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>nightly_rate_inr</label>
            <input type="number" min={0} value={cpNightlyRate} onChange={(e) => setCpNightlyRate(+e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className={labelCls}>cheapest_compliant_rate_inr</label>
            <input type="number" min={0} value={cpCheapest} onChange={(e) => setCpCheapest(+e.target.value)} className={inputCls} />
          </div>
        </div>
      </ToolCard>
    </div>
  );
}
