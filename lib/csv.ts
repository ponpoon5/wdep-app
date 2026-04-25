import { getSessions, saveSession } from './storage';
import { getUsageSummary, recordUsage, toYen, AIModel } from './usage';
import { QUESTIONS } from './questions';

const Q_IDS = QUESTIONS.map((q) => q.id); // 1-21

function escapeCell(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: unknown[]): string {
  return cells.map(escapeCell).join(',');
}

// ─── EXPORT ────────────────────────────────────────────────────────────────

export function exportCSV() {
  const sessions = getSessions();
  const { byModel, totalCost } = getUsageSummary();
  const lines: string[] = [];

  // ── Sessions section ──
  lines.push('SECTION,SESSIONS');
  lines.push(row('date', 'session_id', 'completed', 'commitment_score', 'answered_count',
    ...Q_IDS.map((id) => `Q${id}`)));

  for (const s of sessions) {
    const date = new Date(s.createdAt).toLocaleDateString('ja-JP');
    const answered = Object.values(s.answers).filter(Boolean).length;
    lines.push(row(
      date, s.id, s.completed, s.commitmentScore ?? '', answered,
      ...Q_IDS.map((id) => s.answers[id] ?? ''),
    ));
  }

  lines.push('');

  // ── Usage section ──
  lines.push('SECTION,USAGE');
  lines.push(row('model', 'input_tokens', 'output_tokens', 'cost_usd', 'cost_yen'));

  for (const [model, d] of Object.entries(byModel)) {
    lines.push(row(model, d.input, d.output, d.cost.toFixed(6), toYen(d.cost)));
  }

  lines.push('');
  lines.push(row('TOTAL', '', '', totalCost.toFixed(6), toYen(totalCost)));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `wdep-export-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── IMPORT ────────────────────────────────────────────────────────────────

export interface ImportResult {
  sessionsAdded: number;
  sessionsSkipped: number;
  usageAdded: { model: string; inputTokens: number; outputTokens: number; costYen: string }[];
  totalCostYen: string;
}

export function importCSV(text: string): ImportResult {
  const lines = text.split(/\r?\n/);
  let section: 'sessions' | 'usage' | null = null;
  let headers: string[] = [];

  const result: ImportResult = {
    sessionsAdded: 0,
    sessionsSkipped: 0,
    usageAdded: [],
    totalCostYen: '',
  };

  const existingIds = new Set(getSessions().map((s) => s.id));
  let totalCostUsd = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Section headers
    if (line.startsWith('SECTION,SESSIONS')) { section = 'sessions'; headers = []; continue; }
    if (line.startsWith('SECTION,USAGE')) { section = 'usage'; headers = []; continue; }
    if (line.startsWith('TOTAL,')) continue;

    const cells = parseCSVRow(line);

    if (headers.length === 0) { headers = cells; continue; }

    if (section === 'sessions') {
      const obj = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
      const id = obj['session_id'];
      if (!id || existingIds.has(id)) { result.sessionsSkipped++; continue; }

      const answers: Record<number, string> = {};
      for (const qid of Q_IDS) {
        const val = obj[`Q${qid}`];
        if (val) answers[qid] = val;
      }

      saveSession({
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        answers,
        chatHistories: {},
        completed: obj['completed'] === 'true',
        commitmentScore: obj['commitment_score'] ? Number(obj['commitment_score']) : undefined,
      });
      existingIds.add(id);
      result.sessionsAdded++;

    } else if (section === 'usage') {
      const obj = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
      const model = obj['model'] as AIModel;
      const inputTokens = Number(obj['input_tokens']) || 0;
      const outputTokens = Number(obj['output_tokens']) || 0;
      const costUsd = Number(obj['cost_usd']) || 0;
      if (!model || (!inputTokens && !outputTokens)) continue;
      recordUsage({ model, inputTokens, outputTokens });
      totalCostUsd += costUsd;
      result.usageAdded.push({ model, inputTokens, outputTokens, costYen: toYen(costUsd) });
    }
  }

  result.totalCostYen = toYen(totalCostUsd);
  return result;
}

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuote = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuote = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}
