import { useState } from 'react';
import LLMScreen from './screens/LLMScreen';
import PolicyAssistant from './screens/PolicyAssistant';
import ToolsExplorer from './screens/ToolsExplorer';
import WorkflowVsAgent from './screens/WorkflowVsAgent';
import AgentRun from './screens/AgentRun';
import MemoryPanel from './screens/MemoryPanel';

type StageId = 'llm' | 'rag' | 'assistant' | 'tools' | 'workflow' | 'agent';

const STAGES: { id: StageId; num: number; label: string; sublabel: string; desc: string }[] = [
  { id: 'llm', num: 1, label: 'LLM', sublabel: 'Generation', desc: 'Writes answers from training data — may hallucinate' },
  { id: 'rag', num: 2, label: 'RAG', sublabel: 'Knowledge', desc: 'Retrieves real policy before answering' },
  { id: 'assistant', num: 3, label: 'Assistant', sublabel: 'Context', desc: 'Remembers the conversation across turns' },
  { id: 'tools', num: 4, label: 'Tools', sublabel: 'Actions', desc: 'Searches hotels and checks compliance rules' },
  { id: 'workflow', num: 5, label: 'Workflow', sublabel: 'Fixed order', desc: 'Runs the same steps every time — misses violations' },
  { id: 'agent', num: 6, label: 'Agent', sublabel: 'Decisions', desc: 'Chooses next step, verifies result, corrects itself' },
];

export default function App() {
  const [activeStage, setActiveStage] = useState<StageId>('agent');

  function renderScreen() {
    switch (activeStage) {
      case 'llm': return <LLMScreen />;
      case 'rag': return <PolicyAssistant showMemory={false} />;
      case 'assistant': return <PolicyAssistant showMemory={true} />;
      case 'tools': return <ToolsExplorer />;
      case 'workflow': return <WorkflowVsAgent />;
      case 'agent': return <AgentRun />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      {/* Top nav */}
      <header className="bg-[var(--color-primary)] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>StayGuard</span>
            <span className="text-xs text-white/60 ml-2">Corporate Hotel Booking Agent</span>
          </div>
        </div>
        <div className="text-xs text-white/50 font-mono hidden md:block">
          Goal: Book Paris · 3 nights · Grade L4 · Budget Rs 45,000
        </div>
      </header>

      {/* Stage ladder */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-0 overflow-x-auto flex-shrink-0">
        <div className="flex items-stretch min-w-max max-w-6xl mx-auto">
          {STAGES.map((stage, i) => {
            const isActive = stage.id === activeStage;
            const isCompleted =
              stage.num < STAGES.find((s) => s.id === activeStage)!.num;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`group flex items-center gap-0 flex-1 min-w-0 relative transition-colors ${
                  isActive ? 'bg-[var(--color-blue-bg)]' : 'hover:bg-[var(--color-surface)]'
                }`}
              >
                {/* Connector line */}
                {i > 0 && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 z-10 border-y-[20px] border-y-transparent ${
                    isActive ? 'border-l-[12px] border-l-white' : 'border-l-[12px] border-l-[var(--color-border)]'
                  }`} />
                )}

                <div className="flex items-center gap-3 px-5 py-3.5 flex-1 min-w-0 ml-3">
                  {/* Number badge */}
                  <span className={`w-7 h-7 rounded-full text-xs font-mono font-semibold flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white'
                      : isCompleted
                      ? 'bg-[var(--color-green)] text-white'
                      : 'bg-[var(--color-border)] text-[var(--color-muted)]'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : stage.num}
                  </span>

                  {/* Labels */}
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-semibold leading-none ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}
                       style={{ fontFamily: 'var(--font-display)' }}>
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">{stage.sublabel}</p>
                  </div>
                </div>

                {/* Active underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active stage description */}
      <div className="bg-white border-b border-[var(--color-border)] px-6 py-2.5 flex-shrink-0">
        <p className="text-xs text-[var(--color-muted)] max-w-6xl mx-auto">
          <span className="font-semibold text-[var(--color-text)]">{STAGES.find((s) => s.id === activeStage)?.label}:</span>{' '}
          {STAGES.find((s) => s.id === activeStage)?.desc}
        </p>
      </div>

      {/* Screen content */}
      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>
    </div>
  );
}
