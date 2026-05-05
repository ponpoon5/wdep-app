'use client';

import { useState, useCallback } from 'react';
import { ChatMessage } from '@/lib/types';
import { recordUsage, calcCost, toYen, AIModel } from '@/lib/usage';

export type { AIModel };

interface UseAIChatOptions {
  systemPrompt: string;
  model: AIModel;
  onMessage?: (message: ChatMessage) => void;
}

export function useAIChat({ systemPrompt, model, onMessage }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `APIエラー (${res.status})`);
        }
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let usageBuffer = '';
        let inUsage = false;

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
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...assistantMsg,
              content: accumulated,
            };
            return updated;
          });
        }

        if (usageBuffer) {
          try {
            const usage = JSON.parse(usageBuffer);
            recordUsage(usage);
            const cost = calcCost(usage.model, usage.inputTokens, usage.outputTokens);
            setLastCost(toYen(cost));
          } catch { /* ignore */ }
        }

        const finalMsg: ChatMessage = { ...assistantMsg, content: accumulated };
        onMessage?.(finalMsg);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `エラー: ${errMsg}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemPrompt, model, onMessage]
  );

  const resetMessages = useCallback((initial: ChatMessage[] = []) => {
    setMessages(initial);
  }, []);

  return { messages, isLoading, sendMessage, resetMessages, lastCost };
}
