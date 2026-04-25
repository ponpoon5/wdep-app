'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Home, CheckCircle } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import { QUESTIONS } from '@/lib/questions';
import { PhaseHeader } from '@/components/wdep/PhaseHeader';
import { QuestionCard } from '@/components/wdep/QuestionCard';
import { AnswerInput } from '@/components/wdep/AnswerInput';
import { AIChat } from '@/components/wdep/AIChat';
import { SessionSummary } from '@/components/wdep/SessionSummary';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AlarmSetter } from '@/components/ui/AlarmSetter';
import { Button } from '@/components/ui/Button';

export default function SessionPage() {
  const router = useRouter();
  const { activeSession, currentQuestionId, startSession, setAnswer, addChatMessage, setCommitmentScore, completeSession, goToQuestion, clearSession } = useSessionStore();

  useEffect(() => {
    if (!activeSession) {
      startSession();
    }
  }, [activeSession, startSession]);

  const question = QUESTIONS.find((q) => q.id === currentQuestionId);

  const answeredCount = activeSession
    ? Object.values(activeSession.answers).filter(Boolean).length
    : 0;

  const answeredIds = activeSession
    ? Object.entries(activeSession.answers)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => Number(k))
    : [];

  const handleAnswer = useCallback(
    (val: string) => {
      setAnswer(currentQuestionId, val);
      if (currentQuestionId === 15) {
        const match = val.match(/\b([1-9]|10)\b/);
        if (match) setCommitmentScore(Number(match[0]));
      }
    },
    [currentQuestionId, setAnswer, setCommitmentScore]
  );

  const handlePrev = () => {
    if (currentQuestionId > 1) goToQuestion(currentQuestionId - 1);
  };

  const handleNext = () => {
    if (currentQuestionId < 21) {
      goToQuestion(currentQuestionId + 1);
    } else {
      completeSession();
    }
  };

  const handleGoHome = () => {
    clearSession();
    router.push('/');
  };

  if (!activeSession || !question) return null;

  if (activeSession.completed) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={handleGoHome}>
              <Home size={14} />
              ホームへ
            </Button>
          </div>
          <SessionSummary
            session={activeSession}
            onRestart={() => { clearSession(); startSession(); }}
          />
        </div>
      </div>
    );
  }

  const wantsAnswers = Object.fromEntries(
    Object.entries(activeSession.answers).filter(([id]) => Number(id) <= 5)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={handleGoHome}>
              <Home size={14} />
              <span className="hidden sm:inline">ホーム</span>
            </Button>
            <AlarmSetter />
          </div>
          <ProgressBar
            current={answeredCount}
            total={21}
            phase={question.phase}
          />
          <div className="mt-3">
            <PhaseHeader
              currentQuestionId={currentQuestionId}
              onNavigate={goToQuestion}
              answeredIds={answeredIds}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <QuestionCard question={question} />

        <AnswerInput
          value={activeSession.answers[currentQuestionId] ?? ''}
          onChange={handleAnswer}
        />

        <AIChat
          question={question}
          currentAnswer={activeSession.answers[currentQuestionId] ?? ''}
          wantsAnswers={wantsAnswers}
          initialMessages={activeSession.chatHistories[currentQuestionId] ?? []}
          onMessage={(msg) => addChatMessage(currentQuestionId, msg)}
        />

        <div className="flex items-center justify-between pt-2 pb-8">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={currentQuestionId === 1}
          >
            <ArrowLeft size={14} />
            前へ
          </Button>
          <span className="text-xs text-gray-400">
            {currentQuestionId} / 21
          </span>
          <Button onClick={handleNext}>
            {currentQuestionId === 21 ? (
              <>
                <CheckCircle size={14} />
                完了する
              </>
            ) : (
              <>
                次へ
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
