/**
 * Data contract for the dashboard (DASHBOARD-DESIGN.md section 7).
 * One source of truth: the mock and Firestore services both return these shapes.
 * Percent fields are plain numbers in percent units (4.2 means +4.2%).
 */

export type BotId = 'breakout' | 'pullback' | 'reversion';

export type BotStatus = 'ACTIVE' | 'PAUSED' | 'HALTED' | 'BACKTEST_ONLY';
export type KillSwitchState = 'ARMED' | 'TRIPPED';
export type TradingMode = 'backtest' | 'paper' | 'live';
export type Verdict = 'BUY' | 'HOLD' | 'AVOID';
export type ExitReason = 'TARGET' | 'STOP' | 'TIME_STOP' | 'BREAKEVEN_STOP';
export type PlanStatus = 'PROPOSED' | 'ARMED';
export type GateStatus = 'MET' | 'PENDING' | 'FAILED';
export type SetupState = 'ACTIVE' | 'WATCHING';

/** `system/status` */
export interface SystemStatus {
  mode: TradingMode;
  /** Week of the paper run, starting at 1. */
  week: number;
  startingCapital: number;
  equity: number;
  /** Equity change since start, in percent. */
  returnSinceStartPct: number;
  todayPnl: number;
  todayPct: number;
  openRiskPct: number;
  openRiskLimitPct: number;
  tradesToday: number;
  tradeCap: number;
  killSwitch: { state: KillSwitchState; drawdownPct: number; limitPct: number };
  /** ISO timestamp of the last bot heartbeat. */
  lastHeartbeat: string;
}

/** `bots/{botId}` */
export interface Bot {
  id: BotId;
  name: string;
  strategy: string;
  /** Chart and accent color, shared with the mockup. */
  color: string;
  budget: number;
  status: BotStatus;
  avatarUrl?: string;
  /** Total return on the bot's own budget, in percent. */
  returnPct: number;
  winRatePct: number;
  avgR: number;
  profitFactor: number;
  tradeCount: number;
  openCount: number;
  /** Target reward to risk, for example 3 for 1:3. */
  targetRR: number;
  /** Largest drop from the bot's own equity peak, in percent of budget (positive number). */
  maxDrawdownPct: number;
  /** Where the bot looks for trades, for example "Nasdaq 100". */
  universe: string;
  timeStopDays: number;
  /** Average days a closed trade was held. */
  avgHoldDays: number;
}

/** `daily_rollups/{yyyy-mm-dd}` */
export interface DailyRollup {
  /** yyyy-mm-dd */
  date: string;
  /** Total portfolio return since start, in percent. */
  totalReturnPct: number;
  /** Each bot's return on its own budget since start, in percent. */
  botReturnPct: Record<BotId, number>;
  equity: number;
}

export interface AnalystVerdict {
  verdict: Verdict;
  score: number;
}

/** `plans` where status is PROPOSED or ARMED */
export interface Plan {
  id: string;
  symbol: string;
  botId: BotId;
  status: PlanStatus;
  entry: number;
  stop: number;
  target: number;
  rewardToRisk: number;
  fundamental: AnalystVerdict;
  technical: AnalystVerdict;
  /** True when the two analysts disagree. */
  splitVerdict: boolean;
  note: string;
  shares: number;
  positionUsd: number;
}

/** `positions` where open */
export interface Position {
  id: string;
  symbol: string;
  botId: BotId;
  entry: number;
  last: number;
  stop: number;
  /** Open result in R multiples. */
  rMultiple: number;
}

/** `trades` ordered by close time */
export interface Trade {
  id: string;
  /** yyyy-mm-dd */
  closedAt: string;
  symbol: string;
  botId: BotId;
  exitReason: ExitReason;
  rMultiple: number;
  pnlUsd: number;
  fundamental?: AnalystVerdict;
  technical?: AnalystVerdict;
}

/** `setup_stats/{botId}_{setupId}` */
export interface SetupStat {
  id: string;
  botId: BotId;
  name: string;
  trades: number;
  winRatePct: number;
  avgR: number;
  state: SetupState;
  /** Trades still needed before the memory screen decides. Only while WATCHING. */
  tradesToGo?: number;
}

export type StrategyStatus = 'backtest_only' | 'paper' | 'live' | 'paused';

/** One strategy in `system/config`, as the bots run it. */
export interface StrategyConfig {
  /** The bots' own id, for example "breakout_v1". */
  id: string;
  botId: BotId;
  /** The bot's name in the bots' config, for example "wasif". */
  bot: string;
  status: StrategyStatus;
  /** The bots' own universe name, for example "nasdaq100". */
  universe: string;
  budgetUsd: number;
  rewardToRisk: number;
  timeStopDays: number;
  /** The strategy's own settings, shown as they are. */
  params: Record<string, string | number | boolean>;
}

/**
 * `system/config`: the settings the bots are running. Everything except `strategies` is optional, and the
 * Settings page shows only what is present. Never put secrets here: every allowed viewer can read it.
 */
export interface SystemConfig {
  configVersion?: string;
  /** ISO timestamp. */
  updatedAt?: string;
  mode?: TradingMode;
  startingCapital?: number;
  limits?: {
    riskPerTradePct?: number;
    openRiskLimitPct?: number;
    tradeCapPerDay?: number;
    dailyLossLimitPct?: number;
    killSwitchDrawdownPct?: number;
  };
  costs?: { costR?: number };
  goLiveGates?: {
    minClosedTrades?: number;
    minAvgR?: number;
    minProfitFactor?: number;
    maxDrawdownPct?: number;
    minProfitableWeeksPct?: number;
    maxPaperBacktestGapR?: number;
  };
  strategies: StrategyConfig[];
}

/** One go-live acceptance gate, driven by the thresholds in config. */
export interface Gate {
  id: string;
  /** What is measured, for example "Profit factor". */
  name: string;
  /** The threshold from config, for example "at least 1.3". */
  rule: string;
  status: GateStatus;
  /** The measured value, for example "+0.21R" or "20 of 100". The UI adds the Met or Not met word. */
  result: string;
  /** Progress toward the gate, 0 to 100. */
  progressPct: number;
  detail: string;
}

export interface HistogramBin {
  /** Bin label in R, such as "-1" or "+0.5". */
  label: string;
  count: number;
}

/** Result of a strategy backtest, from the bots' backtest harness. */
export interface BacktestSummary {
  /** yyyy-mm-dd */
  periodStart: string;
  periodEnd: string;
  trades: number;
  winRatePct: number;
  avgR: number;
  profitFactor: number;
  /** Largest drop from the equity peak, in percent of budget (positive number). */
  maxDrawdownPct: number;
  avgHoldDays: number;
  returnPct: number;
  /** Cost and slippage charged per trade, in R. */
  costR: number;
}

/** Everything the bot report page needs beyond the bot, trades and setups. */
export interface BotReport {
  botId: BotId;
  gates: Gate[];
  rHistogram: HistogramBin[];
  /** Backtest curve, in percent of budget, one value per rollup day. */
  backtestReturnPct: number[];
  /** Backtest statistics. Absent until the bots have run a backtest. */
  backtest?: BacktestSummary;
}
