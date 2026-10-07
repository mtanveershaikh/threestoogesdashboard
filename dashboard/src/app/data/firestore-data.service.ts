import {
  Firestore, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where,
} from 'firebase/firestore';
import { Observable, filter, from, shareReplay, switchMap, timer } from 'rxjs';
import { DataService } from './data.service';
import {
  Bot, BotId, BotReport, DailyRollup, Plan, Position, SetupStat, SystemStatus, Trade,
} from './models';

/**
 * One-shot reads refresh this often. The free plan allows 50,000 reads a day.
 * Everything except the rollups is a handful of documents, so one minute is cheap.
 */
export const REFRESH_MS = 60_000;
/** Rollups are up to 60 documents and change once a day, so they refresh slowly. */
export const ROLLUP_REFRESH_MS = 10 * 60_000;

/**
 * Reads the collections in DASHBOARD-DESIGN.md section 7. Read-only: it only imports read functions.
 * Plain class, not an Angular service, so the same code runs in the emulator tests.
 */
export class FirestoreDataService extends DataService {
  readonly isSample: boolean;

  /** The only live listener: system/status, shared by every subscriber. */
  private readonly status$ = new Observable<SystemStatus>((sub) =>
    onSnapshot(
      doc(this.db, 'system', 'status'),
      (snap) => snap.exists() && sub.next(snap.data() as SystemStatus),
      (err) => sub.error(err),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor(
    private readonly db: Firestore,
    /** True for the emulator, whose data is the sample fixtures. */
    isSample = false,
  ) {
    super();
    this.isSample = isSample;
  }

  getSystemStatus(): Observable<SystemStatus> {
    return this.status$;
  }

  getBots(): Observable<Bot[]> {
    return this.poll(async () => (await getDocs(query(collection(this.db, 'bots'), orderBy('name')))).docs.map((d) => ({ ...d.data(), id: d.id }) as Bot));
  }

  getBot(id: BotId): Observable<Bot | undefined> {
    return this.poll(async () => {
      const snap = await getDoc(doc(this.db, 'bots', id));
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as Bot) : undefined;
    });
  }

  getRollups(days: number): Observable<DailyRollup[]> {
    return this.poll(async () => {
      const snap = await getDocs(query(collection(this.db, 'daily_rollups'), orderBy('date', 'desc'), limit(days)));
      return snap.docs.map((d) => d.data() as DailyRollup).reverse();
    }, ROLLUP_REFRESH_MS);
  }

  getPlans(): Observable<Plan[]> {
    return this.poll(async () => {
      const snap = await getDocs(query(collection(this.db, 'plans'), where('status', 'in', ['PROPOSED', 'ARMED'])));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Plan);
    });
  }

  getOpenPositions(): Observable<Position[]> {
    return this.poll(async () => {
      const snap = await getDocs(query(collection(this.db, 'positions'), where('open', '==', true)));
      return snap.docs.map((d) => {
        const data = d.data();
        delete data['open']; // a query flag, not part of the Position shape
        return { ...data, id: d.id } as Position;
      });
    });
  }

  getRecentTrades(count: number, botId?: BotId): Observable<Trade[]> {
    return this.poll(async () => {
      const trades = collection(this.db, 'trades');
      const q = botId
        ? query(trades, where('botId', '==', botId), orderBy('closedAt', 'desc'), limit(count))
        : query(trades, orderBy('closedAt', 'desc'), limit(count));
      return (await getDocs(q)).docs.map((d) => ({ ...d.data(), id: d.id }) as Trade);
    });
  }

  getSetupStats(botId: BotId): Observable<SetupStat[]> {
    return this.poll(async () => {
      const snap = await getDocs(query(collection(this.db, 'setup_stats'), where('botId', '==', botId)));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as SetupStat);
    });
  }

  getBotReport(botId: BotId): Observable<BotReport | undefined> {
    return this.poll(async () => {
      const snap = await getDoc(doc(this.db, 'bot_reports', botId));
      return snap.exists() ? (snap.data() as BotReport) : undefined;
    });
  }

  /** Reads now, then again every `everyMs`. Refreshes are skipped while the tab is hidden. */
  private poll<T>(read: () => Promise<T>, everyMs = REFRESH_MS): Observable<T> {
    return timer(0, everyMs).pipe(
      filter((tick) => tick === 0 || typeof document === 'undefined' || !document.hidden),
      switchMap(() => from(read())),
    );
  }
}
