interface MemoryEntry {
  key: string;
  value: string;
  age?: string;
}

interface MemoryCardProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  entries: MemoryEntry[];
  note?: string;
}

function MemoryCard({ title, subtitle, badge, badgeColor, icon, entries, note }: MemoryCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {entries.map((e) => (
          <div key={e.key} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-mono font-medium text-[var(--color-muted)]">{e.key}</p>
              <p className="text-sm text-[var(--color-text)] mt-0.5">{e.value}</p>
            </div>
            {e.age && (
              <span className="text-xs text-[var(--color-muted)] font-mono flex-shrink-0 mt-0.5">{e.age}</span>
            )}
          </div>
        ))}
      </div>
      {note && (
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-xs text-[var(--color-muted)] italic">{note}</p>
        </div>
      )}
    </div>
  );
}

export default function MemoryPanel() {
  const today = new Date();
  const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayStr = fmtDate(today);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold font-mono">M</span>
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Memory — Three Lifetimes</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          An agent remembers things at three different timescales. Each memory type serves a different purpose and expires at a different point.
        </p>
      </div>

      {/* Card 1 — Conversation state */}
      <MemoryCard
        title="Conversation State"
        subtitle="Lives for one chat thread — cleared when the conversation ends"
        badge="Ephemeral"
        badgeColor="bg-[var(--color-blue-bg)] text-[var(--color-primary)] border-blue-200"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        }
        entries={[
          { key: 'user.grade', value: 'L4 — stated in the first message' },
          { key: 'user.city', value: 'Paris — extracted from "I am staying in Paris"' },
          { key: 'user.checkin', value: 'Next week — inferred as 8 days from today' },
          { key: 'conversation.turn', value: '3 — three exchanges so far' },
          { key: 'last_citation', value: '[6.2] Room type eligibility' },
        ]}
        note="This memory is passed as the full conversation history with each API call. The model uses it to avoid asking the user to repeat themselves."
      />

      {/* Card 2 — Task state */}
      <MemoryCard
        title="Task State"
        subtitle="Lives for one agent run — tracks what has been done within this booking attempt"
        badge="Run-scoped"
        badgeColor="bg-purple-50 text-purple-700 border-purple-200"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        }
        entries={[
          { key: 'policy_retrieved', value: 'true — retrieve_policy called in step 1' },
          { key: 'compliance_status', value: 'PASS — check_policy returned compliant: true' },
          { key: 'steps_used', value: '4 of 10 maximum' },
          { key: 'checkin_adjusted', value: 'true — moved from 2 days to 8 days (6.1 fix)' },
          { key: 'selected_hotel', value: 'Marais Boutique — cheapest compliant rate' },
          { key: 'tools_called', value: 'retrieve_policy, check_policy ×2, search_hotels' },
        ]}
        note="Stored in a scratchpad passed to the model each step. Prevents the agent from calling the same tool twice with identical arguments, and tracks the 'not done until compliant' rule."
      />

      {/* Card 3 — Long-term memory */}
      <MemoryCard
        title="Long-term Memory"
        subtitle="Persists across sessions — populated from past bookings and user preferences"
        badge="Persistent"
        badgeColor="bg-[var(--color-green-bg)] text-[var(--color-green)] border-green-200"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4s8-1.79 4-4"/>
          </svg>
        }
        entries={[
          { key: 'user.grade', value: 'L4 — from HR system, synced monthly', age: todayStr },
          { key: 'user.home_city', value: 'Mumbai — preferred departure airport BOM', age: '15 Sep 2026' },
          { key: 'user.preferred_hotel', value: 'Marais Boutique — booked 3 times', age: '2 Aug 2026' },
          { key: 'booking.last_rejected', value: 'Booking window violated — submitted 3 days before check-in', age: '12 Jul 2026' },
          { key: 'booking.total_trips_ytd', value: '4 — London (×2), Paris, Dubai', age: todayStr },
          { key: 'user.dietary', value: 'Vegetarian — stored for hotel meal preference', age: '1 Jan 2026' },
        ]}
        note="Retrieved via a vector search at the start of each session. The agent uses this to personalise suggestions and learn from past policy violations without repeating mistakes."
      />

      {/* Summary diagram */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Memory lifetime at a glance</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Long-term', width: '100%', color: 'bg-[var(--color-green)]', scope: 'Across all sessions' },
            { label: 'Task state', width: '40%', color: 'bg-purple-500', scope: 'One agent run' },
            { label: 'Conversation', width: '15%', color: 'bg-[var(--color-primary)]', scope: 'One chat thread' },
          ].map(({ label, width, color, scope }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-xs font-mono text-[var(--color-muted)] w-28 flex-shrink-0">{label}</span>
              <div className="flex-1 bg-[var(--color-surface)] rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width }} />
              </div>
              <span className="text-xs text-[var(--color-muted)] w-32 text-right">{scope}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
