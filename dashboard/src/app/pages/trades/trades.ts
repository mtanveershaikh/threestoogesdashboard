import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { DataService } from '../../data/data.service';
import { Bot, BotId } from '../../data/models';
import { toCsv } from '../../shared/csv';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { FileDownload } from '../../shared/file-download';
import { arrowOf, exitLabel, shortDate, signedR, signedUsd, toneOf } from '../../shared/format';
import { createLoader } from '../../shared/load-state';
import { StatTile } from '../../shared/stat-tile';
import {
  BOT_IDS, EXITS, TradeFilters, applyFilters, filtersFromParams, hasFilters, paramsFromFilters, summarize,
} from './trade-filters';
import { tradesRows } from './trades-csv';

/** How many trades one request loads, and how many each "Load more" adds. */
export const PAGE_SIZE = 100;
/** The most trades the page will load (the data service also caps it). */
export const MAX_TRADES = 1000;

const verdictText = (v?: { verdict: string; score: number }) => (v ? `${v.verdict.charAt(0)}${v.verdict.slice(1).toLowerCase()} ${v.score}` : '–');
const EXIT_OPTIONS = EXITS.map((e) => ({ value: e, label: exitLabel(e) }));
const RESULT_OPTIONS = [
  { value: 'win', label: 'Wins' },
  { value: 'loss', label: 'Losses' },
  { value: 'even', label: 'Break-even' },
] as const;

@Component({
  selector: 'app-trades',
  imports: [StatTile, DataTable, EmptyState],
  templateUrl: './trades.html',
  styleUrl: './trades.scss',
})
export class Trades {
  private readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly files = inject(FileDownload);

  protected readonly resultOptions = RESULT_OPTIONS;
  protected readonly exitOptions = EXIT_OPTIONS;
  protected readonly botIds = BOT_IDS;

  // The filters live in the URL, so a filtered view can be shared or bookmarked.
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly filters = computed<TradeFilters>(() => filtersFromParams((k) => this.params().get(k)));
  protected readonly filtered = computed(() => hasFilters(this.filters()));

  /** How many trades are loaded for each bot filter, so switching bots never needs a reset. */
  private readonly limits = signal<Record<string, number>>({});
  private readonly request = computed(() => ({ bot: this.filters().bot, limit: this.limits()[this.filters().bot ?? 'all'] ?? PAGE_SIZE }));
  private readonly request$ = toObservable(this.request);

  protected readonly loader = createLoader(() =>
    combineLatest({
      bots: this.data.getBots(),
      trades: this.request$.pipe(switchMap((r) => this.data.getTradeHistory({ limit: r.limit, botId: r.bot }))),
    }),
  );
  private readonly load = this.loader.state;
  protected readonly status = computed(() => this.load().status);
  protected readonly errorMessage = computed(() => {
    const l = this.load();
    return l.status === 'error' ? l.message : '';
  });
  private readonly ready = computed(() => {
    const l = this.load();
    return l.status === 'ready' ? l.value : undefined;
  });
  protected readonly bots = computed<Bot[]>(() => this.ready()?.bots ?? []);
  protected readonly loaded = computed(() => this.ready()?.trades ?? []);
  /** True when the database has no older trades than the ones loaded. */
  protected readonly loadedAll = computed(() => this.loaded().length < this.request().limit || this.request().limit >= MAX_TRADES);
  protected readonly canLoadMore = computed(() => !this.loadedAll());

  protected readonly shown = computed(() => applyFilters(this.loaded(), this.filters()));
  protected readonly summary = computed(() => summarize(this.shown()));
  protected readonly summaryTiles = computed(() => {
    const s = this.summary();
    return {
      winRate: s.count ? `${s.winRatePct}%` : '–',
      winNote: `${s.wins} of ${s.count} trades`,
      totalR: { value: signedR(s.totalR, 2), tone: toneOf(s.totalR) },
      avgR: { value: signedR(s.avgR, 2), tone: toneOf(s.avgR) },
      net: { value: signedUsd(s.netUsd), tone: toneOf(s.netUsd) },
    };
  });

  protected readonly columns: Column[] = [
    { key: 'date', label: 'Date' },
    { key: 'symbol', label: 'Stock', mono: true },
    { key: 'bot', label: 'Bot' },
    { key: 'fundamental', label: 'Fundamental' },
    { key: 'technical', label: 'Technical' },
    { key: 'exit', label: 'Exit' },
    { key: 'r', label: 'R', align: 'right', mono: true },
    { key: 'usd', label: 'USD', align: 'right', mono: true },
  ];
  protected readonly rows = computed(() => {
    const byId = new Map(this.bots().map((b) => [b.id, b]));
    return this.shown().map((t) => ({
      date: shortDate(t.closedAt),
      symbol: t.symbol,
      botName: byId.get(t.botId)?.name ?? t.botId,
      botColor: byId.get(t.botId)?.color,
      fundamental: verdictText(t.fundamental),
      technical: verdictText(t.technical),
      exit: exitLabel(t.exitReason),
      r: `${arrowOf(t.rMultiple)} ${signedR(t.rMultiple)}`.trim(),
      usd: `${arrowOf(t.pnlUsd)} ${signedUsd(t.pnlUsd)}`.trim(),
      tone: toneOf(t.rMultiple),
    }));
  });

  protected botName(id: BotId): string {
    return this.bots().find((b) => b.id === id)?.name ?? id;
  }

  /** Changes one filter by rewriting the URL. */
  protected setFilter(key: keyof TradeFilters, value: string): void {
    const next = { ...this.filters(), [key]: value.trim() === '' ? undefined : value } as TradeFilters;
    void this.router.navigate([], { relativeTo: this.route, queryParams: paramsFromFilters(next), queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected clearFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: paramsFromFilters({}), queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected loadMore(): void {
    const key = this.filters().bot ?? 'all';
    this.limits.update((l) => ({ ...l, [key]: Math.min(MAX_TRADES, (l[key] ?? PAGE_SIZE) + PAGE_SIZE) }));
  }

  protected refresh(): void {
    this.loader.retry();
  }

  protected downloadCsv(): void {
    const day = new Date().toISOString().slice(0, 10);
    this.files.save(`trades-${day}.csv`, toCsv(tradesRows(this.shown(), this.bots())));
  }
}
