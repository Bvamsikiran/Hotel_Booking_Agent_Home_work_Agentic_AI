import { useState } from 'react';

interface Props {
  showMemory: boolean;
}

interface PolicyChunk {
  id: string;
  clause: string;
  text: string;
  score: number;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  citations: string[];
  chunks: PolicyChunk[];
}

const POLICY_CHUNKS: PolicyChunk[] = [
  { id: '6.1', clause: '6.1 Booking Window', text: 'Hotels must be booked at least 7 days before check-in. Last-minute bookings require VP approval and are subject to a 20% surcharge recovery.', score: 0 },
  { id: '6.2', clause: '6.2 Room Type Eligibility', text: 'Grades L1–L4: standard room only. Grade L5 and above: deluxe permitted. Suite bookings require grade L7 and written VP approval submitted 48 hours in advance.', score: 0 },
  { id: '6.3', clause: '6.3 Lowest Logical Rate', text: 'The chosen hotel rate must not exceed 115% of the cheapest compliant rate available for the same city, dates, and room type. Exceptions require Finance approval.', score: 0 },
  { id: '6.4', clause: '6.4 Daily Allowance', text: 'International trips: Rs 4,500 per day for meals and local transport. Domestic trips: Rs 2,200 per day. Original receipts required for reimbursement.', score: 0 },
];

type ConvState = { grade?: string; city?: string; checkin?: string };

const QA: {
  match: string[];
  answer: (state: ConvState) => string;
  citations: string[];
  chunkIds: string[];
  chunkScores: number[];
  updateState?: (state: ConvState) => ConvState;
}[] = [
  {
    match: ["grade l4", "l4", "paris", "next week"],
    answer: (s) =>
      `Noted — you're grade L4 travelling to ${s.city || 'Paris'} next week. Based on your grade, you're eligible for a **standard room** only [6.2]. Also, check-in must be at least 7 days from today to satisfy the booking window [6.1]. Shall I check your room eligibility or daily allowance?`,
    citations: ['6.1', '6.2'],
    chunkIds: ['6.1', '6.2'],
    chunkScores: [0.81, 0.74],
    updateState: (s) => ({ ...s, grade: 'L4', city: 'Paris', checkin: 'next week' }),
  },
  {
    match: ["deluxe room", "deluxe"],
    answer: (s) =>
      `Unfortunately, as grade ${s.grade || 'L4'} you are **not eligible** for a deluxe room [6.2]. Deluxe rooms are permitted for grade L5 and above. You must book a standard room. Would you like to know the daily meal allowance instead?`,
    citations: ['6.2'],
    chunkIds: ['6.2', '6.3'],
    chunkScores: [0.91, 0.58],
  },
  {
    match: ["daily allowance", "allowance", "meal", "food"],
    answer: (s) =>
      `For international travel (including ${s.city || 'Paris'}), your daily allowance is **Rs 4,500** per day for meals and local transport [6.4]. Original receipts are required. For a 3-night trip that's Rs 13,500 in allowable expenses. Keep all receipts.`,
    citations: ['6.4'],
    chunkIds: ['6.4', '6.1'],
    chunkScores: [0.88, 0.45],
  },
];

