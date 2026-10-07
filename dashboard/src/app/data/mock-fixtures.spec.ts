import { describe, expect, it } from 'vitest';
import {
  MOCK_BOTS, MOCK_PLANS, MOCK_POSITIONS, MOCK_REPORTS, MOCK_ROLLUPS, MOCK_SETUPS, MOCK_STATUS, MOCK_TRADES,
  STARTING_CAPITAL,
} from './mock-fixtures';

describe('mock fixtures', () => {
  const botIds = MOCK_BOTS.map((b) => b.id);

  it('bot budgets add up to the starting capital', () => {
    expect(MOCK_BOTS.reduce((s, b) => s + b.budget, 0)).toBe(STARTING_CAPITAL);
    expect(MOCK_STATUS.startingCapital).toBe(STARTING_CAPITAL);
  });

  it('total return is the budget-weighted sum of the bot returns', () => {
    const weighted = MOCK_BOTS.reduce((s, b) => s + (b.budget * b.returnPct) / STARTING_CAPITAL, 0);
    expect(MOCK_STATUS.returnSinceStartPct).toBeCloseTo(weighted, 0);
    expect(MOCK_STATUS.equity).toBe(Math.round(STARTING_CAPITAL * (1 + weighted / 100)));
  });

  it('the last rollup matches the bot cards and the status tile', () => {
    const last = MOCK_ROLLUPS[MOCK_ROLLUPS.length - 1];
    for (const bot of MOCK_BOTS) expect(last.botReturnPct[bot.id]).toBeCloseTo(bot.returnPct, 5);
    expect(Math.round(last.equity)).toBe(MOCK_STATUS.equity);
  });

  it('every rollup total is the weighted sum of its bot returns', () => {
    for (const r of MOCK_ROLLUPS) {
      const weighted = MOCK_BOTS.reduce((s, b) => s + (b.budget * r.botReturnPct[b.id]) / STARTING_CAPITAL, 0);
      expect(r.totalReturnPct).toBeCloseTo(weighted, 1);
    }
  });

  it('rollups are 40 weekdays in order with no duplicates', () => {
    expect(MOCK_ROLLUPS).toHaveLength(40);
    const dates = MOCK_ROLLUPS.map((r) => r.date);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(40);
    for (const d of dates) expect([0, 6]).not.toContain(new Date(`${d}T00:00:00Z`).getUTCDay());
  });

  it('open positions per bot match the bot cards', () => {
    for (const bot of MOCK_BOTS) {
      expect(MOCK_POSITIONS.filter((p) => p.botId === bot.id)).toHaveLength(bot.openCount);
    }
  });

  it('references point at real bots', () => {
    for (const x of [...MOCK_PLANS, ...MOCK_POSITIONS, ...MOCK_TRADES, ...MOCK_SETUPS]) {
      expect(botIds).toContain(x.botId);
    }
  });

  it('split verdict is flagged exactly when the analysts disagree', () => {
    for (const p of MOCK_PLANS) {
      expect(p.splitVerdict).toBe(p.fundamental.verdict !== p.technical.verdict);
    }
  });

  it('plans respect reward to risk and open risk stays inside its limit', () => {
    for (const p of MOCK_PLANS) {
      expect((p.target - p.entry) / (p.entry - p.stop)).toBeCloseTo(p.rewardToRisk, 0);
    }
    expect(MOCK_STATUS.openRiskPct).toBeLessThanOrEqual(MOCK_STATUS.openRiskLimitPct);
    expect(MOCK_STATUS.tradesToday).toBeLessThanOrEqual(MOCK_STATUS.tradeCap);
  });

  it('trades are newest first', () => {
    const dates = MOCK_TRADES.map((t) => t.closedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('each bot report histogram covers its closed trades and the curve has one point per day', () => {
    for (const bot of MOCK_BOTS) {
      const report = MOCK_REPORTS[bot.id];
      expect(report.rHistogram.reduce((s, b) => s + b.count, 0)).toBe(bot.tradeCount);
      expect(report.backtestReturnPct).toHaveLength(MOCK_ROLLUPS.length);
    }
  });

  it('the trade list matches each bot card: count, win rate, average R and dollar return', () => {
    for (const bot of MOCK_BOTS) {
      const trades = MOCK_TRADES.filter((t) => t.botId === bot.id);
      expect(trades).toHaveLength(bot.tradeCount);
      expect(Math.round((100 * trades.filter((t) => t.rMultiple > 0).length) / trades.length)).toBe(bot.winRatePct);
      expect(trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length).toBeCloseTo(bot.avgR, 2);
      expect((trades.reduce((s, t) => s + t.pnlUsd, 0) / bot.budget) * 100).toBeCloseTo(bot.returnPct, 1);
    }
  });

  it('every trade id is unique and every exit matches its result', () => {
    expect(new Set(MOCK_TRADES.map((t) => t.id)).size).toBe(MOCK_TRADES.length);
    for (const t of MOCK_TRADES) {
      const rr = MOCK_BOTS.find((b) => b.id === t.botId)!.targetRR;
      if (t.exitReason === 'TARGET') expect(t.rMultiple).toBeGreaterThanOrEqual(rr - 0.001);
      if (t.exitReason === 'STOP') expect(t.rMultiple).toBeLessThanOrEqual(-0.999);
      if (t.exitReason === 'BREAKEVEN_STOP') expect(t.rMultiple).toBe(0);
    }
  });

  it('every bot has a backtest summary with the same window as the rollups', () => {
    for (const bot of MOCK_BOTS) {
      const bt = MOCK_REPORTS[bot.id].backtest!;
      expect(bt.periodStart).toBe(MOCK_ROLLUPS[0].date);
      expect(bt.periodEnd).toBe(MOCK_ROLLUPS[MOCK_ROLLUPS.length - 1].date);
    }
  });

  it('each bot setups add up to its trade count', () => {
    for (const bot of MOCK_BOTS) {
      const total = MOCK_SETUPS.filter((s) => s.botId === bot.id).reduce((n, s) => n + s.trades, 0);
      expect(total).toBe(bot.tradeCount);
    }
  });

  it('the closed-trades gate and the drawdown gate match the bot card', () => {
    for (const bot of MOCK_BOTS) {
      const gates = MOCK_REPORTS[bot.id].gates;
      expect(gates.find((g) => g.id === 'trades')?.result).toBe(`${bot.tradeCount} of 100`);
      expect(gates.find((g) => g.id === 'drawdown')?.result).toBe(`${bot.maxDrawdownPct}%`);
    }
  });
});
