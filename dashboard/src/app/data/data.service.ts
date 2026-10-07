import { Observable } from 'rxjs';
import {
  Bot,
  BotId,
  BotReport,
  DailyRollup,
  Plan,
  Position,
  SetupStat,
  SystemConfig,
  SystemStatus,
  Trade,
} from './models';

/**
 * Read-only data access. Components inject this, never Firestore.
 * There is deliberately no write method.
 */
export abstract class DataService {
  /** True when the data is sample data; the UI shows the Sample data badge. */
  abstract readonly isSample: boolean;

  abstract getSystemStatus(): Observable<SystemStatus>;
  abstract getBots(): Observable<Bot[]>;
  /** The settings the bots publish, or undefined when they have not published any yet. */
  abstract getConfig(): Observable<SystemConfig | undefined>;
  abstract getBot(id: BotId): Observable<Bot | undefined>;
  /** The latest `days` trading days, oldest first, or every day on record for 'all'. */
  abstract getRollups(days: number | 'all'): Observable<DailyRollup[]>;
  abstract getPlans(): Observable<Plan[]>;
  abstract getOpenPositions(): Observable<Position[]>;
  abstract getRecentTrades(limit: number, botId?: BotId): Observable<Trade[]>;
  /**
   * The latest `limit` closed trades, newest first, optionally for one bot. One-shot: it emits once and
   * completes, because the Trades page must not refresh on a timer (it can read hundreds of documents).
   */
  abstract getTradeHistory(options: { limit: number; botId?: BotId }): Observable<Trade[]>;
  abstract getSetupStats(botId: BotId): Observable<SetupStat[]>;
  abstract getBotReport(botId: BotId): Observable<BotReport | undefined>;
  /** Every bot's report, for pages that compare bots (backtest-only Overview). */
  abstract getBotReports(): Observable<BotReport[]>;
}
