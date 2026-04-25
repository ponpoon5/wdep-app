'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Download, Upload } from 'lucide-react';
import { getSessions, deleteSession } from '@/lib/storage';
import { getUsageSummary, clearUsage, toYen } from '@/lib/usage';
import { WDEPSession } from '@/lib/types';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { CommitmentTracker } from '@/components/dashboard/CommitmentTracker';
import { Button } from '@/components/ui/Button';
import { useSessionStore } from '@/store/sessionStore';
import { exportCSV, importCSV, ImportResult } from '@/lib/csv';

export default function DashboardPage() {
  const router = useRouter();
  const { startSession, loadSession } = useSessionStore();
  const [sessions, setSessions] = useState<WDEPSession[]>([]);
  const [usageSummary, setUsageSummary] = useState<ReturnType<typeof getUsageSummary> | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSessions(getSessions());
    setUsageSummary(getUsageSummary());
  }, []);

  const handleStart = () => {
    startSession();
    router.push('/session');
  };

  const handleContinue = (session: WDEPSession) => {
    loadSession(session);
    router.push('/session');
  };

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(getSessions());
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importCSV(text);
      setSessions(getSessions());
      setUsageSummary(getUsageSummary());
      setImportResult(result);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const avgCommitment = sessions
    .filter((s) => s.commitmentScore !== undefined)
    .reduce((sum, s, _, arr) => sum + (s.commitmentScore ?? 0) / arr.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">WDEP</h1>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
            欲望を原動力に、自分の本当の欲求を掘り起こす。<br />
            WDEPサイクルを回して、人生を変えよう。
          </p>

          {sessions.length > 0 && avgCommitment > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm">
              <Sparkles size={14} />
              平均コミットメント: {avgCommitment.toFixed(1)} / 10
            </div>
          )}
        </header>

        <div className="mb-8">
          <CommitmentTracker />
        </div>

        {usageSummary && usageSummary.totalCost > 0 && (
          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">API 使用料金（累計）</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">
                  {toYen(usageSummary.totalCost)}
                </span>
                <button
                  onClick={() => { clearUsage(); setUsageSummary(getUsageSummary()); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  リセット
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {Object.entries(usageSummary.byModel).map(([m, d]) => (
                <div key={m} className="flex justify-between text-xs text-gray-500">
                  <span>{m === 'claude' ? '✦ Claude' : '✦ Gemini'}</span>
                  <span>入力 {d.input.toLocaleString()} tok / 出力 {d.output.toLocaleString()} tok — {toYen(d.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 text-center space-y-3">
          <Button size="lg" onClick={handleStart}>
            <Sparkles size={16} />
            新しいWDEPサイクルを始める
          </Button>
          <div className="flex justify-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 border border-gray-200 rounded-lg px-3 py-2 bg-white transition-colors"
            >
              <Download size={12} />
              CSVエクスポート
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 border border-gray-200 rounded-lg px-3 py-2 bg-white transition-colors"
            >
              <Upload size={12} />
              CSVインポート
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>
        </div>

        {importResult && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-700">インポート完了</span>
              <button onClick={() => setImportResult(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="text-xs text-emerald-800 space-y-1">
              <div>セッション追加: <span className="font-bold">{importResult.sessionsAdded}</span> 件 / スキップ: {importResult.sessionsSkipped} 件</div>
              {importResult.usageAdded.length > 0 && (
                <>
                  <div className="mt-1 font-medium">取り込んだAPI使用量:</div>
                  {importResult.usageAdded.map((u, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{u.model === 'claude' ? '✦ Claude' : '✦ Gemini'}</span>
                      <span>{u.inputTokens.toLocaleString()} / {u.outputTokens.toLocaleString()} tok — {u.costYen}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t border-emerald-200 pt-1 mt-1">
                    <span>合計追加料金</span>
                    <span>{importResult.totalCostYen}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {sessions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              過去のサイクル
            </h2>
            <div className="space-y-3">
              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onContinue={() => handleContinue(s)}
                  onDelete={() => handleDelete(s.id)}
                />
              ))}
            </div>
          </section>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">まだサイクルがありません。</p>
            <p className="text-xs mt-1">上のボタンから始めてみましょう。</p>
          </div>
        )}
      </div>
    </div>
  );
}
