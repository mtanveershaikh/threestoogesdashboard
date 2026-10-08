import { Observable, of } from 'rxjs';
import { DataService } from './data.service';
import {
  AuditEvent, Bot, BotId, BotReport, DailyRollup, Plan, Position, SetupStat, SystemConfig, SystemStatus, Trade,
} from './models';
import { MockDataset, Scenario, datasetFor } from './mock-scenarios';

export class MockDataService extends DataService {
  readonly isSample = true;
  private readonly data: MockDataset;

  constructor(scenario: Scenario = 'paper') {
    super();
    this.data = datasetFor(scenario);
  }

  getSystemStatus(): Observable<SystemStatus> {
    return of(this.data.status);
  }

  getConfig(): Observable<SystemConfig | undefined> {
    return of(this.data.config);
  }

  getBots(): Observable<Bot[]> {
    return of(this.data.bots);
  }

  getBot(id: BotId): Observable<Bot | undefined> {
    return of(this.data.bots.find((b) => b.id === id));
  }

  getRollups(days: number | 'all'): Observable<DailyRollup[]> {
    return of(days === 'all' ? this.data.rollups : this.data.rollups.slice(-days));
  }

  getPlans(): Observable<Plan[]> {
    return of(this.data.plans);
  }

  getOpenPositions(): Observable<Position[]> {
    return of(this.data.positions);
  }

  getRecentTrades(limit: number, botId?: BotId): Observable<Trade[]> {
    const trades = botId ? this.data.trades.filter((t) => t.botId === botId) : this.data.trades;
    return of(trades.slice(0, limit));
  }

  getTradeHistory(options: { limit: number; botId?: BotId }): Observable<Trade[]> {
    const trades = options.botId ? this.data.trades.filter((t) => t.botId === options.botId) : this.data.trades;
    return of(trades.slice(0, options.limit));
  }

  getAuditEvents(options: { limit: number; planId?: string; tradeId?: string; action?: string }): Observable<AuditEvent[]> {
    const events = this.data.audit
      .filter((e) => (!options.planId || e.planId === options.planId) && (!options.tradeId || e.tradeId === options.tradeId) && (!options.action || e.action === options.action))
      .sort((a, b) => b.time.localeCompare(a.time));
    return of(events.slice(0, options.limit));
  }

  getSetupStats(botId: BotId): Observable<SetupStat[]> {
    return of(this.data.setups.filter((s) => s.botId === botId));
  }

  getBotReport(botId: BotId): Observable<BotReport | undefined> {
    return of(this.data.reports[botId]);
  }

  getBotReports(): Observable<BotReport[]> {
    return of(Object.values(this.data.reports));
  }
}
