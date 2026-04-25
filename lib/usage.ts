export type AIModel = 'claude' | 'gemini';

const JPY_RATE = 155;

const USAGE_KEY = 'wdep_api_usage';

const PRICES: Record<AIModel, { input: number; output: number }> = {
  claude: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  gemini: { input: 0.10 / 1_000_000, output: 0.40 / 1_000_000 },
};

export function calcCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  return inputTokens * PRICES[model].input + outputTokens * PRICES[model].output;
}

export function toYen(usd: number): string {
  const yen = usd * JPY_RATE;
  if (yen < 0.01) return '< ¥0.01';
  return `¥${yen.toFixed(2)}`;
}

interface UsageEntry {
  model: AIModel;
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
