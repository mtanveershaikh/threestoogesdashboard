import { ExitReason } from '../data/models';

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
