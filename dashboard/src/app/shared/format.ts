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
