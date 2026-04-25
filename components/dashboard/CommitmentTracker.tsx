'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { getDailyScores, saveDailyScore } from '@/lib/storage';
import { DailyScore } from '@/lib/types';

const CHART_W = 560;
const CHART_H = 120;
const PAD = { top: 12, right: 8, bottom: 24, left: 28 };

function ScoreChart({ scores }: { scores: DailyScore[] }) {
  if (scores.length < 2) return null;

  const recent = scores.slice(-30);
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const xOf = (i: number) => PAD.left + (i / (recent.length - 1)) * innerW;
  const yOf = (s: number) => PAD.top + innerH - ((s - 1) / 9) * innerH;

  const points = recent.map((d, i) => `${xOf(i)},${yOf(d.score)}`).join(' ');
  const area =
    `M${xOf(0)},${yOf(recent[0].score)} ` +
    recent.slice(1).map((d, i) => `L${xOf(i + 1)},${yOf(d.score)}`).join(' ') +
    ` L${xOf(recent.length - 1)},${PAD.top + innerH} L${xOf(0)},${PAD.top + innerH} Z`;

  const gridLines = [2, 4, 6, 8, 10];

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto">
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yOf(v)} x2={CHART_W - PAD.right} y2={yOf(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD.left - 4} y={yOf(v) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}</text>
          </g>
        ))}
        <path d={area} fill="url(#grad)" opacity="0.3" />
        <polyline points={points} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
        {recent.map((d, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(d.score)} r="3" fill="#7c3aed" />
        ))}
        <text x={PAD.left} y={CHART_H - 4} fontSize="9" fill="#9ca3af">{recent[0].date.slice(5)}</text>
        <text x={CHART_W - PAD.right} y={CHART_H - 4} textAnchor="end" fontSize="9" fill="#9ca3af">
          {recent[recent.length - 1].date.slice(5)}
        </text>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function CommitmentTracker() {
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [todayScore, setTodayScore] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const all = getDailyScores();
    setScores(all);
    const todayEntry = all.find((s) => s.date === today);
    if (todayEntry) setTodayScore(todayEntry.score);
  }, [today]);

  const handleScore = (score: number) => {
    saveDailyScore(score);
    setTodayScore(score);
    setScores(getDailyScores());
  };

  const avg = scores.length
    ? (scores.reduce((s, d) => s + d.score, 0) / scores.length).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <TrendingUp size={14} className="text-violet-500" />
          毎日のコミットメント
        </span>
        {avg && <span className="text-xs text-gray-400">平均 {avg} / 10</span>}
      </div>

      <ScoreChart scores={scores} />

      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          今日（{today.slice(5)}）の本気度は？
          {todayScore !== null && <span className="ml-2 text-violet-600 font-medium">{todayScore} / 10 を記録済み</span>}
        </p>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => handleScore(n)}
              className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                todayScore === n
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
