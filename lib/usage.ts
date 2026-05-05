export type AIModel = 'claude-haiku' | 'claude-sonnet' | 'claude-opus' | 'gemini';

const JPY_RATE = 155;

const USAGE_KEY = 'wdep_api_usage';

// USD per token
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-haiku':  { input: 0.80  / 1_000_000, output: 4.00  / 1_000_000 },
  'claude-sonnet': { input: 3.00  / 1_000_000, output: 15.00 / 1_000_000 },
  'claude-opus':   { input: 15.00 / 1_000_000, output: 75.00 / 1_000_000 },
  'gemini':        { input: 0.10  / 1_000_000, output: 0.40  / 1_000_000 },
  // legacy key kept for old localStorage entries
  'claude':        { input: 3.00  / 1_000_000, output: 15.00 / 1_000_000 },
};

export function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICES[model] ?? PRICES['claude-sonnet'];
  return inputTokens * price.input + outputTokens * price.output;
}

export function toYen(usd: number): string {
  const yen = usd * JPY_RATE;
  if (yen < 0.01) return '< ¥0.01';
  return `¥${yen.toFixed(2)}`;
}

interface UsageEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

function load(): UsageEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function recordUsage(entry: UsageEntry) {
  const entries = load();
  entries.push(entry);
  localStorage.setItem(USAGE_KEY, JSON.stringify(entries));
}

export function getUsageSummary() {
  const entries = load();
  const byModel: Record<string, { input: number; output: number; cost: number }> = {};
  let totalCost = 0;

  for (const e of entries) {
    if (!byModel[e.model]) byModel[e.model] = { input: 0, output: 0, cost: 0 };
    byModel[e.model].input += e.inputTokens;
    byModel[e.model].output += e.outputTokens;
    const cost = calcCost(e.model, e.inputTokens, e.outputTokens);
    byModel[e.model].cost += cost;
    totalCost += cost;
  }

  return { byModel, totalCost };
}

export function clearUsage() {
  localStorage.removeItem(USAGE_KEY);
}