export default function PolicyAssistant({ showMemory }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convState, setConvState] = useState<ConvState>({});
  const [visibleChunks, setVisibleChunks] = useState<PolicyChunk[]>([]);

  const SAMPLE = [
    "I'm grade L4 staying in Paris next week.",
    'Can I book a deluxe room?',
    'What is my daily allowance?',
  ];

  function getResponse(q: string) {
    const lower = q.toLowerCase();
    for (const qa of QA) {
      if (qa.match.some((k) => lower.includes(k))) {
        return qa;
      }
    }
    return {
      answer: () =>
        "I can only answer questions grounded in the company hotel policy. Try asking about room eligibility, booking windows, or daily allowances [6.1] [6.2] [6.4].",
      citations: ['6.1'],
      chunkIds: ['6.1'],
      chunkScores: [0.52],
      updateState: undefined,
    };
  }

  function send(text: string) {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setMessages((m) => [...m, { role: 'user', text: q, citations: [], chunks: [] }]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const qa = getResponse(q);
      const newState = qa.updateState ? qa.updateState(convState) : convState;
      setConvState(newState);

      const chunks = qa.chunkIds.map((id, i) => ({
        ...POLICY_CHUNKS.find((c) => c.id === id)!,
        score: qa.chunkScores[i],
      }));
      setVisibleChunks(chunks.slice(0, 3));

      const answerText = qa.answer(newState);
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: answerText, citations: qa.citations, chunks },
      ]);
      setLoading(false);
    }, 900);
  }

  function renderText(text: string) {
    return text.split(/(\*\*.*?\*\*|\[\d\.\d\])/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (/^\[\d\.\d\]$/.test(part)) {
        return (
          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-[var(--color-blue-bg)] text-[var(--color-primary)] ml-0.5">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex gap-5 px-4 py-6 max-w-6xl mx-auto h-full">
      {/* Left: Policy chunks panel */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
            Policy Excerpts Used
          </h3>
          {visibleChunks.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] italic">Ask a question to see relevant policy clauses.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleChunks.map((c) => (
                <div key={c.id} className="animate-fade-slide">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-medium text-[var(--color-primary)]">{c.clause}</span>
                    <span className="text-xs text-[var(--color-muted)] font-mono">{c.score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[var(--color-border)] rounded-full h-1 mb-2">
                    <div
                      className="bg-[var(--color-primary)] h-1 rounded-full transition-all"
                      style={{ width: `${c.score * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed line-clamp-3">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation memory */}
        {showMemory && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
              Conversation Memory
            </h3>
            {messages.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] italic">Memory builds as you chat.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {messages.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fade-slide">
                    <span className={`text-xs font-semibold mt-0.5 flex-shrink-0 ${m.role === 'user' ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
                      {m.role === 'user' ? 'You' : 'AI'}
                    </span>
                    <span className="text-xs text-[var(--color-muted)] leading-tight">
                      {m.text.slice(0, 40)}{m.text.length > 40 ? '…' : ''}
                    </span>
                  </div>
                ))}
                {convState.grade && (
                  <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-[var(--color-muted)] mb-1">Context extracted:</p>
                    {convState.grade && <p className="text-xs text-[var(--color-text)]">Grade: <span className="font-mono">{convState.grade}</span></p>}
                    {convState.city && <p className="text-xs text-[var(--color-text)]">City: {convState.city}</p>}
                    {convState.checkin && <p className="text-xs text-[var(--color-text)]">Check-in: {convState.checkin}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        {/* Stage badge */}
        <div className="border-b border-[var(--color-border)] px-5 py-3 flex items-center gap-3">
          <div className="flex gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-blue-bg)] text-[var(--color-primary)] font-medium">RAG</span>
            {showMemory && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-blue-bg)] text-[var(--color-primary)] font-medium">+ Memory</span>
            )}
          </div>
          <span className="text-sm text-[var(--color-muted)]">Answers grounded in company policy with clause citations</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4" style={{ minHeight: 0 }}>
          {messages.length === 0 && (
            <div className="text-center text-[var(--color-muted)] text-sm mt-8 italic">
              Ask about hotel policy — every answer is grounded in real clauses.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-slide`}>
              {m.role === 'user' ? (
                <div className="max-w-sm bg-[var(--color-primary)] text-white rounded-xl rounded-tr-none px-4 py-3 text-sm leading-relaxed">
                  {m.text}
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="bg-[var(--color-surface)] rounded-xl rounded-tl-none px-4 py-3 text-sm leading-relaxed text-[var(--color-text)]">
                    {renderText(m.text)}
                  </div>
                  {m.citations.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 px-1">
                      <span className="text-xs text-[var(--color-muted)]">Sources:</span>
                      {m.citations.map((c) => (
                        <span key={c} className="text-xs font-mono bg-[var(--color-blue-bg)] text-[var(--color-primary)] px-1.5 py-0.5 rounded">
                          [{c}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-fade-slide">
              <div className="bg-[var(--color-surface)] rounded-xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] thinking-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] thinking-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] thinking-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested */}
        <div className="border-t border-[var(--color-border)] px-5 py-2 flex gap-2 flex-wrap">
          {SAMPLE.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask about hotel policy…"
            className="flex-1 text-sm outline-none bg-transparent placeholder-[var(--color-muted)]"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="text-sm px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-40 hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
