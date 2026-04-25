'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const ALARM_MESSAGE = '今の行動は、あなたの欲求達成に役立っていますか？';

export function useAlarm() {
  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const startAlarm = useCallback(
    async (minutes: number) => {
      const granted = await requestPermission();
      if (!granted) {
        alert('通知の許可が必要です。ブラウザの設定から許可してください。');
        return;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        new Notification('WDEP チェックイン', {
          body: ALARM_MESSAGE,
          icon: '/favicon.ico',
        });
      }, minutes * 60 * 1000);
      setIntervalMinutes(minutes);
    },
    [requestPermission]
  );

  const stopAlarm = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIntervalMinutes(null);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { intervalMinutes, startAlarm, stopAlarm };
}
