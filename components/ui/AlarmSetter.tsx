'use client';

import { Bell, BellOff } from 'lucide-react';
import { useAlarm } from '@/hooks/useAlarm';
import { Button } from './Button';

export function AlarmSetter() {
  const { intervalMinutes, startAlarm, stopAlarm } = useAlarm();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <Bell size={12} />
        チェックインアラーム
      </span>
      {intervalMinutes ? (
        <Button size="sm" variant="secondary" onClick={stopAlarm}>
          <BellOff size={12} />
          {intervalMinutes}分ごと（停止）
        </Button>
      ) : (
        <>
          {[15, 20, 30].map((m) => (
            <Button
              key={m}
              size="sm"
              variant="ghost"
              onClick={() => startAlarm(m)}
            >
              {m}分
            </Button>
          ))}
        </>
      )}
    </div>
  );
}
