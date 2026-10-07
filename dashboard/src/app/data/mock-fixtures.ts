import {
  Bot,
  BotId,
  BotReport,
  DailyRollup,
  Plan,
  Position,
  SetupStat,
  SystemStatus,
  Trade,
} from './models';

/**
 * Sample data taken from the mockups (docs/mockups). Not real results.
 * The three bots' budgets add up to the 5,000 starting capital, and the
 * total return is the budget-weighted sum of the bot returns.
 */

export const STARTING_CAPITAL = 5000;
const DAYS = 40; // eight weeks of trading days

const BOT_END_RETURN: Record<BotId, number> = { breakout: 4.2, pullback: 2.9, reversion: -0.6 };

export const MOCK_BOTS: Bot[] = [
  {
    id: 'breakout', avatarUrl: 'avatars/breakout.svg', name: 'Breakout Bot', strategy: 'Breakout momentum', color: '#F2B84B',
    budget: 2000, status: 'ACTIVE', returnPct: BOT_END_RETURN.breakout,
    winRatePct: 30, avgR: 0.21, profitFactor: 1.3, tradeCount: 20, openCount: 1, targetRR: 3,
    maxDrawdownPct: 6.1, universe: 'Nasdaq 100', timeStopDays: 10,
  },
  {
    id: 'pullback', avatarUrl: 'avatars/pullback.svg', name: 'Pullback Bot', strategy: 'Trend pullback', color: '#5BB8FF',
    budget: 1750, status: 'ACTIVE', returnPct: BOT_END_RETURN.pullback,
    winRatePct: 28, avgR: 0.16, profitFactor: 1.2, tradeCount: 18, openCount: 2, targetRR: 3,
    maxDrawdownPct: 4.8, universe: 'Nasdaq 100', timeStopDays: 15,
  },
  {
    id: 'reversion', avatarUrl: 'avatars/reversion.svg', name: 'Reversion Bot', strategy: 'Mean reversion', color: '#B49CFF',
    budget: 1250, status: 'ACTIVE', returnPct: BOT_END_RETURN.reversion,
    winRatePct: 33, avgR: -0.05, profitFactor: 0.9, tradeCount: 12, openCount: 1, targetRR: 2,
    maxDrawdownPct: 7.4, universe: 'Nasdaq 100', timeStopDays: 5,
  },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Same curve shape as the mockup: a straight climb plus a wobble that fades to zero at both ends. */
function series(end: number, amp: number, freq: number): number[] {
  return Array.from({ length: DAYS }, (_, i) =>
    round2((end * i) / (DAYS - 1) + amp * Math.sin(i * freq) * Math.sin((Math.PI * i) / (DAYS - 1))),
  );
}

/** The last `count` weekdays up to and including `endIso`, oldest first. */
function weekdaysEnding(endIso: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(`${endIso}T00:00:00Z`);
  while (out.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.unshift(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out;
}

const brk = series(BOT_END_RETURN.breakout, 1.1, 0.9);
const pb = series(BOT_END_RETURN.pullback, 0.9, 0.65);
const mr = series(BOT_END_RETURN.reversion, 1.0, 1.1);

export const MOCK_ROLLUPS: DailyRollup[] = weekdaysEnding('2026-10-07', DAYS).map((date, i) => {
  const exactTotal = (2000 * brk[i] + 1750 * pb[i] + 1250 * mr[i]) / STARTING_CAPITAL;
  return {
    date,
    totalReturnPct: round2(exactTotal),
    botReturnPct: { breakout: brk[i], pullback: pb[i], reversion: mr[i] },
    equity: round2(STARTING_CAPITAL * (1 + exactTotal / 100)),
  };
});

export const MOCK_STATUS: SystemStatus = {
  mode: 'paper',
  week: 8,
  startingCapital: STARTING_CAPITAL,
  equity: 5127,
  returnSinceStartPct: 2.5,
  todayPnl: 14,
  todayPct: 0.3,
  openRiskPct: 2.1,
  openRiskLimitPct: 4,
  tradesToday: 2,
  tradeCap: 10,
  killSwitch: { state: 'ARMED', drawdownPct: -1.8, limitPct: -10 },
  lastHeartbeat: '2026-10-07T12:00:00Z',
};

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan-ornx', symbol: 'ORNX', botId: 'breakout', status: 'PROPOSED',
    entry: 48.2, stop: 45.9, target: 55.1, rewardToRisk: 3,
    fundamental: { verdict: 'BUY', score: 74 }, technical: { verdict: 'BUY', score: 68 },
    splitVerdict: false, note: '55-day high on 1.9x volume', shares: 8, positionUsd: 386,
  },
  {
    id: 'plan-klvr', symbol: 'KLVR', botId: 'reversion', status: 'PROPOSED',
    entry: 22.4, stop: 20.9, target: 25.4, rewardToRisk: 2,
    fundamental: { verdict: 'BUY', score: 61 }, technical: { verdict: 'AVOID', score: 55 },
    splitVerdict: true, note: 'RSI(2) at 6, above 200-day', shares: 8, positionUsd: 179,
  },
];

export const MOCK_POSITIONS: Position[] = [
  { id: 'pos-tmpl', symbol: 'TMPL', botId: 'pullback', entry: 112.4, last: 118.05, stop: 108.2, rMultiple: 1.3 },
  { id: 'pos-hlix', symbol: 'HLIX', botId: 'pullback', entry: 64.0, last: 66.4, stop: 60.8, rMultiple: 0.8 },
  { id: 'pos-qrtz', symbol: 'QRTZ', botId: 'reversion', entry: 18.75, last: 19.5, stop: 17.25, rMultiple: 0.5 },
  { id: 'pos-vela', symbol: 'VELA', botId: 'breakout', entry: 36.1, last: 35.4, stop: 34.4, rMultiple: -0.4 },
];

/** Newest first. */
const TRADES_BY_ENTRY: Trade[] = [
  { id: 't-drft', closedAt: '2026-10-06', symbol: 'DRFT', botId: 'breakout', exitReason: 'TARGET', rMultiple: 3.0, pnlUsd: 60,
    fundamental: { verdict: 'BUY', score: 71 }, technical: { verdict: 'BUY', score: 66 } },
  { id: 't-mnrl', closedAt: '2026-10-05', symbol: 'MNRL', botId: 'reversion', exitReason: 'STOP', rMultiple: -1.0, pnlUsd: -13 },
  { id: 't-plsm', closedAt: '2026-10-05', symbol: 'PLSM', botId: 'pullback', exitReason: 'TARGET', rMultiple: 3.0, pnlUsd: 53 },
  { id: 't-brlk', closedAt: '2026-10-02', symbol: 'BRLK', botId: 'breakout', exitReason: 'STOP', rMultiple: -1.0, pnlUsd: -20,
    fundamental: { verdict: 'BUY', score: 58 }, technical: { verdict: 'BUY', score: 62 } },
  { id: 't-solv', closedAt: '2026-10-01', symbol: 'SOLV', botId: 'pullback', exitReason: 'TIME_STOP', rMultiple: 1.4, pnlUsd: 25 },
  { id: 't-cndl', closedAt: '2026-09-29', symbol: 'CNDL', botId: 'breakout', exitReason: 'STOP', rMultiple: -1.0, pnlUsd: -20,
    fundamental: { verdict: 'HOLD', score: 49 }, technical: { verdict: 'BUY', score: 64 } },
  { id: 't-kden', closedAt: '2026-09-30', symbol: 'KDEN', botId: 'reversion', exitReason: 'TARGET', rMultiple: 2.0, pnlUsd: 25 },
  { id: 't-wrnt', closedAt: '2026-09-24', symbol: 'WRNT', botId: 'breakout', exitReason: 'TARGET', rMultiple: 3.0, pnlUsd: 60,
    fundamental: { verdict: 'BUY', score: 77 }, technical: { verdict: 'BUY', score: 70 } },
  { id: 't-frge', closedAt: '2026-09-22', symbol: 'FRGE', botId: 'breakout', exitReason: 'BREAKEVEN_STOP', rMultiple: 0.0, pnlUsd: 0,
    fundamental: { verdict: 'BUY', score: 63 }, technical: { verdict: 'BUY', score: 59 } },
  { id: 't-axlr', closedAt: '2026-09-18', symbol: 'AXLR', botId: 'breakout', exitReason: 'STOP', rMultiple: -1.0, pnlUsd: -20,
    fundamental: { verdict: 'BUY', score: 52 }, technical: { verdict: 'BUY', score: 61 } },
];

export const MOCK_TRADES: Trade[] = [...TRADES_BY_ENTRY].sort((a, b) => b.closedAt.localeCompare(a.closedAt));

export const MOCK_SETUPS: SetupStat[] = [
  { id: 'breakout_55d-high', botId: 'breakout', name: '55-day high, volume above 1.5x', trades: 9, winRatePct: 44, avgR: 0.6, state: 'ACTIVE' },
  { id: 'breakout_gap-up', botId: 'breakout', name: 'Gap-up breakout', trades: 6, winRatePct: 17, avgR: -0.2, state: 'WATCHING', tradesToGo: 9 },
  { id: 'breakout_late-session', botId: 'breakout', name: 'Late-session breakout', trades: 5, winRatePct: 20, avgR: 0.0, state: 'WATCHING', tradesToGo: 10 },
  { id: 'pullback_20d-average', botId: 'pullback', name: 'Pullback to the 20-day average', trades: 10, winRatePct: 30, avgR: 0.3, state: 'ACTIVE' },
  { id: 'pullback_deep', botId: 'pullback', name: 'Deep pullback to the 50-day average', trades: 8, winRatePct: 25, avgR: 0.0, state: 'WATCHING', tradesToGo: 7 },
  { id: 'reversion_rsi2', botId: 'reversion', name: 'RSI(2) below 10, above 200-day', trades: 7, winRatePct: 29, avgR: -0.1, state: 'WATCHING', tradesToGo: 8 },
  { id: 'reversion_lower-band', botId: 'reversion', name: 'Close below the lower band', trades: 5, winRatePct: 40, avgR: 0.0, state: 'WATCHING', tradesToGo: 10 },
];

const bins = (counts: number[]) =>
  ['-1', '-0.5', '0', '+0.5', '+1', '+2', '+3'].map((label, i) => ({ label, count: counts[i] }));

export const MOCK_REPORTS: Record<BotId, BotReport> = {
  breakout: {
    botId: 'breakout',
    gates: [
      { id: 'trades', name: 'Closed trades', rule: 'at least 100', status: 'PENDING', result: '20 of 100', progressPct: 20,
        detail: 'About 80 more trades. At one or two a day, that is two to four more months.' },
      { id: 'avg-r', name: 'Average per trade', rule: 'at least +0.15R', status: 'MET', result: '+0.21R', progressPct: 100,
        detail: 'After costs and slippage.' },
      { id: 'profit-factor', name: 'Profit factor', rule: 'at least 1.3', status: 'MET', result: '1.3', progressPct: 100,
        detail: 'Right on the line; a few more losses would break it.' },
      { id: 'drawdown', name: 'Largest drawdown', rule: 'within 20% of budget', status: 'MET', result: '6.1%', progressPct: 30,
        detail: "Measured from the bot's own equity peak." },
      { id: 'weeks', name: 'Profitable weeks', rule: 'at least 60%', status: 'MET', result: '5 of 8', progressPct: 63,
        detail: 'Weeks with a net gain since the paper run began.' },
      { id: 'backtest-gap', name: 'Paper close to backtest', rule: 'within 0.15R', status: 'MET', result: 'gap 0.07R', progressPct: 47,
        detail: 'Backtest +0.28R per trade against +0.21R on paper.' },
    ],
    rHistogram: bins([10, 2, 2, 0, 1, 1, 4]),
    backtestReturnPct: series(5.6, 0.2, 0.5),
  },
  pullback: {
    botId: 'pullback',
    gates: [
      { id: 'trades', name: 'Closed trades', rule: 'at least 100', status: 'PENDING', result: '18 of 100', progressPct: 18,
        detail: 'About 82 more trades.' },
      { id: 'avg-r', name: 'Average per trade', rule: 'at least +0.15R', status: 'MET', result: '+0.16R', progressPct: 100,
        detail: 'After costs and slippage. Only just above the line.' },
      { id: 'profit-factor', name: 'Profit factor', rule: 'at least 1.3', status: 'FAILED', result: '1.2', progressPct: 92,
        detail: 'Below the gate. It needs a few more winners to clear 1.3.' },
      { id: 'drawdown', name: 'Largest drawdown', rule: 'within 20% of budget', status: 'MET', result: '4.8%', progressPct: 24,
        detail: "Measured from the bot's own equity peak." },
      { id: 'weeks', name: 'Profitable weeks', rule: 'at least 60%', status: 'MET', result: '5 of 8', progressPct: 63,
        detail: 'Weeks with a net gain since the paper run began.' },
      { id: 'backtest-gap', name: 'Paper close to backtest', rule: 'within 0.15R', status: 'MET', result: 'gap 0.08R', progressPct: 53,
        detail: 'Backtest +0.24R per trade against +0.16R on paper.' },
    ],
    rHistogram: bins([8, 2, 1, 1, 1, 1, 4]),
    backtestReturnPct: series(4.4, 0.2, 0.5),
  },
  reversion: {
    botId: 'reversion',
    gates: [
      { id: 'trades', name: 'Closed trades', rule: 'at least 100', status: 'PENDING', result: '12 of 100', progressPct: 12,
        detail: 'About 88 more trades.' },
      { id: 'avg-r', name: 'Average per trade', rule: 'at least +0.15R', status: 'FAILED', result: '-0.05R', progressPct: 0,
        detail: 'Losing money per trade after costs and slippage.' },
      { id: 'profit-factor', name: 'Profit factor', rule: 'at least 1.3', status: 'FAILED', result: '0.9', progressPct: 69,
        detail: 'Below 1.0 means losses outweigh wins.' },
      { id: 'drawdown', name: 'Largest drawdown', rule: 'within 20% of budget', status: 'MET', result: '7.4%', progressPct: 37,
        detail: "Measured from the bot's own equity peak." },
      { id: 'weeks', name: 'Profitable weeks', rule: 'at least 60%', status: 'FAILED', result: '3 of 8', progressPct: 38,
        detail: 'Weeks with a net gain since the paper run began.' },
      { id: 'backtest-gap', name: 'Paper close to backtest', rule: 'within 0.15R', status: 'FAILED', result: 'gap 0.25R', progressPct: 100,
        detail: 'Backtest +0.20R per trade against -0.05R on paper.' },
    ],
    rHistogram: bins([5, 1, 1, 0, 1, 3, 1]),
    backtestReturnPct: series(3.0, 0.2, 0.5),
  },
};
