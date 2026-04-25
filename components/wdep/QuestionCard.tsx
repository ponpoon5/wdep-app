'use client';

import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Question } from '@/lib/types';
import { PHASE_BG, PHASE_TEXT, PHASE_COLORS } from '@/lib/questions';

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className={`rounded-xl border-2 p-5 ${PHASE_BG[question.phase]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${PHASE_COLORS[question.phase]} text-white text-sm font-bold`}
        >
          {question.id}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${PHASE_TEXT[question.phase]}`}>
          {question.phase}フェーズ
        </span>
      </div>
      <p className={`text-xs font-medium ${PHASE_TEXT[question.phase]} mb-2 leading-snug`}>
        {question.analysis}
      </p>
      <p className="text-gray-800 font-medium leading-relaxed text-base mb-3">
        {question.text}
      </p>
      <button
        onClick={() => setShowHint(!showHint)}
        className={`flex items-center gap-1 text-xs ${PHASE_TEXT[question.phase]} hover:opacity-70 transition-opacity`}
      >
        <Lightbulb size={12} />
        ヒント
        {showHint ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {showHint && (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-white/60 rounded-lg p-3">
          {question.hint}
        </p>
      )}
    </div>
  );
}
