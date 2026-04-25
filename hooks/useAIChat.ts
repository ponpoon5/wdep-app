'use client';

import { useState, useCallback } from 'react';
import { ChatMessage } from '@/lib/types';
import { recordUsage, calcCost, toYen, AIModel as UsageModel } from '@/lib/usage';

export type AIModel = 'claude' | 'gemini';

interface UseAIChatOptions {
  systemPrompt: string;
  onMessage?: (message: ChatMessage) => void;
}

export function useAIChat({ systemPrompt, onMessage }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<AIModel>('claude');
  const [lastCost, setLastCost] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      const userMsg: ChatMessage = {
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      onMessage?.(userMsg);
      setIsLoading(true);

      const apiMessages = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, systemPrompt, model }),
        });

        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const markerIdx = chunk.indexOf('\x00USAGE:');
          if (markerIdx !== -1) {
            accumulated += chunk.slice(0, markerIdx);
            try {
              const usage = JSON.parse(chunk.slice(markerIdx + 7));
              recordUsage(usage);
              const cost = calcCost(usage.model as UsageModel, usage.inputTokens, usage.outputTokens);
              setLastCost(toYen(cost));
            } catch { /* ignore */ }
          } else {
            accumulated += chunk;
          }
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...assistantMsg,
              content: accumulated,
            };
            return updated;
          });
        }

        const finalMsg: ChatMessage = { ...assistantMsg, content: accumulated };
        onMessage?.(finalMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemPrompt, model, onMessage]
  );

  const resetMessages = useCallback((initial: ChatMessage[] = []) => {
    setMessages(initial);
  }, []);

  return { messages, isLoading, sendMessage, resetMessages, model, setModel, lastCost };
}
