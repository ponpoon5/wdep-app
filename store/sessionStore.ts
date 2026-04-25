'use client';

import { create } from 'zustand';
import { WDEPSession, ChatMessage } from '@/lib/types';
import { saveSession, createSession } from '@/lib/storage';

interface SessionStore {
  activeSession: WDEPSession | null;
  currentQuestionId: number;
  startSession: () => void;
  loadSession: (session: WDEPSession) => void;
  setAnswer: (questionId: number, answer: string) => void;
  addChatMessage: (questionId: number, message: ChatMessage) => void;
  setCommitmentScore: (score: number) => void;
  completeSession: () => void;
  goToQuestion: (id: number) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,
  currentQuestionId: 1,

  startSession: () => {
    const session = createSession();
    saveSession(session);
    set({ activeSession: session, currentQuestionId: 1 });
  },

  loadSession: (session) => {
    const answeredIds = Object.keys(session.answers).map(Number);
    const lastId = answeredIds.length > 0 ? Math.max(...answeredIds) : 1;
    set({ activeSession: session, currentQuestionId: Math.min(lastId, 21) });
  },

  setAnswer: (questionId, answer) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const updated: WDEPSession = {
      ...activeSession,
      answers: { ...activeSession.answers, [questionId]: answer },
      updatedAt: new Date().toISOString(),
    };
    saveSession(updated);
    set({ activeSession: updated });
  },

  addChatMessage: (questionId, message) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const existing = activeSession.chatHistories[questionId] ?? [];
    const updated: WDEPSession = {
      ...activeSession,
      chatHistories: {
        ...activeSession.chatHistories,
        [questionId]: [...existing, message],
      },
      updatedAt: new Date().toISOString(),
    };
    saveSession(updated);
    set({ activeSession: updated });
  },

  setCommitmentScore: (score) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const updated: WDEPSession = {
      ...activeSession,
      commitmentScore: score,
      updatedAt: new Date().toISOString(),
    };
    saveSession(updated);
    set({ activeSession: updated });
  },

  completeSession: () => {
    const { activeSession } = get();
    if (!activeSession) return;
    const updated: WDEPSession = {
      ...activeSession,
      completed: true,
      updatedAt: new Date().toISOString(),
    };
    saveSession(updated);
    set({ activeSession: updated });
  },

  goToQuestion: (id) => set({ currentQuestionId: id }),

  clearSession: () => set({ activeSession: null, currentQuestionId: 1 }),
}));
