import { describe, expect, it } from 'vitest';
import { COST_R, RISK_PER_TRADE, simulateBacktest } from './backtest-sample';
import { MOCK_BACKTESTS, MOCK_BOTS, MOCK_REPORTS, MOCK_ROLLUPS } from './mock-fixtures';

const dates = MOCK_ROLLUPS.map((r) => r.date);

describe('sample backtests', () => {
  it('are deterministic', () => {
    const params = { targetRR: 3, wins: 3, stops: 5, partials: [0.4], timeStopDays: 10, budget: 2000, seed: 7 };
    expect(simulateBacktest(params, dates)).toEqual(simulateBacktest(params, dates));
  });

  it('close every trade inside the window, in order', () => {
    for (const bot of MOCK_BOTS) {
      const { trades, curve } = MOCK_BACKTESTS[bot.id];
      expect(curve).toHaveLength(dates.length);
      expect(trades.every((t) => t.day >= 0 && t.day < dates.length)).toBe(true);
      expect(trades.map((t) => t.day)).toEqual([...trades.map((t) => t.day)].sort((a, b) => a - b));
    }
  });

  it('charge the cost on every trade: a winner at 3R nets 2.97R and a stop nets -1.03R', () => {
    const rs = new Set(MOCK_BACKTESTS.breakout.trades.map((t) => t.rMultiple));
    expect(rs.has(3 - COST_R)).toBe(true);
    expect(rs.has(-1 - COST_R)).toBe(true);
  });

  it('give a summary that matches the trade list', () => {
    for (const bot of MOCK_BOTS) {
      const { trades, summary, curve } = MOCK_BACKTESTS[bot.id];
      const rs = trades.map((t) => t.rMultiple);
      expect(summary.trades).toBe(trades.length);
      expect(summary.avgR).toBeCloseTo(rs.reduce((a, b) => a + b, 0) / rs.length, 2);
      expect(summary.winRatePct).toBe(Math.round((100 * rs.filter((r) => r > 0).length) / rs.length));
      expect(summary.returnPct).toBeCloseTo(curve[curve.length - 1], 1);
      // Total P&L in dollars over the budget is the same number as the curve's end point.
      const pnl = rs.reduce((a, r) => a + r * bot.budget * RISK_PER_TRADE, 0);
      expect(curve[curve.length - 1]).toBeCloseTo((pnl / bot.budget) * 100, 1);
      expect(summary.maxDrawdownPct).toBeGreaterThanOrEqual(0);
      expect(summary.periodStart).toBe(dates[0]);
      expect(summary.periodEnd).toBe(dates[dates.length - 1]);
    }
  });

  it('land near the expectancy the checklist quotes for each strategy', () => {
    expect(MOCK_BACKTESTS.breakout.summary.avgR).toBeCloseTo(0.28, 1);
    expect(MOCK_BACKTESTS.pullback.summary.avgR).toBeCloseTo(0.24, 1);
    expect(MOCK_BACKTESTS.reversion.summary.avgR).toBeCloseTo(0.2, 1);
    for (const bot of MOCK_BOTS) expect(MOCK_BACKTESTS[bot.id].summary.profitFactor).toBeGreaterThan(1.2);
  });

  it('feed the report: the curve, the summary and the paper-versus-backtest gate agree', () => {
    for (const bot of MOCK_BOTS) {
      const report = MOCK_REPORTS[bot.id];
      expect(report.backtestReturnPct).toEqual(MOCK_BACKTESTS[bot.id].curve);
      expect(report.backtest).toEqual(MOCK_BACKTESTS[bot.id].summary);
      const gap = Math.abs(report.backtest!.avgR - bot.avgR);
      const gate = report.gates.find((g) => g.id === 'backtest-gap')!;
      expect(gate.result).toBe(`gap ${gap.toFixed(2)}R`);
      expect(gate.status).toBe(gap <= 0.15 ? 'MET' : 'FAILED');
    }
    expect(MOCK_REPORTS.reversion.gates.find((g) => g.id === 'backtest-gap')!.status).toBe('FAILED');
  });
});
