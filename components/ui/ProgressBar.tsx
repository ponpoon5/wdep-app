'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  phase: string;
}

const PHASE_BAR_COLOR: Record<string, string> = {
  W: 'bg-violet-500',
  D: 'bg-blue-500',
  E: 'bg-amber-500',
  P: 'bg-emerald-500',
};

export function ProgressBar({ current, total, phase }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} / {total} 問</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${PHASE_BAR_COLOR[phase] ?? 'bg-gray-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
