export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WDEPSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  answers: Record<number, string>;
  chatHistories: Record<number, ChatMessage[]>;
  commitmentScore?: number;
  completed: boolean;
}

export interface DailyScore {
  date: string; // YYYY-MM-DD
  score: number; // 1-10
}

export interface Question {
  id: number;
  phase: 'W' | 'D' | 'E' | 'P';
  text: string;
  analysis: string;
  hint: string;
  aiPrompt: string;
}

export type NeedKey = 'love' | 'power' | 'freedom' | 'fun' | 'survival';

export interface NeedScore {
  strength: number;
  satisfaction: number;
}

export type NeedScores = Record<NeedKey, NeedScore>;

export interface NeedAssessmentRecord {
  id: string;
  date: string;
  scores: NeedScores;
  smallStep: string;
  topGapNeed: NeedKey;
  sessionId?: string;
}
