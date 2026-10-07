import { StrategyStatus, SystemConfig } from '../../data/models';
import { ratio, shortDate, signedR, usd } from '../../shared/format';

/** "high_lookback" becomes "High lookback". */
export function humanizeKey(key: string): string {
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Keys that look like they hold a secret. The contract forbids secrets here; this is a second lock. */
const SENSITIVE = /(secret|token|password|passwd|api[_-]?key|private|credential)/i;
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE.test(key);
}

export function paramValue(key: string, value: string | number | boolean): string {
  if (isSensitiveKey(key)) return 'Hidden';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

const UNIVERSES: Record<string, string> = {
  nasdaq100: 'Nasdaq 100',
  nyse_top300: 'NYSE top 300',
  both: 'Nasdaq 100 and NYSE top 300',
};
export function universeLabel(name: string): string {
  return UNIVERSES[name] ?? humanizeKey(name);
}

const STATUSES: Record<StrategyStatus, string> = {
  backtest_only: 'Backtest only',
  paper: 'Paper trading',
  live: 'Live',
  paused: 'Paused',
};
export function strategyStatusLabel(status: StrategyStatus): string {
  return STATUSES[status] ?? humanizeKey(status);
}

export interface Line {
  label: string;
  value: string;
}

/** The account limits that are present, in words. */
export function limitLines(config: SystemConfig): Line[] {
  const l = config.limits ?? {};
  const lines: Line[] = [];
  if (config.startingCapital !== undefined) lines.push({ label: 'Starting capital', value: usd(config.startingCapital) });
  if (l.riskPerTradePct !== undefined) lines.push({ label: 'Risk per trade', value: `${l.riskPerTradePct}% of a bot's budget (this is 1R)` });
  if (l.openRiskLimitPct !== undefined) lines.push({ label: 'Open risk limit', value: `${l.openRiskLimitPct}% of capital` });
  if (l.tradeCapPerDay !== undefined) lines.push({ label: 'Trades per day', value: `at most ${l.tradeCapPerDay}` });
  if (l.dailyLossLimitPct !== undefined) lines.push({ label: 'Daily loss limit', value: `${l.dailyLossLimitPct}% of capital` });
  if (l.killSwitchDrawdownPct !== undefined) lines.push({ label: 'Kill switch', value: `trips at a drawdown of ${l.killSwitchDrawdownPct}%` });
  if (config.costs?.costR !== undefined) lines.push({ label: 'Cost and slippage', value: `${config.costs.costR}R per trade` });
  return lines;
}

export interface GateLine {
  label: string;
  rule: string;
}

/** The go-live thresholds, worded exactly as the checklist on each bot report words them. */
export function gateLines(config: SystemConfig): GateLine[] {
  const g = config.goLiveGates ?? {};
  const lines: GateLine[] = [];
  if (g.minClosedTrades !== undefined) lines.push({ label: 'Closed trades', rule: `at least ${g.minClosedTrades}` });
  if (g.minAvgR !== undefined) lines.push({ label: 'Average per trade', rule: `at least ${signedR(g.minAvgR, 2)}` });
  if (g.minProfitFactor !== undefined) lines.push({ label: 'Profit factor', rule: `at least ${g.minProfitFactor}` });
  if (g.maxDrawdownPct !== undefined) lines.push({ label: 'Largest drawdown', rule: `within ${g.maxDrawdownPct}% of budget` });
  if (g.minProfitableWeeksPct !== undefined) lines.push({ label: 'Profitable weeks', rule: `at least ${g.minProfitableWeeksPct}%` });
  if (g.maxPaperBacktestGapR !== undefined) lines.push({ label: 'Paper close to backtest', rule: `within ${g.maxPaperBacktestGapR}R` });
  return lines;
}

export function rewardToRiskLabel(rr: number): string {
  return ratio(rr);
}

/** A warning when the bots' budgets do not add up to the starting capital, otherwise undefined. */
export function budgetNotice(config: SystemConfig): string | undefined {
  if (config.startingCapital === undefined || config.strategies.length === 0) return undefined;
  const total = config.strategies.reduce((s, x) => s + x.budgetUsd, 0);
  return total === config.startingCapital
    ? undefined
    : `The bot budgets add up to ${usd(total)}, but starting capital is ${usd(config.startingCapital)}. Check the bots' config.`;
}

/** "2026-10-07T12:00:00Z" becomes "Oct 7, 12:00 UTC". */
export function updatedLabel(iso: string): string {
  return `${shortDate(iso.slice(0, 10))}, ${iso.slice(11, 16)} UTC`;
}
