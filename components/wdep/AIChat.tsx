'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessage, Question } from '@/lib/types';
import { WDEP_KNOWLEDGE } from '@/lib/wdep-knowledge';
import { useSessionStore } from '@/store/sessionStore';
import { Button } from '../ui/Button';

interface AIChatProps {
  question: Question;
  currentAnswer: string;
  wantsAnswers: Record<number, string>;
  initialMessages?: ChatMessage[];
  onMessage: (msg: ChatMessage) => void;
}

function buildSystemPrompt(question: Question, currentAnswer: string, wantsAnswers: Record<number, string>): string {
  const wantsSummary = Object.entries(wantsAnswers)
    .filter(([id]) => Number(id) <= 5)
    .map(([id, ans]) => `Q${id}: ${ans}`)
    .join('\n');

  return `あなたはWDEPフレームワーク（選択理論カウンセリング）の専門コーチです。
以下の知識を背景として持ち、コーチングに活かしてください：

${WDEP_KNOWLEDGE}
---

ユーザーが自分の本当の欲求を掘り起こし、人生を変えることをサポートしています。

【現在の質問】Q${question.id}（${question.phase}フェーズ）
${question.text}

【AIのガイドライン】
${question.aiPrompt}

【ユーザーの現在の回答】
${currentAnswer || '（まだ回答なし）'}

【Wantsフェーズの回答（参考）】
${wantsSummary || '（まだなし）'}

指示：
- 共感的で温かいトーンで接してください
- 批判・評価はしないでください
- 質問は一度に1〜2個まで
- 日本語で回答してください
- ユーザーが自分で気づけるよう、答えを言わず問いかけてください
- 短く簡潔に（200字以内を目安）`;
}

export function AIChat({ question, currentAnswer, wantsAnswers, initialMessages = [], onMessage }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { preferredModel, setPreferredModel } = useSessionStore();

  const systemPrompt = buildSystemPrompt(question, currentAnswer, wantsAnswers);
  const { messages, isLoading, sendMessage, resetMessages, lastCost } = useAIChat({
    systemPrompt,
    model: preferredModel,
    onMessage,
  });

  useEffect(() => {
    if (isOpen) {
      resetMessages(initialMessages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/50">
      <div className="flex items-center justify-between px-3 py-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 py-2 text-sm font-medium text-violet-700"
        >
          <Sparkles size={14} />
          AIと深掘りする
          {messages.length > 0 && (
            <span className="bg-violet-200 text-violet-700 text-xs px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreferredModel(preferredModel === 'claude' ? 'gemini' : 'claude')}
            className="text-xs bg-white border border-violet-200 rounded-full px-3 py-2"
          >
            {preferredModel === 'claude' ? '✦ Claude' : '✦ Gemini'}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-violet-700">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-violet-100">
          <div className="max-h-72 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                この質問についてAIと対話しましょう。<br />
                気になること、引っかかることを自由に話しかけてください。
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${msg.role === 'assistant' ? 'bg-violet-500' : 'bg-gray-400'}`}>
                  {msg.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-white text-gray-800' : 'bg-violet-600 text-white'}`}>
                  {msg.content || <span className="animate-pulse">▋</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {lastCost && (
            <div className="px-3 py-1 text-right">
              <span className="text-xs text-gray-400">直近: {lastCost}</span>
            </div>
          )}
          <div className="p-3 border-t border-violet-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send size={12} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
