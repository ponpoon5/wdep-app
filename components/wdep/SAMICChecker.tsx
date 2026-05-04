'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const SAMIC_ITEMS = [
  {
    key: 'S',
    label: 'Simple',
    labelJa: 'シンプル',
    question: 'この計画は一文で説明できるくらいシンプルで明確ですか？',
    tip: '複雑すぎる計画は実行されにくい。まず最小の行動に絞ってみましょう。',
  },
  {
    key: 'A',
    label: 'Attainable',
    labelJa: '達成可能',
    question: '今のあなたに達成可能な難易度ですか？高すぎず低すぎませんか？',
    tip: '「少し頑張れば届く」レベルが理想。高すぎると挫折し、低すぎると成長がない。',
  },
  {
    key: 'M',
    label: 'Measurable',
    labelJa: '測定可能',
    question: '達成できたかどうかを数字や具体的な基準で確認できますか？',
    tip: '「毎日30分」「週3回」のように数値化することで達成を客観的に確認できる。',
  },
  {
    key: 'I',
    label: 'Immediate',
    labelJa: '即時的',
    question: '「いつか」ではなく今日・明日からすぐに始められますか？',
    tip: '開始を先延ばしにすると実行率が大幅に低下する。今日できる最小の一歩を設定しよう。',
  },
  {
    key: 'C¹',
    label: 'Controlled',
    labelJa: '自己管理',
    question: '他者や環境に左右されず、自分一人の意思で実行できますか？',
    tip: '他者の協力が前提の計画は不安定。まず自分だけでできる行動から始めよう。',
  },
  {
    key: 'C²',
    label: 'Committed',
    labelJa: 'コミット済み',
    question: '必ず実行するという確信がありますか？声に出して「やる」と言えますか？',
    tip: 'コミットメントを言語化（宣言）すると実行率が上がる。誰かに伝えるとさらに効果的。',
  },
  {
    key: 'C³',
    label: 'Consistent',
    labelJa: '一貫性',
    question: '毎日・毎週など、定期的に一貫して続けられる行動ですか？',
    tip: '「毎○曜日の○時」という習慣に落とし込むほうが継続しやすい。',
  },
] as const;

const EMPTY_CHECKS = Array(SAMIC_ITEMS.length).fill(false) as boolean[];

const AI_SYSTEM_PROMPT = `あなたはリアリティセラピーの専門コーチです。ユーザーが立てた行動計画をSAMIC3の7つの基準で評価してください。

SAMIC3基準:
- S（Simple）: シンプルで一文で説明できるか
- A（Attainable）: 今の自分に達成可能か
- M（Measurable）: 数字や具体的基準で測定できるか
- I（Immediate）: 今日・明日からすぐ始められるか
- C¹（Controlled）: 他者に左右されず自分一人で実行できるか
- C²（Committed）: 必ず実行するという確信があるか
- C³（Consistent）: 定期的に一貫して続けられるか

各基準について「○（満たしている）」「△（改善の余地あり）」「×（満たしていない）」で評価し、△や×の項目には具体的な改善提案を1つ提示してください。温かく励ましのトーンで、250字以内で回答してください。日本語で。`;

interface SAMICCheckerProps {
  answer: string;
  checks: boolean[];
  onChecksChange: (checks: boolean[]) => void;
}

export function SAMICChecker({ answer, checks, onChecksChange }: SAMICCheckerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const safeChecks = checks.length === SAMIC_ITEMS.length ? checks : EMPTY_CHECKS;
  const score = safeChecks.filter(Boolean).length;
  const allChecked = score === SAMIC_ITEMS.length;

  const toggleCheck = (i: number) => {
    const next = [...safeChecks];
    next[i] = !next[i];
    onChecksChange(next);
  };

  const handleAIEval = async () => {
    if (!answer.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setAiResult('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `以下の行動計画をSAMIC3基準で評価してください：\n\n${answer}` }],
          systemPrompt: AI_SYSTEM_PROMPT,
          model: 'claude',
          maxTokens: 600,
        }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const markerIdx = chunk.indexOf('\x00USAGE:');
        accumulated += markerIdx !== -1 ? chunk.slice(0, markerIdx) : chunk;
        setAiResult(accumulated);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const uncheckedLabels = SAMIC_ITEMS.filter((_, i) => !safeChecks[i]).map((item) => item.labelJa);

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 py-2 text-sm font-medium text-emerald-700"
        >
          <span className="text-base">☑</span>
          SAMIC3 チェック
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              allChecked
                ? 'bg-emerald-500 text-white'
                : score > 0
                ? 'bg-emerald-200 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {score} / {SAMIC_ITEMS.length}
          </span>
        </button>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-emerald-600">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-emerald-100">
          {/* Description */}
          <p className="px-3 pt-2.5 pb-1 text-xs text-gray-500 leading-relaxed">
            効果的な計画の7基準（SAMIC3）で自己チェックしましょう。各項目を読んで、満たせていると思ったら✓してください。
          </p>

          {/* Checklist */}
          <div className="px-3 py-2 space-y-1.5">
            {SAMIC_ITEMS.map((item, i) => (
              <button
                key={item.key}
                onClick={() => toggleCheck(i)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                  safeChecks[i] ? 'bg-emerald-100' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    safeChecks[i] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'
                  }`}
                >
                  {safeChecks[i] && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-mono">
                      {item.key}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {item.label} — {item.labelJa}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">{item.question}</p>
                  {!safeChecks[i] && (
                    <p className="text-[11px] text-amber-600 mt-1 leading-snug">{item.tip}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Score summary */}
          <div className="px-3 pb-2">
            {allChecked ? (
              <div className="bg-emerald-500 text-white text-xs text-center py-2 rounded-lg font-medium">
                全基準クリア！この計画は実行力が高いです
              </div>
            ) : score > 0 ? (
              <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs px-3 py-2 rounded-lg leading-relaxed">
                <span className="font-semibold">未チェック: </span>
                {uncheckedLabels.join('・')} を見直すと計画の質が上がります。
              </div>
            ) : null}
          </div>

          {/* AI Evaluation */}
          <div className="px-3 pb-3 pt-2 border-t border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleAIEval}
                disabled={!answer.trim() || isEvaluating}
                className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <Sparkles size={12} />
                {isEvaluating ? 'AIが評価中...' : 'AIにSAMIC3評価をしてもらう'}
              </button>
              {!answer.trim() && (
                <span className="text-[10px] text-gray-400">回答を入力してから使えます</span>
              )}
            </div>
            {(aiResult || isEvaluating) && (
              <div className="bg-white rounded-lg p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap border border-emerald-100">
                {aiResult || <span className="animate-pulse text-gray-400">▋</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
