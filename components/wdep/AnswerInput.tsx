'use client';

import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';

interface AnswerInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function AnswerInput({ value, onChange, placeholder }: AnswerInputProps) {
  const [local, setLocal] = useState(value);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [local]);

  const handleChange = (val: string) => {
    setLocal(val);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? 'ここに自由に書いてください...'}
        className="w-full min-h-[120px] rounded-xl border border-gray-200 bg-white p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent resize-none transition-all text-sm leading-relaxed"
        rows={4}
      />
      {saved && (
        <span className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-emerald-600">
          <Save size={12} />
          保存済
        </span>
      )}
    </div>
  );
}
