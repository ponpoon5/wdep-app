'use client';

import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, RefreshCw, Download, Sparkles } from 'lucide-react';
import { WDEPSession } from '@/lib/types';
import { QUESTIONS, PHASE_LABELS, PHASE_TEXT, PHASE_BG } from '@/lib/questions';
import { WDEP_KNOWLEDGE } from '@/lib/wdep-knowledge';
import { recordUsage } from '@/lib/usage';
import { Button } from '../ui/Button';

interface SessionSummaryProps {
  session: WDEPSession;
  onRestart: () => void;
}

const PHASES = ['W', 'D', 'E', 'P'] as const;

function exportMarkdown(session: WDEPSession, advice?: string) {
  const date = new Date(session.createdAt).toLocaleDateString('ja-JP');
  const lines: string[] = [
    `# WDEPセッション記録`,
    ``,
    `**日付:** ${date}`,
    session.commitmentScore !== undefined ? `**コミットメントスコア:** ${session.commitmentScore}/10` : '',
    ``,
  ];

  if (advice) {
    lines.push(`## AIによる振り返りアドバイス`);
    lines.push('');
    lines.push(advice.trim());
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  for (const phase of PHASES) {
    lines.push(`## ${PHASE_LABELS[phase]}`);
    lines.push('');
    for (const q of QUESTIONS.filter((q) => q.phase === phase)) {
      lines.push(`### Q${q.id}. ${q.text}`);
      lines.push('');
      lines.push(session.answers[q.id]?.trim() || '_（未回答）_');
      lines.push('');
    }
  }

  const blob = new Blob([lines.filter((l) => l !== null).join('\n')], { type: 'text/markdown; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wdep-${date.replace(/\//g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildAdviceSystemPrompt(): string {
  return `あなたはWDEPフレームワーク（選択理論カウンセリング）の専門コーチです。
以下の知識を背景として持ち、アドバイスに活かしてください：

${WDEP_KNOWLEDGE}
---

ユーザーが21問のWDEPセッションを完了しました。
全回答を読み、以下の観点で日本語のアドバイスを提供してください。

1. **強みと気づき** — 回答から見えるユーザーの強みや重要な気づきを伝える
2. **欲求と行動のズレ** — WantsとDoingに矛盾や改善余地があれば指摘する
3. **具体的な次のステップ** — Planに基づいた実践的なアクションを2〜3個提案する
4. **一言メッセージ** — 励ましと前進を促す短いメッセージで締める

トーン: 温かく共感的。批判せず、ユーザーの自律性を尊重する。`;
}

function buildAdviceUserMessage(session: WDEPSession): string {
  const lines: string[] = ['以下が私のWDEPセッションの全回答です。振り返りとアドバイスをお願いします。', ''];
  for (const phase of PHASES) {
    lines.push(`【${PHASE_LABELS[phase]}】`);
    for (const q of QUESTIONS.filter((q) => q.phase === phase)) {
      const answer = session.answers[q.id]?.trim();
      if (answer) {
        lines.push(`Q${q.id}: ${q.text}`);
        lines.push(`→ ${answer}`);
        lines.push('');
      }
    }
  }
  if (session.commitmentScore !== undefined) {
    lines.push(`コミットメントスコア: ${session.commitmentScore}/10`);
  }
  return lines.join('\n');
}

export function SessionSummary({ session, onRestart }: SessionSummaryProps) {
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(['W']));
  const [advice, setAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [adviceModel, setAdviceModel] = useState<'claude' | 'gemini'>('claude');

  const toggle = (phase: string) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const handleGetAdvice = async () => {
    setAdvice('');
    setIsLoadingAdvice(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: buildAdviceUserMessage(session) }],
          systemPrompt: buildAdviceSystemPrompt(),
          model: adviceModel,
          maxTokens: 4096,
        }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let usageBuffer = '';
      let inUsage = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (inUsage) {
          usageBuffer += chunk;
          continue;
        }
        const markerIdx = chunk.indexOf('\x00USAGE:');
        if (markerIdx !== -1) {
          accumulated += chunk.slice(0, markerIdx);
          usageBuffer += chunk.slice(markerIdx + 7);
          inUsage = true;
        } else {
          accumulated += chunk;
        }
        setAdvice(accumulated);
      }
      if (usageBuffer) {
        try {
          const usage = JSON.parse(usageBuffer);
          recordUsage(usage);
        } catch { /* ignore */ }
      }
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const answeredCount = Object.values(session.answers).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">WDEPサイクル完了！</h2>
        <p className="text-gray-500 text-sm">
          {answeredCount} / 21 問に回答 ·{' '}
          {session.commitmentScore !== undefined && `コミットメント: ${session.commitmentScore}/10`}
        </p>
      </div>

      {/* AI Advice */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-violet-700">
            <Sparkles size={14} />
            AIによる振り返りアドバイス
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdviceModel(adviceModel === 'claude' ? 'gemini' : 'claude')}
              className="flex items-center gap-1 text-xs bg-white border border-violet-200 rounded-full px-3 py-2 hover:bg-violet-50 transition-colors text-violet-700"
            >
              {adviceModel === 'claude' ? '✦ Claude' : '✦ Gemini'}
            </button>
            <Button size="sm" onClick={handleGetAdvice} disabled={isLoadingAdvice}>
              {isLoadingAdvice ? '生成中...' : advice ? 'もう一度生成' : 'アドバイスをもらう'}
            </Button>
          </div>
        </div>
        {(advice || isLoadingAdvice) && (
          <div className="bg-white rounded-lg p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {advice || <span className="animate-pulse text-gray-400">▋</span>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {PHASES.map((phase) => {
          const phaseQuestions = QUESTIONS.filter((q) => q.phase === phase);
          const isOpen = openPhases.has(phase);
          return (
            <div key={phase} className={`rounded-xl border-2 overflow-hidden ${PHASE_BG[phase]}`}>
              <button
                onClick={() => toggle(phase)}
                className="w-full flex items-center justify-between p-4"
              >
                <span className={`font-semibold ${PHASE_TEXT[phase]}`}>
                  {PHASE_LABELS[phase]}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {phaseQuestions.map((q) => {
                    const answer = session.answers[q.id];
                    return (
                      <div key={q.id} className="bg-white/70 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Q{q.id}</p>
                        <p className="text-xs text-gray-600 mb-2">{q.text}</p>
                        {answer ? (
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer}</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">未回答</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={() => exportMarkdown(session, advice || undefined)} variant="secondary">
          <Download size={14} />
          Markdownで保存
        </Button>
        <Button onClick={onRestart} variant="secondary">
          <RefreshCw size={14} />
          新しいサイクルを始める
        </Button>
      </div>
    </div>
  );
}
