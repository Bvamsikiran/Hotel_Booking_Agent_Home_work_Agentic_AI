import { useState } from 'react';

const SAMPLE_QUESTIONS = [
  'What is the hotel allowance for grade L4 employees in Paris?',
  'Can I book a deluxe room for a trip next week?',
  'What are the cancellation rules for business travel?',
];

const LLM_RESPONSES: Record<string, { answer: string; hallucination: boolean }> = {
  'What is the hotel allowance for grade L4 employees in Paris?': {
    answer:
      'For grade L4 employees travelling to Paris, the standard hotel allowance is Rs 8,000 per night. This covers a standard room at most business hotels in the city centre. Meals are typically covered separately at Rs 3,000 per day.',
    hallucination: true,
  },
  'Can I book a deluxe room for a trip next week?': {
    answer:
      'Yes, deluxe rooms are generally available for all business travel grades. Just ensure you book through the approved travel portal and keep receipts for any incidentals. Most hotels allow upgrades at check-in if available.',
    hallucination: true,
  },
  'What are the cancellation rules for business travel?': {
    answer:
      'Business travel bookings can typically be cancelled up to 24 hours before check-in without penalty. After that, one night may be charged. Always book refundable rates when travel plans are uncertain.',
    hallucination: true,
  },
};

export default function LLMScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; hallucination?: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  function send(text: string) {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const resp = LLM_RESPONSES[q] || {
        answer:
          'Based on standard business travel practices, hotel bookings should align with company guidelines. Rates vary by city and season — Paris typically ranges from Rs 7,000 to Rs 15,000 per night for business-class hotels.',
        hallucination: true,
      };
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: resp.answer, hallucination: resp.hallucination },
      ]);
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Explainer */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold font-mono">1</span>
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Stage 1 — LLM Generation</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          A plain LLM answers from training data alone — no company documents, no live search. It sounds confident but frequently <strong className="text-[var(--color-red)]">makes up numbers and rules</strong> that don't match your actual policy.
        </p>
      </div>

      {/* Chat */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden flex flex-col" style={{ minHeight: 360 }}>
        <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto" style={{ minHeight: 240 }}>
          {messages.length === 0 && (
            <div className="text-center text-[var(--color-muted)] text-sm mt-8 italic">
              Ask anything about hotel booking policy…
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-slide`}>
              {m.role === 'assistant' && (
                <div className="max-w-sm">
                  <div className="bg-[var(--color-surface)] rounded-xl rounded-tl-none px-4 py-3 text-sm leading-relaxed text-[var(--color-text)]">
                    {m.text}
                  </div>
                  {m.hallucination && (
                    <div className="flex items-center gap-1.5 mt-2 px-1">
                      <svg className="w-3.5 h-3.5 text-[var(--color-amber)] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-xs text-[var(--color-amber)] font-medium">Likely hallucination — no company policy was retrieved</span>
                    </div>
                  )}
                </div>
              )}
              {m.role === 'user' && (
                <div className="max-w-sm bg-[var(--color-primary)] text-white rounded-xl rounded-tr-none px-4 py-3 text-sm leading-relaxed">
                  {m.text}
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

        {/* Suggested questions */}
        <div className="border-t border-[var(--color-border)] px-5 py-3 flex gap-2 flex-wrap">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {q.length > 45 ? q.slice(0, 43) + '…' : q}
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

      <div className="rounded-lg bg-[var(--color-amber-bg)] border border-amber-200 px-4 py-3 text-sm text-[var(--color-amber)]">
        <strong>The problem:</strong> This LLM invented the Rs 8,000 allowance and the Rs 3,000 meal rate. Your real policy says Rs 4,500/day for meals and the booking window is 7 days. Stage 2 fixes this with RAG.
      </div>
    </div>
  );
}
