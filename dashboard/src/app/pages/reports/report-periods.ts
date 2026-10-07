import { BotId, DailyRollup, Trade } from '../../data/models';

export type PeriodView = 'week' | 'month';

export interface PeriodRow {
  /** Sort key: the Monday of the week (yyyy-mm-dd) or the month (yyyy-mm). */
  key: string;
  /** First and last trading day with data in the period (yyyy-mm-dd). */
  start: string;
  end: string;
  /** Change in the portfolio's return over the period, in percentage points of starting capital. */
  totalReturnPct: number;
  /** Change in each bot's return over the period, in percentage points of its own budget. */
  botReturnPct: Record<BotId, number>;
  trades: number;
  wins: number;
  winRatePct: number;
  avgR: number;
  netUsd: number;
  best: BotId;
  worst: BotId;
}

const BOTS: readonly BotId[] = ['breakout', 'pullback', 'reversion'];
const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

/** The Monday of the week containing `date` (yyyy-mm-dd), computed in UTC so the time zone never shifts the day. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function periodKey(date: string, view: PeriodView): string {
  return view === 'week' ? mondayOf(date) : date.slice(0, 7);
}

/**
 * Weekly or monthly summaries, newest first. Returns are the change in the cumulative return between the end of
 * the previous period and the end of this one, so the periods add up to the whole run. Trade figures count the
 * trades that closed in the period.
 */
export function buildPeriods(rollups: DailyRollup[], trades: Trade[], view: PeriodView): PeriodRow[] {
  const days = [...rollups].sort((a, b) => a.date.localeCompare(b.date));
  const groups = new Map<string, DailyRollup[]>();
  for (const day of days) {
    const key = periodKey(day.date, view);
    groups.set(key, [...(groups.get(key) ?? []), day]);
  }
  const tradesByKey = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = periodKey(t.closedAt, view);
    tradesByKey.set(key, [...(tradesByKey.get(key) ?? []), t]);
  }

  let previous = { total: 0, bots: { breakout: 0, pullback: 0, reversion: 0 } as Record<BotId, number> };
  const rows: PeriodRow[] = [];
  for (const [key, group] of groups) {
    const last = group[group.length - 1];
    const botReturnPct = Object.fromEntries(BOTS.map((b) => [b, round(last.botReturnPct[b] - previous.bots[b])])) as Record<BotId, number>;
    const inPeriod = tradesByKey.get(key) ?? [];
    const wins = inPeriod.filter((t) => t.rMultiple > 0).length;
    const ranked = [...BOTS].sort((a, b) => botReturnPct[b] - botReturnPct[a]);
    rows.push({
      key,
      start: group[0].date,
      end: last.date,
      totalReturnPct: round(last.totalReturnPct - previous.total),
      botReturnPct,
      trades: inPeriod.length,
      wins,
      winRatePct: inPeriod.length ? Math.round((100 * wins) / inPeriod.length) : 0,
      avgR: inPeriod.length ? round(inPeriod.reduce((s, t) => s + t.rMultiple, 0) / inPeriod.length) : 0,
      netUsd: inPeriod.reduce((s, t) => s + t.pnlUsd, 0),
      best: ranked[0],
      worst: ranked[ranked.length - 1],
    });
    previous = { total: last.totalReturnPct, bots: { ...last.botReturnPct } };
  }
  return rows.reverse();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Week of Oct 5" or "October 2026". */
export function periodLabel(row: PeriodRow, view: PeriodView): string {
  if (view === 'month') {
    const [y, m] = row.key.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }
  const [, m, d] = row.key.split('-').map(Number);
  return `Week of ${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}
