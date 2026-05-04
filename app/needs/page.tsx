'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Save, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NeedKey, NeedScores, NeedAssessmentRecord } from '@/lib/types';
import { getNeedAssessments, saveNeedAssessment, deleteNeedAssessment } from '@/lib/storage';

// ── Constants ──────────────────────────────────────────────────────────────

type NeedMeta = {
  key: NeedKey;
  label: string;
  shortLabel: string;
  color: string;
  strengthQ: string;
  satisfactionQ: string;
  feedback: string;
};

const NEED_META: NeedMeta[] = [
  {
    key: 'love',
    label: '愛と所属',
    shortLabel: '愛',
    color: '#f43f5e',
    strengthQ: '他の人と協力して何かをしたり、長期的な友人関係や人間関係を築きたいという思いはどのくらい強いですか？',
    satisfactionQ: '現在、周囲の人（友人、同僚、家族など）から必要とされ、認められているとどの程度感じていますか？',
    feedback: 'あなたは人とのつながりや、誰かに必要とされる感覚を強く求めている可能性があります。来週、この満足度を1だけ上げるために、誰と、どのような関わりを少し増やせそうですか？',
  },
  {
    key: 'power',
    label: '力・自己価値',
    shortLabel: '力',
    color: '#f59e0b',
    strengthQ: '有能感を得たり、リーダーシップを発揮したりして、自分自身の能力を生かす機会を求める気持ちはどのくらい強いですか？',
    satisfactionQ: '現在の生活環境（学校、職場、家庭など）において、自分の成果や存在価値をどの程度実感できていますか？',
    feedback: 'あなたは自分の力を発揮したり、成果や成長を実感したりすることを求めている可能性があります。来週、この満足度を1だけ上げるために、自分の能力を少しでも使える行動は何ですか？',
  },
  {
    key: 'freedom',
    label: '自由',
    shortLabel: '自',
    color: '#3b82f6',
    strengthQ: '制限を受けず、自律して独立した行動をとりたい、または自発的・柔軟に行動したいという思いはどのくらい強いですか？',
    satisfactionQ: '現在の生活環境において、十分な自由や自分の裁量権があると感じている度合いはどのくらいですか？',
    feedback: 'あなたは自分で選び、自分の裁量で動ける感覚を求めている可能性があります。来週、この満足度を1だけ上げるために、自分で決められる範囲を少し広げる行動は何ですか？',
  },
  {
    key: 'fun',
    label: '楽しみ',
    shortLabel: '楽',
    color: '#10b981',
    strengthQ: '義務と遊びのバランスを取り、生活の中で楽しい経験をしたいという欲求はどのくらい強いですか？',
    satisfactionQ: '現在、心から楽しいと思える時間や経験をどの程度得られていますか？',
    feedback: 'あなたは生活の中に楽しさ、遊び、好奇心、リラックスできる時間を求めている可能性があります。来週、この満足度を1だけ上げるために、短時間でも楽しめることは何ですか？',
  },
  {
    key: 'survival',
    label: '生存・健康',
    shortLabel: '健',
    color: '#8b5cf6',
    strengthQ: '安全な環境で暮らし、自分自身の心と身体の健康、セルフケアや休息を大切にしたいという気持ちはどのくらい強いですか？',
    satisfactionQ: '現在の環境は、心身の健康をサポートするのに十分安全で、満たされているとどの程度感じますか？',
    feedback: 'あなたは安心感、休息、心身の健康を整えることを求めている可能性があります。来週、この満足度を1だけ上げるために、睡眠、食事、休息、環境調整の中で何ができそうですか？',
  },
];

const KEYS: NeedKey[] = ['love', 'power', 'freedom', 'fun', 'survival'];

