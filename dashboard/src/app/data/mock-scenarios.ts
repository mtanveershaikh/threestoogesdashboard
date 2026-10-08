import {
  AuditEvent, Bot, BotId, BotReport, DailyRollup, Plan, Position, SetupStat, SystemConfig, SystemStatus, Trade,
} from './models';
import {
  MOCK_BACKTESTS, MOCK_AUDIT, MOCK_BOTS, MOCK_CONFIG, buildConfig, MOCK_PLANS, MOCK_POSITIONS, MOCK_REPORTS, MOCK_ROLLUPS, MOCK_SETUPS, MOCK_STATUS, MOCK_TRADES,
  STARTING_CAPITAL,
} from './mock-fixtures';

/** Which sample world the mock service serves. */
export type Scenario = 'paper' | 'backtest';

export interface MockDataset {
  status: SystemStatus;
  config: SystemConfig | undefined;
  bots: Bot[];
  rollups: DailyRollup[];
  plans: Plan[];
  positions: Position[];
  trades: Trade[];
  audit: AuditEvent[];
  setups: SetupStat[];
  reports: Record<BotId, BotReport>;
}

/** The paper run the mockups show (the default). */
export const PAPER_DATASET: MockDataset = {
  status: MOCK_STATUS,
  config: MOCK_CONFIG,
  bots: MOCK_BOTS,
  rollups: MOCK_ROLLUPS,
  plans: MOCK_PLANS,
  positions: MOCK_POSITIONS,
  trades: MOCK_TRADES,
  audit: MOCK_AUDIT,
  setups: MOCK_SETUPS,
  reports: MOCK_REPORTS,
};

/**
 * What the bots write while every strategy is still `backtest_only`: a backtest, but no paper trades,
 * plans, positions or rollups yet (see docs/BOT-DATA-CONTRACT.md, "Backtest-only bots").
 */
export const BACKTEST_DATASET: MockDataset = {
  config: buildConfig('backtest', 'backtest_only'),
  status: {
    mode: 'backtest',
    week: 0,
    startingCapital: STARTING_CAPITAL,
    equity: STARTING_CAPITAL,
    returnSinceStartPct: 0,
    todayPnl: 0,
    todayPct: 0,
    openRiskPct: 0,
    openRiskLimitPct: MOCK_STATUS.openRiskLimitPct,
    tradesToday: 0,
    tradeCap: MOCK_STATUS.tradeCap,
    killSwitch: { state: 'ARMED', drawdownPct: 0, limitPct: MOCK_STATUS.killSwitch.limitPct },
    lastHeartbeat: MOCK_STATUS.lastHeartbeat,
  },
  bots: MOCK_BOTS.map((b) => ({
    ...b,
    status: 'BACKTEST_ONLY' as const,
    returnPct: 0, winRatePct: 0, avgR: 0, profitFactor: 0, tradeCount: 0, openCount: 0, maxDrawdownPct: 0, avgHoldDays: 0,
  })),
  rollups: [],
  plans: [],
  positions: [],
  trades: [],
  audit: [],
  setups: [],
  reports: Object.fromEntries(
    MOCK_BOTS.map((b) => {
      const paper = MOCK_REPORTS[b.id];
      const report: BotReport = {
        botId: b.id,
        gates: paper.gates.map((g) => ({
          ...g,
          status: 'PENDING' as const,
          result: g.id === 'trades' ? '0 of 100' : 'no trades yet',
          progressPct: 0,
          detail: 'Needs paper trades before it can be measured.',
        })),
        rHistogram: paper.rHistogram.map((h) => ({ ...h, count: 0 })),
        backtestReturnPct: MOCK_BACKTESTS[b.id].curve,
        backtest: MOCK_BACKTESTS[b.id].summary,
      };
      return [b.id, report];
    }),
  ) as Record<BotId, BotReport>,
};

export function datasetFor(scenario: Scenario): MockDataset {
  return scenario === 'backtest' ? BACKTEST_DATASET : PAPER_DATASET;
}

/** `?scenario=backtest` picks the backtest-only world; anything else is the paper run. */
export function scenarioFromSearch(search: string): Scenario {
  return new URLSearchParams(search).get('scenario') === 'backtest' ? 'backtest' : 'paper';
}
