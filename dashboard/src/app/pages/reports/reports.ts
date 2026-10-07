import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { DataService } from '../../data/data.service';
import { Bot, BotId } from '../../data/models';
import { CsvCell, toCsv } from '../../shared/csv';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { FileDownload } from '../../shared/file-download';
import { arrowOf, shortDate, signedPct, signedR, signedUsd, toneOf } from '../../shared/format';
import { createLoader } from '../../shared/load-state';
import { StatTile } from '../../shared/stat-tile';
import { MAX_TRADES } from '../trades/trade-limits';
import { PeriodRow, PeriodView, buildPeriods, periodLabel } from './report-periods';

const pct = (n: number) => `${arrowOf(n)} ${signedPct(n, 2)}`.trim();

@Component({
  selector: 'app-reports',
  imports: [StatTile, DataTable, EmptyState],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  private readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly files = inject(FileDownload);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly view = computed<PeriodView>(() => (this.params().get('view') === 'month' ? 'month' : 'week'));
  protected readonly noun = computed(() => (this.view() === 'month' ? 'month' : 'week'));

  protected readonly loader = createLoader(() =>
    combineLatest({
      bots: this.data.getBots(),
      rollups: this.data.getRollups('all'),
      trades: this.data.getTradeHistory({ limit: MAX_TRADES }),
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

  protected readonly periods = computed<PeriodRow[]>(() => {
    const r = this.ready();
    return r ? buildPeriods(r.rollups, r.trades, this.view()) : [];
  });
  /** True when older trades than the ones loaded may exist, so trade counts for the oldest periods can be low. */
  protected readonly tradesTruncated = computed(() => (this.ready()?.trades.length ?? 0) >= MAX_TRADES);
  protected readonly maxTrades = MAX_TRADES;

  protected readonly latest = computed(() => {
    const row = this.periods()[0];
    if (!row) return undefined;
    return {
      title: periodLabel(row, this.view()),
      ret: { value: signedPct(row.totalReturnPct, 2), tone: toneOf(row.totalReturnPct) },
      trades: `${row.trades}`,
      winRate: row.trades ? `${row.winRatePct}%` : '–',
      winNote: `${row.wins} of ${row.trades} trades`,
      avgR: { value: signedR(row.avgR, 2), tone: toneOf(row.avgR) },
      net: { value: signedUsd(row.netUsd), tone: toneOf(row.netUsd) },
    };
  });

  private botName(id: BotId): string {
    return this.bots().find((b) => b.id === id)?.name ?? id;
  }

  protected readonly columns = computed<Column[]>(() => [
    { key: 'period', label: this.view() === 'month' ? 'Month' : 'Week' },
    { key: 'ret', label: 'Return', align: 'right', mono: true },
    ...this.bots().map((b) => ({ key: `bot-${b.id}`, label: b.name, align: 'right' as const, mono: true })),
    { key: 'trades', label: 'Trades', align: 'right', mono: true },
    { key: 'win', label: 'Win rate', align: 'right', mono: true },
    { key: 'avgR', label: 'Avg R', align: 'right', mono: true },
    { key: 'net', label: 'Net USD', align: 'right', mono: true },
    { key: 'best', label: 'Best bot' },
    { key: 'worst', label: 'Worst bot' },
  ]);

  protected readonly rows = computed(() =>
    this.periods().map((p) => ({
      period: periodLabel(p, this.view()),
      ret: pct(p.totalReturnPct),
      retTone: toneOf(p.totalReturnPct),
      ...Object.fromEntries(this.bots().map((b) => [`bot-${b.id}`, pct(p.botReturnPct[b.id])])),
      ...Object.fromEntries(this.bots().map((b) => [`tone-${b.id}`, toneOf(p.botReturnPct[b.id])])),
      trades: `${p.trades}`,
      win: p.trades ? `${p.winRatePct}%` : '–',
      avgR: p.trades ? `${arrowOf(p.avgR)} ${signedR(p.avgR, 2)}`.trim() : '–',
      avgTone: toneOf(p.avgR),
      net: `${arrowOf(p.netUsd)} ${signedUsd(p.netUsd)}`.trim(),
      netTone: toneOf(p.netUsd),
      best: this.botName(p.best),
      worst: this.botName(p.worst),
    })),
  );

  protected setView(view: PeriodView): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { view: view === 'week' ? null : view }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected refresh(): void {
    this.loader.retry();
  }

  protected dates(p: PeriodRow): string {
    return `${shortDate(p.start)} to ${shortDate(p.end)}`;
  }

  protected downloadCsv(): void {
    const bots = this.bots();
    const header: CsvCell[] = [
      this.view() === 'month' ? 'Month' : 'Week of', 'First day', 'Last day', 'Return (% of capital)',
      ...bots.map((b) => `${b.name} (% of its budget)`), 'Trades', 'Win rate (%)', 'Average per trade (R)', 'Net result (USD)', 'Best bot', 'Worst bot',
    ];
    const lines = this.periods().map((p): CsvCell[] => [
      p.key, p.start, p.end, p.totalReturnPct, ...bots.map((b) => p.botReturnPct[b.id]), p.trades, p.winRatePct, p.avgR, p.netUsd, this.botName(p.best), this.botName(p.worst),
    ]);
    const day = new Date().toISOString().slice(0, 10);
    this.files.save(`${this.view() === 'month' ? 'monthly' : 'weekly'}-report-${day}.csv`, toCsv([header, ...lines]));
  }
}
