'use client';

import { QUESTIONS, PHASE_LABELS, PHASE_COLORS } from '@/lib/questions';

interface PhaseHeaderProps {
  currentQuestionId: number;
  onNavigate: (id: number) => void;
  answeredIds: number[];
}

const PHASES = ['W', 'D', 'E', 'P'] as const;

const PHASE_RANGES: Record<string, [number, number]> = {
  W: [1, 5],
  D: [6, 9],
  E: [10, 16],
  P: [17, 21],
};

export function PhaseHeader({ currentQuestionId, onNavigate, answeredIds }: PhaseHeaderProps) {
  const currentPhase = QUESTIONS.find((q) => q.id === currentQuestionId)?.phase ?? 'W';

  return (
    <div className="flex gap-1 sm:gap-2">
      {PHASES.map((phase) => {
        const [start, end] = PHASE_RANGES[phase];
        const isActive = currentPhase === phase;
        const isDone = answeredIds.filter((id) => id >= start && id <= end).length === end - start + 1;

        return (
          <button
            key={phase}
            onClick={() => onNavigate(start)}
            className={`flex-1 rounded-lg px-2 py-3 text-xs font-semibold transition-all ${
              isActive
                ? `bg-gradient-to-r ${PHASE_COLORS[phase]} text-white shadow-sm`
                : isDone
                ? 'bg-gray-100 text-gray-500'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            <div className="text-[10px] opacity-70">{phase}</div>
            <div className="hidden sm:block truncate">{PHASE_LABELS[phase].split('（')[0]}</div>
            {isDone && !isActive && <div className="text-[10px]">✓</div>}
          </button>
        );
      })}
    </div>
  );
}
