import { BotStatus, ExitReason, TradingMode } from '../data/models';

/** Signed formatters. Gain and loss always carry a sign, never color alone. */

export type Tone = 'gain' | 'loss' | 'neutral';

export function toneOf(n: number): Tone {
  return n > 0 ? 'gain' : n < 0 ? 'loss' : 'neutral';
}

/** ▲ for gain, ▼ for loss, nothing for flat. */
export function arrowOf(n: number): string {
  return n > 0 ? '▲' : n < 0 ? '▼' : '';
}

function sign(n: number): string {
  return n > 0 ? '+' : n < 0 ? '-' : '';
}

export function signedPct(n: number, digits = 1): string {
  return `${sign(n)}${Math.abs(n).toFixed(digits)}%`;
}

export function signedR(n: number, digits = 1): string {
  return `${sign(n)}${Math.abs(n).toFixed(digits)}R`;
}

export function signedUsd(n: number): string {
  return `${sign(n)}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}

export function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-06" becomes "Oct 6". Reads the parts directly, so the time zone never shifts the day. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

const EXIT_LABELS: Record<ExitReason, string> = {
  TARGET: 'Target',
  STOP: 'Stop',
  TIME_STOP: 'Time stop',
  BREAKEVEN_STOP: 'Breakeven stop',
};

export function exitLabel(reason: ExitReason): string {
  return EXIT_LABELS[reason];
}

/** Target reward to risk as the mockup writes it: 3 becomes "1:3". */
export function ratio(rr: number): string {
  return `1:${rr}`;
}

const STATUS_LABELS: Record<BotStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  HALTED: 'Halted',
  BACKTEST_ONLY: 'Backtest only',
};

export function statusLabel(status: BotStatus): string {
  return STATUS_LABELS[status];
}

const MODE_LABELS: Record<TradingMode, string> = {
  backtest: 'Backtest only',
  paper: 'Paper trading',
  live: 'Live trading',
};

export function modeLabel(mode: TradingMode): string {
  return MODE_LABELS[mode];
}

/** `count` evenly spaced calendar dates from `start` to `end` (yyyy-mm-dd), as "Aug 13" labels. */
export function dateLabels(start: string, end: string, count = 6): string[] {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || count < 2) return [];
  return Array.from({ length: count }, (_, i) => shortDate(new Date(from + ((to - from) * i) / (count - 1)).toISOString().slice(0, 10)));
}

/** Pick `count` evenly spaced entries from a list of yyyy-mm-dd dates, as "Aug 13" labels. */
export function spreadDateLabels(dates: string[], count = 8): string[] {
  if (dates.length === 0) return [];
  if (dates.length <= count) return dates.map(shortDate);
  return Array.from({ length: count }, (_, i) => shortDate(dates[Math.round((i * (dates.length - 1)) / (count - 1))]));
}
