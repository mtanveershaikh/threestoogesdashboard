import { BacktestSummary } from './models';

/**
 * Sample backtest for the mock data: a simulated trade list per strategy over the same trading days
 * as the paper run, after a cost and slippage charge on every trade (TASKS S4-6, S4-7, S4-9).
 * Deterministic, so tests can pin it. Not real results.
 */

/** Cost and slippage charged on every trade, in R. */
export const COST_R = 0.03;
/** 1R is this share of the bot's budget, matching the mockup (-1.0R is about -$20 on $2,000). */
export const RISK_PER_TRADE = 0.01;

export interface BacktestParams {
  /** Target reward to risk; a winning trade makes this many R. */
  targetRR: number;
  wins: number;
  stops: number;
  /** Early exits (time stops and breakeven stops), in R before costs. */
  partials: number[];
  timeStopDays: number;
  budget: number;
  seed: number;
}

export interface SimTrade {
  /** Index into the list of trading days. */
  day: number;
  rMultiple: number;
  holdDays: number;
}

export interface SimResult {
  trades: SimTrade[];
  summary: BacktestSummary;
  /** Cumulative return on budget at the end of each trading day, in percent. */
  curve: number[];
}

/** Small seeded generator so the same inputs always give the same trades. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;

export function simulateBacktest(p: BacktestParams, dates: string[]): SimResult {
  const rng = mulberry32(p.seed);

  const outcomes: { r: number; kind: 'win' | 'stop' | 'early' }[] = [
    ...Array.from({ length: p.wins }, () => ({ r: p.targetRR - COST_R, kind: 'win' as const })),
    ...Array.from({ length: p.stops }, () => ({ r: -1 - COST_R, kind: 'stop' as const })),
    ...p.partials.map((r) => ({ r: r - COST_R, kind: 'early' as const })),
  ];
  // Spread each kind of outcome evenly through the window with a little jitter, so wins and losses
  // interleave the way a real run does instead of bunching into long streaks.
  const keyed = outcomes.map((o) => {
    const group = outcomes.filter((x) => x.kind === o.kind);
    const rank = group.indexOf(o);
    return { o, key: (rank + 0.5) / group.length + (rng() - 0.5) * (0.8 / group.length) };
  });
  keyed.sort((x, y) => x.key - y.key);
  outcomes.splice(0, outcomes.length, ...keyed.map((k) => k.o));

  const n = outcomes.length;
  const trades: SimTrade[] = outcomes.map((o, i) => ({
    day: Math.floor((i * dates.length) / n),
    rMultiple: round(o.r, 2),
    // Stops come quickly, targets take longer, early exits run to the time stop.
    holdDays: o.kind === 'early' ? p.timeStopDays : o.kind === 'stop' ? 1 + Math.floor(rng() * 4) : 2 + Math.floor(rng() * (p.timeStopDays - 2)),
  }));

  const pnlByDay = new Array<number>(dates.length).fill(0);
  for (const t of trades) pnlByDay[t.day] += t.rMultiple * p.budget * RISK_PER_TRADE;

  let running = 0;
  const curve = pnlByDay.map((d) => {
    running += d;
    return round((running / p.budget) * 100, 2);
  });

  let peak = 0;
  let maxDrawdown = 0;
  for (const v of curve) {
    peak = Math.max(peak, v);
    maxDrawdown = Math.max(maxDrawdown, peak - v);
  }

  const rs = trades.map((t) => t.rMultiple);
  const grossWin = rs.filter((r) => r > 0).reduce((s, r) => s + r, 0);
  const grossLoss = -rs.filter((r) => r < 0).reduce((s, r) => s + r, 0);

  return {
    trades,
    curve,
    summary: {
      periodStart: dates[0],
      periodEnd: dates[dates.length - 1],
      trades: n,
      winRatePct: Math.round((100 * rs.filter((r) => r > 0).length) / n),
      avgR: round(rs.reduce((s, r) => s + r, 0) / n, 2),
      profitFactor: round(grossWin / grossLoss, 1),
      maxDrawdownPct: round(maxDrawdown, 1),
      avgHoldDays: round(trades.reduce((s, t) => s + t.holdDays, 0) / n, 1),
      returnPct: round(curve[curve.length - 1], 1),
      costR: COST_R,
    },
  };
}
