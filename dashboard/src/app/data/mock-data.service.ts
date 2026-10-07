import { Observable, of } from 'rxjs';
import { DataService } from './data.service';
import {
  Bot, BotId, BotReport, DailyRollup, Plan, Position, SetupStat, SystemStatus, Trade,
} from './models';
import {
  MOCK_BOTS, MOCK_PLANS, MOCK_POSITIONS, MOCK_REPORTS, MOCK_ROLLUPS, MOCK_SETUPS, MOCK_STATUS, MOCK_TRADES,
} from './mock-fixtures';

export class MockDataService extends DataService {
  readonly isSample = true;

  getSystemStatus(): Observable<SystemStatus> {
    return of(MOCK_STATUS);
  }

  getBots(): Observable<Bot[]> {
    return of(MOCK_BOTS);
  }

  getBot(id: BotId): Observable<Bot | undefined> {
    return of(MOCK_BOTS.find((b) => b.id === id));
  }

  getRollups(days: number): Observable<DailyRollup[]> {
    return of(MOCK_ROLLUPS.slice(-days));
  }

  getPlans(): Observable<Plan[]> {
    return of(MOCK_PLANS);
  }

  getOpenPositions(): Observable<Position[]> {
    return of(MOCK_POSITIONS);
  }

  getRecentTrades(limit: number, botId?: BotId): Observable<Trade[]> {
    const trades = botId ? MOCK_TRADES.filter((t) => t.botId === botId) : MOCK_TRADES;
    return of(trades.slice(0, limit));
  }

  getSetupStats(botId: BotId): Observable<SetupStat[]> {
    return of(MOCK_SETUPS.filter((s) => s.botId === botId));
  }

  getBotReport(botId: BotId): Observable<BotReport | undefined> {
    return of(MOCK_REPORTS[botId]);
  }
}
