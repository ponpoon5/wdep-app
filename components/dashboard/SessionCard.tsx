'use client';

import { Calendar, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { WDEPSession } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { Button } from '../ui/Button';

interface SessionCardProps {
  session: WDEPSession;
  onContinue: () => void;
  onDelete: () => void;
}

export function SessionCard({ session, onContinue, onDelete }: SessionCardProps) {
  const answeredCount = Object.values(session.answers).filter(Boolean).length;
  const pct = Math.round((answeredCount / 21) * 100);
  const wantsPreview = session.answers[2] ?? session.answers[1] ?? '';
  const date = new Date(session.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={12} />
          {date}
          {session.completed ? (
            <span className="flex items-center gap-0.5 text-emerald-600">
              <CheckCircle size={12} />完了
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-amber-600">
              <Clock size={12} />途中
            </span>
          )}
        </div>
        {session.commitmentScore !== undefined && (
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
            コミット {session.commitmentScore}/10
          </span>
        )}
      </div>

      {wantsPreview && (
        <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">
          {wantsPreview}
        </p>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{answeredCount}/21 問</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onContinue} className="flex-1">
          {session.completed ? '振り返る' : '続ける'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
