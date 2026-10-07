import { BotId, ExitReason, Trade } from '../../data/models';

export type ResultFilter = 'win' | 'loss' | 'even';

/** What the Trades page is filtered by. Every field is optional; empty means "all". */
export interface TradeFilters {
  bot?: BotId;
  result?: ResultFilter;
  exit?: ExitReason;
  /** yyyy-mm-dd, inclusive */
  from?: string;
  /** yyyy-mm-dd, inclusive */
  to?: string;
  /** Stock search: part of the ticker, any case. */
  q?: string;
}

export const BOT_IDS: readonly BotId[] = ['breakout', 'pullback', 'reversion'];
export const EXITS: readonly ExitReason[] = ['TARGET', 'STOP', 'TIME_STOP', 'BREAKEVEN_STOP'];
export const RESULTS: readonly ResultFilter[] = ['win', 'loss', 'even'];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads filters from URL query parameters, ignoring anything that is not a valid value. */
export function filtersFromParams(get: (key: string) => string | null): TradeFilters {
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const v = get(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
  };
  const date = (key: string) => {
    const v = get(key);
    return v && DATE.test(v) ? v : undefined;
  };
  const q = get('q')?.trim();
  return {
    bot: pick('bot', BOT_IDS),
    result: pick('result', RESULTS),
    exit: pick('exit', EXITS),
    from: date('from'),
    to: date('to'),
    q: q ? q : undefined,
  };
}

/** The query parameters for a set of filters; `null` removes a parameter from the URL. */
export function paramsFromFilters(f: TradeFilters): Record<string, string | null> {
  return {
    bot: f.bot ?? null,
    result: f.result ?? null,
    exit: f.exit ?? null,
    from: f.from ?? null,
    to: f.to ?? null,
    q: f.q ?? null,
  };
}

export function hasFilters(f: TradeFilters): boolean {
  return Object.values(f).some((v) => v !== undefined);
}

/**
 * Applies the filters that are not done by the database: result, exit, dates and stock search. (The bot
 * filter is done by the database query, but is applied here too so the function is correct on its own.)
 */
export function applyFilters(trades: Trade[], f: TradeFilters): Trade[] {
  const q = f.q?.toLowerCase();
  return trades.filter((t) => {
    if (f.bot && t.botId !== f.bot) return false;
    if (f.result === 'win' && !(t.rMultiple > 0)) return false;
    if (f.result === 'loss' && !(t.rMultiple < 0)) return false;
    if (f.result === 'even' && t.rMultiple !== 0) return false;
    if (f.exit && t.exitReason !== f.exit) return false;
    if (f.from && t.closedAt < f.from) return false;
    if (f.to && t.closedAt > f.to) return false;
    if (q && !t.symbol.toLowerCase().includes(q)) return false;
    return true;
  });
}

export interface TradeSummary {
  count: number;
  wins: number;
  winRatePct: number;
  totalR: number;
  avgR: number;
  netUsd: number;
}

export function summarize(trades: Trade[]): TradeSummary {
  const count = trades.length;
  const wins = trades.filter((t) => t.rMultiple > 0).length;
  const totalR = trades.reduce((s, t) => s + t.rMultiple, 0);
  return {
    count,
    wins,
    winRatePct: count ? Math.round((100 * wins) / count) : 0,
    totalR: Math.round(totalR * 100) / 100,
    avgR: count ? Math.round((totalR / count) * 100) / 100 : 0,
    netUsd: trades.reduce((s, t) => s + t.pnlUsd, 0),
  };
}
