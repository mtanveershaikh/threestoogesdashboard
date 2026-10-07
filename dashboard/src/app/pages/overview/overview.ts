import { Component, computed, inject } from '@angular/core';
import { combineLatest } from 'rxjs';
import { environment } from '../../../environments/environment';
import { axisRange } from '../../charts/chart-math';
import { LineChart, LineSeries } from '../../charts/line-chart';
import { DataService } from '../../data/data.service';
import { Bot, BotId } from '../../data/models';
import { BotCard } from '../../shared/bot-card';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { createLoader } from '../../shared/load-state';
import { arrowOf, exitLabel, shortDate, signedPct, signedR, signedUsd, toneOf, usd } from '../../shared/format';
import { PlanCard } from '../../shared/plan-card';
import { ProgressRow } from '../../shared/progress-row';
import { StatTile } from '../../shared/stat-tile';

const DAYS = 60;
const TRADING_DAYS_PER_WEEK = 5;
const CLOSED_LIMIT = 6;

const shortName = (b: Bot) => b.name.replace(/ Bot$/, '');

@Component({
  selector: 'app-overview',
  imports: [StatTile, ProgressRow, LineChart, PlanCard, BotCard, DataTable, EmptyState],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview {
  private readonly data = inject(DataService);

  protected readonly telegramUrl = environment.telegramUrl;
  protected readonly isSample = this.data.isSample;

  protected readonly loader = createLoader(() =>
    combineLatest({
      status: this.data.getSystemStatus(),
      bots: this.data.getBots(),
      rollups: this.data.getRollups(DAYS),
      plans: this.data.getPlans(),
      positions: this.data.getOpenPositions(),
      trades: this.data.getRecentTrades(CLOSED_LIMIT),
    }),
  );
  protected readonly load = this.loader.state;
  private readonly ready = computed(() => {
    const l = this.load();
    return l.status === 'ready' ? l.value : undefined;
  });

  protected readonly errorMessage = computed(() => {
    const l = this.load();
    return l.status === 'error' ? l.message : '';
  });
  protected readonly status = computed(() => this.ready()?.status);
  protected readonly bots = computed(() => this.ready()?.bots ?? []);
  protected readonly rollups = computed(() => this.ready()?.rollups ?? []);
  protected readonly plans = computed(() => this.ready()?.plans ?? []);
  private readonly positions = computed(() => this.ready()?.positions ?? []);
  private readonly trades = computed(() => this.ready()?.trades ?? []);

  private readonly botsById = computed(() => new Map(this.bots().map((b) => [b.id, b])));
  protected botFor(id: BotId): Bot | undefined {
    return this.botsById().get(id);
  }

  // KPI tiles
  protected readonly equity = computed(() => {
    const s = this.status();
    return s && { value: usd(s.equity), delta: `${signedPct(s.returnSinceStartPct)} since start`, tone: toneOf(s.returnSinceStartPct) };
  });
  protected readonly today = computed(() => {
    const s = this.status();
    return s && { value: signedUsd(s.todayPnl), delta: `${signedPct(s.todayPct)} of equity`, tone: toneOf(s.todayPnl) };
  });
  protected readonly risk = computed(() => {
    const s = this.status();
    return s && { value: `${s.openRiskPct}%`, pct: (s.openRiskPct / s.openRiskLimitPct) * 100, limit: s.openRiskLimitPct };
  });
  protected readonly tradesToday = computed(() => {
    const s = this.status();
    return s && { value: `${s.tradesToday}`, pct: (s.tradesToday / s.tradeCap) * 100, cap: s.tradeCap };
  });
  protected readonly kill = computed(() => {
    const k = this.status()?.killSwitch;
    return (
      k && {
        value: k.state === 'ARMED' ? 'Armed, normal' : 'Tripped, trading stopped',
        tone: k.state === 'ARMED' ? ('gain' as const) : ('loss' as const),
        detail: `Drawdown ${signedPct(k.drawdownPct)} of ${signedPct(k.limitPct, 0)}`,
      }
    );
  });

  protected readonly subtitle = computed(() => {
    const s = this.status();
    return s && `Week ${s.week} of the ${s.mode} run. Three bots, ${s.startingCapital.toLocaleString('en-US')} USD starting capital.`;
  });

  // Return chart
  protected readonly series = computed<LineSeries[]>(() => [
    ...this.bots().map((b) => ({ name: shortName(b), color: b.color, values: this.trend(b.id) })),
    { name: 'Total', color: 'var(--text)', width: 2.75, values: this.rollups().map((r) => r.totalReturnPct) },
  ]);
  protected readonly weekLabels = computed(() =>
    Array.from({ length: Math.ceil(this.rollups().length / TRADING_DAYS_PER_WEEK) }, (_, i) => `Week ${i + 1}`),
  );
  protected readonly yRange = computed(() => axisRange(this.series().flatMap((s) => s.values)));

  protected trend(id: BotId): number[] {
    return this.rollups().map((r) => r.botReturnPct[id]);
  }

  // Tables
  protected readonly positionColumns: Column[] = [
    { key: 'symbol', label: 'Stock', mono: true },
    { key: 'bot', label: 'Bot' },
    { key: 'entry', label: 'Entry', align: 'right', mono: true },
    { key: 'last', label: 'Last', align: 'right', mono: true },
    { key: 'stop', label: 'Stop', align: 'right', mono: true },
    { key: 'result', label: 'Result', align: 'right', mono: true },
  ];
  protected readonly positionRows = computed(() =>
    this.positions().map((p) => ({
      symbol: p.symbol,
      botName: shortName(this.botFor(p.botId)!),
      botColor: this.botFor(p.botId)?.color,
      entry: p.entry.toFixed(2),
      last: p.last.toFixed(2),
      stop: p.stop.toFixed(2),
      result: `${arrowOf(p.rMultiple)} ${signedR(p.rMultiple)}`.trim(),
      tone: toneOf(p.rMultiple),
    })),
  );

  protected readonly closedColumns: Column[] = [
    { key: 'date', label: 'Date' },
    { key: 'symbol', label: 'Stock', mono: true },
    { key: 'bot', label: 'Bot' },
    { key: 'exit', label: 'Exit' },
    { key: 'result', label: 'R', align: 'right', mono: true },
    { key: 'pnl', label: 'Result', align: 'right', mono: true },
  ];
  protected readonly closedRows = computed(() =>
    this.trades().map((t) => ({
      date: shortDate(t.closedAt),
      symbol: t.symbol,
      botName: shortName(this.botFor(t.botId)!),
      botColor: this.botFor(t.botId)?.color,
      exit: exitLabel(t.exitReason),
      result: `${arrowOf(t.rMultiple)} ${signedR(t.rMultiple)}`.trim(),
      pnl: `${arrowOf(t.pnlUsd)} ${signedUsd(t.pnlUsd)}`.trim(),
      tone: toneOf(t.pnlUsd),
    })),
  );
}