const DEFAULT_SCORES: NeedScores = {
  love: { strength: 5, satisfaction: 5 },
  power: { strength: 5, satisfaction: 5 },
  freedom: { strength: 5, satisfaction: 5 },
  fun: { strength: 5, satisfaction: 5 },
  survival: { strength: 5, satisfaction: 5 },
};

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Radar Chart ────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: NeedScores }) {
  const cx = 100, cy = 100, r = 72;
  const ANGLES = [-90, -18, 54, 126, 198]; // degrees, top then clockwise

  function toXY(idx: number, value: number) {
    const rad = (ANGLES[idx] * Math.PI) / 180;
    return {
      x: cx + (value / 10) * r * Math.cos(rad),
      y: cy + (value / 10) * r * Math.sin(rad),
    };
  }

  function labelPos(idx: number) {
    const rad = (ANGLES[idx] * Math.PI) / 180;
    const offset = r + 16;
    return { x: cx + offset * Math.cos(rad), y: cy + offset * Math.sin(rad) };
  }

  function textAnchor(idx: number): 'middle' | 'start' | 'end' {
    const lx = labelPos(idx).x;
    if (lx < cx - 5) return 'end';
    if (lx > cx + 5) return 'start';
    return 'middle';
  }

  const strengthPts = KEYS.map((k, i) => toXY(i, scores[k].strength));
  const satisfactionPts = KEYS.map((k, i) => toXY(i, scores[k].satisfaction));
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg viewBox="0 0 200 220" className="w-full max-w-[280px] mx-auto">
      {/* Background pentagons */}
      {[2, 4, 6, 8, 10].map((level) => {
        const pts = KEYS.map((_, i) => toXY(i, level));
        return (
          <polygon
            key={level}
            points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.8"
          />
        );
      })}
      {/* Axes */}
      {KEYS.map((_, i) => {
        const end = toXY(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="#e5e7eb" strokeWidth="0.8" />;
      })}
      {/* Grid level labels */}
      {[4, 8].map((level) => {
        const p = toXY(0, level);
        return (
          <text key={level} x={(p.x + 2).toFixed(1)} y={(p.y).toFixed(1)} fontSize="5" fill="#d1d5db" textAnchor="start">
            {level}
          </text>
        );
      })}
      {/* Strength polygon */}
      <path d={toPath(strengthPts)} fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Satisfaction polygon */}
      <path d={toPath(satisfactionPts)} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Axis labels */}
      {NEED_META.map((m, i) => {
        const lp = labelPos(i);
        return (
          <text key={m.key} x={lp.x.toFixed(1)} y={(lp.y + 3).toFixed(1)} fontSize="9" fill={m.color} textAnchor={textAnchor(i)} fontWeight="bold">
            {m.shortLabel}
          </text>
        );
      })}
      {/* Legend */}
      <rect x="14" y="204" width="8" height="8" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1" />
      <text x="25" y="211" fontSize="7" fill="#6b7280">欲求の強さ</text>
      <rect x="104" y="204" width="8" height="8" fill="rgba(16,185,129,0.3)" stroke="#10b981" strokeWidth="1" />
      <text x="115" y="211" fontSize="7" fill="#6b7280">現在の充足度</text>
    </svg>
  );
}

// ── Gap Bar Chart ──────────────────────────────────────────────────────────

