import { Observable } from 'rxjs';
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
 * Read-only data access. Components inject this, never Firestore.
 * There is deliberately no write method.
 */
export abstract class DataService {
  /** True when the data is sample data; the UI shows the Sample data badge. */
  abstract readonly isSample: boolean;

  abstract getSystemStatus(): Observable<SystemStatus>;
  abstract getBots(): Observable<Bot[]>;
  abstract getBot(id: BotId): Observable<Bot | undefined>;
  abstract getRollups(days: number): Observable<DailyRollup[]>;
  abstract getPlans(): Observable<Plan[]>;
  abstract getOpenPositions(): Observable<Position[]>;
  abstract getRecentTrades(limit: number, botId?: BotId): Observable<Trade[]>;
  abstract getSetupStats(botId: BotId): Observable<SetupStat[]>;
  abstract getBotReport(botId: BotId): Observable<BotReport | undefined>;
}
