import { describe, expect, it } from 'vitest';
import { MOCK_BOTS, MOCK_ROLLUPS, MOCK_STATUS, MOCK_TRADES } from '../../data/mock-fixtures';
import { DailyRollup } from '../../data/models';
import { buildPeriods, mondayOf, periodKey, periodLabel } from './report-periods';

const day = (date: string, total: number, b: number, p: number, r: number): DailyRollup => ({
  date, totalReturnPct: total, equity: 5000 * (1 + total / 100), botReturnPct: { breakout: b, pullback: p, reversion: r },
});

describe('period keys', () => {
  it('puts every weekday of a week under its Monday', () => {
    expect(mondayOf('2026-10-05')).toBe('2026-10-05'); // Monday
    expect(mondayOf('2026-10-07')).toBe('2026-10-05'); // Wednesday
    expect(mondayOf('2026-10-11')).toBe('2026-10-05'); // Sunday
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
    expect(periodKey('2026-10-07', 'month')).toBe('2026-10');
  });

  it('labels weeks and months in words', () => {
    const row = buildPeriods([day('2026-10-07', 1, 1, 1, 1)], [], 'week')[0];
    expect(periodLabel(row, 'week')).toBe('Week of Oct 5');
    expect(periodLabel(buildPeriods([day('2026-10-07', 1, 1, 1, 1)], [], 'month')[0], 'month')).toBe('October 2026');
  });
});

describe('buildPeriods', () => {
  const rollups = [
    day('2026-10-05', 1.0, 2.0, 1.0, 0.0),
    day('2026-10-09', 2.0, 3.0, 2.0, 0.0), // end of week 1
    day('2026-10-12', 1.5, 3.0, 1.0, -1.0), // week 2 falls
    day('2026-10-14', 1.0, 3.5, 0.5, -2.0), // end of week 2
  ];

  it('measures each period as the change since the end of the one before, newest first', () => {
    const rows = buildPeriods(rollups, [], 'week');
    expect(rows.map((r) => r.key)).toEqual(['2026-10-12', '2026-10-05']);
    expect(rows[1].totalReturnPct).toBe(2.0); // first week: from zero
    expect(rows[0].totalReturnPct).toBe(-1.0); // 2.0 down to 1.0
    expect(rows[0].botReturnPct).toEqual({ breakout: 0.5, pullback: -1.5, reversion: -2.0 });
  });

  it('names the best and worst bot of each period', () => {
    const [second, first] = buildPeriods(rollups, [], 'week');
    expect([first.best, first.worst]).toEqual(['breakout', 'reversion']);
    expect([second.best, second.worst]).toEqual(['breakout', 'reversion']);
  });

  it('counts the trades that closed in the period, with their win rate and average R', () => {
    const trades = [
      { id: 'a', closedAt: '2026-10-06', symbol: 'A', botId: 'breakout' as const, exitReason: 'TARGET' as const, rMultiple: 3, pnlUsd: 60 },
      { id: 'b', closedAt: '2026-10-08', symbol: 'B', botId: 'breakout' as const, exitReason: 'STOP' as const, rMultiple: -1, pnlUsd: -20 },
      { id: 'c', closedAt: '2026-10-13', symbol: 'C', botId: 'pullback' as const, exitReason: 'STOP' as const, rMultiple: -1, pnlUsd: -17 },
    ];
    const [second, first] = buildPeriods(rollups, trades, 'week');
    expect(first).toMatchObject({ trades: 2, wins: 1, winRatePct: 50, avgR: 1, netUsd: 40 });
    expect(second).toMatchObject({ trades: 1, wins: 0, winRatePct: 0, avgR: -1, netUsd: -17 });
  });

  it('groups by calendar month too', () => {
    const rows = buildPeriods([day('2026-09-30', 1, 1, 1, 1), day('2026-10-01', 3, 3, 3, 3)], [], 'month');
    expect(rows.map((r) => [r.key, r.totalReturnPct])).toEqual([['2026-10', 2], ['2026-09', 1]]);
  });

  it('gives no periods for no rollups', () => {
    expect(buildPeriods([], MOCK_TRADES, 'week')).toEqual([]);
  });
});

describe('with the sample data', () => {
  it('weekly and monthly returns add up to the whole run, which is the Overview total', () => {
    for (const view of ['week', 'month'] as const) {
      const rows = buildPeriods(MOCK_ROLLUPS, MOCK_TRADES, view);
      const sum = rows.reduce((s, r) => s + r.totalReturnPct, 0);
      expect(sum).toBeCloseTo(MOCK_ROLLUPS[MOCK_ROLLUPS.length - 1].totalReturnPct, 1);
      expect(sum).toBeCloseTo(MOCK_STATUS.returnSinceStartPct, 0);
    }
  });

  it('each bot adds up to its own return on the bot card', () => {
    const rows = buildPeriods(MOCK_ROLLUPS, MOCK_TRADES, 'week');
    for (const bot of MOCK_BOTS) {
      expect(rows.reduce((s, r) => s + r.botReturnPct[bot.id], 0)).toBeCloseTo(bot.returnPct, 1);
    }
  });

  it('counts every trade exactly once, in weeks and in months', () => {
    for (const view of ['week', 'month'] as const) {
      expect(buildPeriods(MOCK_ROLLUPS, MOCK_TRADES, view).reduce((s, r) => s + r.trades, 0)).toBe(MOCK_TRADES.length);
    }
  });

  it('has nine weeks and three months in the eight-week run', () => {
    expect(buildPeriods(MOCK_ROLLUPS, MOCK_TRADES, 'week')).toHaveLength(9);
    expect(buildPeriods(MOCK_ROLLUPS, MOCK_TRADES, 'month').map((r) => r.key)).toEqual(['2026-10', '2026-09', '2026-08']);
  });
});