function GapBarChart({ scores }: { scores: NeedScores }) {
  const rowH = 28, labelW = 60, chartW = 118, pad = 6;
  const svgW = labelW + chartW + 28;
  const svgH = KEYS.length * rowH + pad * 2;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
      {KEYS.map((k, i) => {
        const meta = NEED_META.find((m) => m.key === k)!;
        const gap = Math.max(0, scores[k].strength - scores[k].satisfaction);
        const barW = (gap / 10) * chartW;
        const y = pad + i * rowH;
        return (
          <g key={k}>
            <text x={labelW - 4} y={y + rowH / 2 + 3} textAnchor="end" fontSize="8" fill="#6b7280">
              {meta.label}
            </text>
            <rect x={labelW} y={y + 4} width={chartW} height={rowH - 8} fill="#f3f4f6" rx="3" />
            {barW > 0 && (
              <rect x={labelW} y={y + 4} width={barW} height={rowH - 8} fill={meta.color} rx="3" opacity="0.75" />
            )}
            <text x={labelW + Math.max(barW, 2) + 4} y={y + rowH / 2 + 3} fontSize="8" fill="#374151">
              {gap > 0 ? `+${gap}` : '0'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Slider ─────────────────────────────────────────────────────────────────

function NeedSlider({
  type, question, value, onChange, color,
}: {
  type: 'strength' | 'satisfaction';
  question: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  const isStrength = type === 'strength';
  const accentColor = isStrength ? color : '#10b981';
  const label = isStrength ? '欲求の強さ' : '現在の充足度';
  const scaleHint = isStrength ? '全くない → 非常に強い' : '全く満たされていない → 完全に満たされている';

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <span className="text-xs font-semibold block mb-0.5" style={{ color: accentColor }}>{label}</span>
          <span className="text-xs text-gray-500 leading-snug">{question}</span>
        </div>
        <span className="text-xl font-bold shrink-0 tabular-nums" style={{ color: accentColor }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor }}
      />
      <div className="flex justify-between text-[10px] text-gray-300">
        <span>0</span>
        <span className="text-center hidden sm:block">{scaleHint}</span>
        <span>10</span>
      </div>
    </div>
  );
}

// ── History ────────────────────────────────────────────────────────────────

function HistoryView() {
  const [records, setRecords] = useState<NeedAssessmentRecord[]>([]);

  useEffect(() => {
    setRecords(getNeedAssessments());
  }, []);

  const handleDelete = (id: string) => {
    deleteNeedAssessment(id);
    setRecords(getNeedAssessments());
  };

  if (records.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">まだ記録がありません。</p>;
  }

  return (
    <div className="space-y-3">
      {records.map((rec) => {
        const topMeta = NEED_META.find((m) => m.key === rec.topGapNeed)!;
        return (
          <div key={rec.id} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">{rec.date}</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ background: topMeta.color }}
                >
                  最大ギャップ: {topMeta.label}
                </span>
                <button onClick={() => handleDelete(rec.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1 mb-3">
              {KEYS.map((k) => {
                const meta = NEED_META.find((m) => m.key === k)!;
                const s = rec.scores[k];
                const gap = Math.max(0, s.strength - s.satisfaction);
                return (
                  <div key={k} className="text-center bg-gray-50 rounded-lg py-2">
                    <div className="text-xs font-bold" style={{ color: meta.color }}>{meta.shortLabel}</div>
                    <div className="text-sm font-bold text-gray-700">{s.satisfaction}</div>
                    <div className="text-[10px] text-gray-400">/{s.strength}</div>
                    {gap > 0 && <div className="text-[10px] text-red-400 font-medium">↑{gap}</div>}
                  </div>
                );
              })}
            </div>
            {rec.smallStep && (
              <div className="text-xs text-gray-600 bg-violet-50 rounded-lg p-2.5">
                <span className="font-medium text-violet-600">行動計画: </span>{rec.smallStep}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function NeedsAssessmentPage() {
  const [scores, setScores] = useState<NeedScores>(DEFAULT_SCORES);
  const [smallStep, setSmallStep] = useState('');
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const gaps = [...KEYS]
    .map((k) => ({ key: k, gap: Math.max(0, scores[k].strength - scores[k].satisfaction) }))
    .sort((a, b) => b.gap - a.gap);

  const topGap = gaps[0];
  const topGapMeta = NEED_META.find((m) => m.key === topGap.key)!;
  const hasGap = topGap.gap > 0;

  function updateScore(key: NeedKey, field: 'strength' | 'satisfaction', value: number) {
    setScores((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setSaved(false);
  }

  function handleSave() {
    const record: NeedAssessmentRecord = {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      scores,
      smallStep,
      topGapNeed: topGap.key,
    };
    saveNeedAssessment(record);
    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <Home size={16} />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">5つの基本的欲求チェック</h1>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            いまの自分が本当に求めているものを整理するために、5つの基本的欲求について、欲求の強さと現在の充足度を0〜10で評価します。
          </p>
        </header>

        {/* Sliders */}
        <div className="space-y-4 mb-6">
          {NEED_META.map((meta) => {
            const gap = scores[meta.key].strength - scores[meta.key].satisfaction;
            return (
              <div
                key={meta.key}
                className="rounded-xl border-2 bg-white p-4"
                style={{ borderColor: `${meta.color}40` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: meta.color }}
                  >
                    {meta.shortLabel}
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">{meta.label}</h3>
                  {gap > 0 && (
                    <span className="ml-auto text-xs text-red-400 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                      ギャップ +{gap}
                    </span>
                  )}
                  {gap <= 0 && scores[meta.key].strength > 0 && (
                    <span className="ml-auto text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                      充足
                    </span>
                  )}
                </div>
                <div className="space-y-5">
                  <NeedSlider
                    type="strength"
                    question={meta.strengthQ}
                    value={scores[meta.key].strength}
                    onChange={(v) => updateScore(meta.key, 'strength', v)}
                    color={meta.color}
                  />
                  <NeedSlider
                    type="satisfaction"
                    question={meta.satisfactionQ}
                    value={scores[meta.key].satisfaction}
                    onChange={(v) => updateScore(meta.key, 'satisfaction', v)}
                    color={meta.color}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 mb-4">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-1"
          >
            可視化チャート
            {showCharts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showCharts && (
            <div className="mt-4 space-y-6">
              <div>
                <p className="text-xs text-gray-400 mb-2 text-center">レーダーチャート（欲求の強さ vs 充足度）</p>
                <RadarChart scores={scores} />
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                  {NEED_META.map((m) => (
                    <div key={m.key} className="flex items-center gap-1 text-xs text-gray-500">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                      {m.shortLabel}={m.label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">ギャップ（欲求の強さ − 充足度）</p>
                <GapBarChart scores={scores} />
              </div>
            </div>
          )}
        </div>

        {/* Top 3 gaps */}
        {hasGap && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 mb-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-3">現在、特に満たされていない可能性が高い欲求</h3>
            <ol className="space-y-1.5">
              {gaps.filter((g) => g.gap > 0).slice(0, 3).map((g, i) => {
                const meta = NEED_META.find((m) => m.key === g.key)!;
                return (
                  <li key={g.key} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-amber-600 text-xs">ギャップ {g.gap}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Feedback + Small step */}
        {hasGap && (
          <div
            className="rounded-xl border-2 bg-white p-4 mb-4"
            style={{ borderColor: `${topGapMeta.color}50` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: topGapMeta.color }}
              >
                {topGapMeta.shortLabel}
              </div>
              <h3 className="text-sm font-semibold text-gray-800">フィードバック</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              あなたは「{topGapMeta.label}」を強く求めている一方で、現在の充足度はやや低いようです。
              これは、今のあなたにとって{topGapMeta.label}が大切なテーマになっている可能性があります。
              <br /><br />
              {topGapMeta.feedback}
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                来週のスモールステップを書いてみましょう
              </label>
              <textarea
                value={smallStep}
                onChange={(e) => { setSmallStep(e.target.value); setSaved(false); }}
                placeholder="例：毎朝5分、好きな音楽を聴く時間をつくる"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              />
            </div>
          </div>
        )}

        {/* WDEPへの接続 */}
        {hasGap && (
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 mb-4 text-sm text-violet-700 leading-relaxed">
            このチェック結果を、WDEPサイクルの「Wants（欲求）」に活かしましょう。<br />
            「自分は本当は何を求めているのか」を言語化したら、
            <Link href="/" className="underline font-medium ml-1">WDEPサイクルを始める →</Link>
          </div>
        )}

        {/* Save & History */}
        <div className="flex gap-3 mb-6">
          <Button onClick={handleSave} disabled={saved} className="flex-1">
            <Save size={14} />
            {saved ? '保存済み ✓' : '結果を保存する'}
          </Button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 border border-gray-200 rounded-lg px-3 py-2 bg-white transition-colors"
          >
            <Clock size={12} />
            履歴
          </button>
        </div>

        {showHistory && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">過去のアセスメント</h3>
            <HistoryView />
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          このチェックは、自己理解と行動計画づくりを助けるためのものです。医学的・心理学的な診断を行うものではありません。
        </p>
      </div>
    </div>
  );
}
