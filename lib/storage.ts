import { WDEPSession, DailyScore } from './types';

const STORAGE_KEY = 'wdep_sessions';

export function getSessions(): WDEPSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: WDEPSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSession(id: string): WDEPSession | null {
  return getSessions().find((s) => s.id === id) ?? null;
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

const SCORE_KEY = 'wdep_daily_scores';

export function getDailyScores(): DailyScore[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDailyScore(score: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const scores = getDailyScores().filter((s) => s.date !== today);
  scores.push({ date: today, score });
  scores.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createSession(): WDEPSession {
  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    answers: {},
    chatHistories: {},
    completed: false,
  };
}
