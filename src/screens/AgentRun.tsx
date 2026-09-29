import { useState, useEffect, useRef } from 'react';
import { generateAgentRun, formatINR, CITIES, GRADES, AgentStep, AgentRunResult } from '../utils/hotelData';

const TODAY = new Date();

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysFromToday(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

interface StepCardProps {
  step: AgentStep;
  index: number;
  total: number;
}

function StepCard({ step, index, total }: StepCardProps) {
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  return (
    <div className="animate-fade-slide">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-[var(--color-muted)]">
          Step {index + 1} of {total}
        </span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        {isDone && (
          <span className="text-xs font-semibold text-[var(--color-green)] bg-[var(--color-green-bg)] px-2 py-0.5 rounded-full border border-green-200">DONE</span>
        )}
        {isError && (
          <span className="text-xs font-semibold text-[var(--color-red)] bg-[var(--color-red-bg)] px-2 py-0.5 rounded-full border border-red-200">VIOLATION</span>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        {/* THINK */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-purple-50">
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-purple-100 text-purple-700 mt-0.5 flex-shrink-0">THINK</span>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{step.think}</p>
        </div>

        {/* ACT */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-blue-bg)]">
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-blue-200 text-[var(--color-primary)] mt-0.5 flex-shrink-0">ACT</span>
          <div className="flex-1">
            <span className="font-mono text-sm font-medium text-[var(--color-primary)]">{step.act}</span>
            <span className="font-mono text-xs text-[var(--color-muted)] ml-1">({step.actArgs})</span>
          </div>
        </div>

        {/* SEE */}
        <div className={`flex items-start gap-3 px-4 py-3 ${isError ? 'bg-[var(--color-red-bg)]' : isDone ? 'bg-[var(--color-green-bg)]' : 'bg-gray-50'}`}>
          <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded mt-0.5 flex-shrink-0 ${
            isError ? 'bg-red-200 text-[var(--color-red)]' :
            isDone ? 'bg-green-200 text-[var(--color-green)]' :
            'bg-gray-200 text-gray-600'
          }`}>SEE</span>
          <pre className="font-mono text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-wrap flex-1">{step.see}</pre>
        </div>

        {/* Caption */}
        <div className="px-4 py-2.5 border-t border-[var(--color-border)] bg-white">
          <p className="text-xs text-[var(--color-muted)] italic">{step.caption}</p>
        </div>
      </div>
    </div>
  );
}

export default function AgentRun() {
  const defaultCheckin = fmtDateInput(addDays(TODAY, 2));

  const [city, setCity] = useState('Paris');
  const [checkinDate, setCheckinDate] = useState(defaultCheckin);
  const [nights, setNights] = useState(3);
  const [grade, setGrade] = useState('L4');
  const [budget, setBudget] = useState(45000);
  const [running, setRunning] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleSteps]);

  function runAgent() {
    const days = daysFromToday(checkinDate);
    const fullResult = generateAgentRun(city, days, nights, grade, budget);
    setResult(null);
    setVisibleSteps([]);
    setVerified(null);
    setRunning(true);

    fullResult.steps.forEach((step, i) => {
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step]);
        if (i === fullResult.steps.length - 1) {
          setTimeout(() => {
            setVerified(fullResult.verified);
            setResult(fullResult);
            setRunning(false);
          }, 600);
        }
      }, i * 1400);
    });
  }

  const inputCls = 'text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-white outline-none focus:border-[var(--color-primary)] transition-colors w-full';
  const selectCls = inputCls + ' cursor-pointer';
  const labelCls = 'text-xs text-[var(--color-muted)] font-medium mb-1 block';

  return (
    <div className="flex gap-5 px-4 py-6 max-w-6xl mx-auto">
      {/* Main trace column */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        {/* Config form */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
            Book me a hotel within company travel policy
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Check-in date</label>
              <input
                type="date"
                value={checkinDate}
                min={fmtDateInput(TODAY)}
                onChange={(e) => setCheckinDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Nights</label>
              <input type="number" min={1} max={14} value={nights} onChange={(e) => setNights(+e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Employee grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className={selectCls}>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Total budget (INR)</label>
              <input type="number" min={10000} step={1000} value={budget} onChange={(e) => setBudget(+e.target.value)} className={inputCls} />
            </div>
          </div>
          <button
            onClick={runAgent}
            disabled={running}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
          >
            {running ? 'Running agent…' : 'Run agent'}
          </button>
        </div>

        {/* Trace */}
        {visibleSteps.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Agent Trace</h3>
              {running && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] thinking-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] thinking-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] thinking-dot" />
                </div>
              )}
            </div>
            {visibleSteps.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} total={visibleSteps.length} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Final answer */}
        {result?.finalAnswer && (
          <div className="rounded-xl border-2 border-[var(--color-green)] bg-[var(--color-green-bg)] p-5 animate-fade-slide">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--color-green)]">Final Answer — Booking Ready</h3>
              <div className="flex gap-2">
                {result.finalAnswer.withinBudget && (
                  <span className="text-xs font-semibold text-[var(--color-green)] bg-white border border-green-200 px-2.5 py-1 rounded-full">Within budget</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Hotel', value: result.finalAnswer.hotel },
                { label: 'City', value: result.finalAnswer.city },
                { label: 'Room type', value: result.finalAnswer.roomType.charAt(0).toUpperCase() + result.finalAnswer.roomType.slice(1) },
                { label: 'Check-in', value: result.finalAnswer.checkinDate },
                { label: 'Check-out', value: result.finalAnswer.checkoutDate },
                { label: 'Nightly rate', value: formatINR(result.finalAnswer.nightlyRate) },
                { label: `Total (${nights} nights)`, value: formatINR(result.finalAnswer.totalCost) },
                { label: 'Budget', value: formatINR(budget) },
                { label: 'Budget used', value: `${Math.round((result.finalAnswer.totalCost / budget) * 100)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg px-3 py-2.5 border border-green-200">
                  <p className="text-xs text-[var(--color-muted)] mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {visibleSteps.length === 0 && !running && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-blue-bg)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <p className="text-sm text-[var(--color-muted)] font-medium">Configure the booking parameters above and click <strong>Run agent</strong></p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Try check-in in 2 days to see the agent catch a policy violation and fix it</p>
          </div>
        )}
      </div>

      {/* Right: verified badge */}
      <div className="w-48 flex-shrink-0 flex flex-col gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center sticky top-6">
          <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Policy Check</p>
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all duration-700 ${
            verified === null ? 'bg-gray-100 border-4 border-gray-200' :
            verified ? 'bg-[var(--color-green-bg)] border-4 border-[var(--color-green)]' :
            'bg-[var(--color-red-bg)] border-4 border-[var(--color-red)]'
          }`}>
            {verified === null ? (
              <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            ) : verified ? (
              <svg className="w-8 h-8 text-[var(--color-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[var(--color-red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            )}
          </div>
          <p className={`mt-3 text-sm font-semibold ${
            verified === null ? 'text-gray-400' :
            verified ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
          }`}>
            {verified === null ? 'Pending' : verified ? 'Verified' : 'Not compliant'}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {verified === null ? 'Waiting for check_policy' :
             verified ? 'check_policy returned compliant: true' :
             'Policy violations found'}
          </p>
        </div>

        {/* Policy reference */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">Policy Rules</p>
          <div className="flex flex-col gap-2.5">
            {[
              { id: '6.1', rule: 'Book ≥7 days ahead' },
              { id: '6.2', rule: 'L1–L4: standard room' },
              { id: '6.3', rule: 'Rate ≤ cheapest ×1.15' },
              { id: '6.4', rule: 'Rs 4,500/day allowance' },
            ].map(({ id, rule }) => (
              <div key={id} className="flex items-start gap-2">
                <span className="font-mono text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-blue-bg)] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{id}</span>
                <span className="text-xs text-[var(--color-muted)]">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
