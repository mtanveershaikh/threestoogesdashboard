import { describe, expect, it } from 'vitest';
import { MockDataService } from './mock-data.service';
import { BACKTEST_DATASET, PAPER_DATASET, datasetFor, scenarioFromSearch } from './mock-scenarios';
import { firstValueFrom } from 'rxjs';

describe('mock scenarios', () => {
  it('reads the scenario from the URL, defaulting to the paper run', () => {
    expect(scenarioFromSearch('')).toBe('paper');
    expect(scenarioFromSearch('?scenario=backtest')).toBe('backtest');
    expect(scenarioFromSearch('?scenario=nonsense')).toBe('paper');
    expect(datasetFor('paper')).toBe(PAPER_DATASET);
    expect(datasetFor('backtest')).toBe(BACKTEST_DATASET);
  });

  it('backtest-only has a backtest and no paper activity, as the bots write it', () => {
    const d = BACKTEST_DATASET;
    expect(d.status.mode).toBe('backtest');
    expect(d.bots.every((b) => b.status === 'BACKTEST_ONLY' && b.tradeCount === 0 && b.openCount === 0)).toBe(true);
    expect([d.rollups, d.plans, d.positions, d.trades, d.setups].every((x) => x.length === 0)).toBe(true);
    for (const b of d.bots) {
      const report = d.reports[b.id];
      expect(report.backtest?.trades).toBeGreaterThan(0);
      expect(report.backtestReturnPct.length).toBeGreaterThan(0);
      expect(report.gates.every((g) => g.status === 'PENDING')).toBe(true);
      expect(report.gates.find((g) => g.id === 'trades')?.result).toBe('0 of 100');
      expect(report.rHistogram.every((h) => h.count === 0)).toBe(true);
    }
  });

  it('the mock service serves the chosen world', async () => {
    const paper = new MockDataService();
    const backtest = new MockDataService('backtest');
    expect((await firstValueFrom(paper.getBots()))[0].status).toBe('ACTIVE');
    expect((await firstValueFrom(backtest.getBots()))[0].status).toBe('BACKTEST_ONLY');
    expect(await firstValueFrom(backtest.getRollups('all'))).toEqual([]);
    expect((await firstValueFrom(paper.getRollups('all'))).length).toBe(40);
    expect((await firstValueFrom(paper.getRollups(5))).length).toBe(5);
    expect(await firstValueFrom(backtest.getBotReports())).toHaveLength(3);
  });
});
