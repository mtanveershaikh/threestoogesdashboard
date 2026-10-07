import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import { axisRange } from '../../charts/chart-math';
import { HistogramBars } from '../../charts/histogram-bars';
import { LineChart, LineSeries } from '../../charts/line-chart';
import { DataService } from '../../data/data.service';
import { AnalystVerdict, BotId } from '../../data/models';
import { Avatar } from '../../shared/avatar';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { arrowOf, exitLabel, ratio, shortDate, signedPct, signedR, signedUsd, toneOf, usd } from '../../shared/format';
import { GATE_COLORS, gateStatusText, gateVerdict } from '../../shared/gates';
import { ProgressRow } from '../../shared/progress-row';
import { StatTile } from '../../shared/stat-tile';

const DAYS = 60;
const TRADING_DAYS_PER_WEEK = 5;
const TRADES_SHOWN = 10;

const verdictText = (v?: AnalystVerdict) => (v ? `${v.verdict.charAt(0)}${v.verdict.slice(1).toLowerCase()} ${v.score}` : '–');

@Component({
  selector: 'app-bot-report',
  imports: [RouterLink, Avatar, StatTile, LineChart, HistogramBars, ProgressRow, DataTable, EmptyState],
  templateUrl: './bot-report.html',
  styleUrl: './bot-report.scss',
})
export class BotReport {
  private readonly data = inject(DataService);
  protected readonly isSample = this.data.isSample;

  /** undefined while loading; `bot` is undefined inside when the id is unknown. */
  protected readonly vm = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((p) => p.get('id') as BotId),
      switchMap((id) =>
        forkJoin({
          bot: this.data.getBot(id),
          rollups: this.data.getRollups(DAYS),
          report: this.data.getBotReport(id),
          setups: this.data.getSetupStats(id),
          trades: this.data.getRecentTrades(TRADES_SHOWN, id),
        }),
      ),
    ),
  );

  // Header and KPI tiles
  protected readonly description = computed(() => {
    const b = this.vm()?.bot;
    return b && `${b.strategy} on the ${b.universe}. ${b.budget.toLocaleString('en-US')} USD budget, target ${ratio(b.targetRR)}, time stop ${b.timeStopDays} days.`;
  });
  protected readonly status = computed(() => {
    const s = this.vm()?.bot?.status ?? '';
    return s.charAt(0) + s.slice(1).toLowerCase();
  });
  protected readonly kpis = computed(() => {
    const b = this.vm()?.bot;
    if (!b) return undefined;
    const wins = Math.round((b.winRatePct * b.tradeCount) / 100);
    const gate = (id: string) => {
      const g = this.vm()?.report?.gates.find((x) => x.id === id);
      return g && `Gate: ${g.rule}`;
    };
    return {
      ret: { value: signedPct(b.returnPct), tone: toneOf(b.returnPct), delta: `${signedUsd((b.budget * b.returnPct) / 100)} on ${usd(b.budget)}` },
      avgR: { value: signedR(b.avgR, 2), tone: toneOf(b.avgR), note: 'After costs and slippage' },
      win: { value: `${b.winRatePct}%`, note: `${wins} of ${b.tradeCount} trades. Break-even at ${ratio(b.targetRR)} is ${Math.round(100 / (1 + b.targetRR))}%` },
      pf: { value: b.profitFactor.toFixed(1), note: gate('profit-factor') },
      dd: { value: `-${b.maxDrawdownPct}%`, note: gate('drawdown') },
    };
  });

  // Paper against backtest
  protected readonly series = computed<LineSeries[]>(() => {
    const vm = this.vm();
    if (!vm?.bot) return [];
    return [
      ...(vm.report ? [{ name: 'Backtest expectation', color: 'var(--text-muted)', dashed: true, values: vm.report.backtestReturnPct }] : []),
      { name: 'Paper', color: vm.bot.color, width: 2.75, values: vm.rollups.map((r) => r.botReturnPct[vm.bot!.id]) },
    ];
  });
  protected readonly weekLabels = computed(() =>
    Array.from({ length: Math.ceil((this.vm()?.rollups.length ?? 0) / TRADING_DAYS_PER_WEEK) }, (_, i) => `Week ${i + 1}`),
  );
  protected readonly yRange = computed(() => axisRange(this.series().flatMap((s) => s.values)));

  // Go-live checklist
  protected readonly gates = computed(() =>
    (this.vm()?.report?.gates ?? []).map((g) => ({
      label: `${g.name}, ${g.rule}`,
      status: gateStatusText(g),
      pct: g.progressPct,
      color: GATE_COLORS[g.status],
      detail: g.detail,
    })),
  );
  protected readonly verdict = computed(() => {
    const gates = this.vm()?.report?.gates;
    return gates?.length ? gateVerdict(gates) : undefined;
  });

  // Tables
  protected readonly setupColumns: Column[] = [
    { key: 'name', label: 'Setup' },
    { key: 'trades', label: 'Trades', align: 'right', mono: true },
    { key: 'win', label: 'Win rate', align: 'right', mono: true },
    { key: 'avgR', label: 'Avg R', align: 'right', mono: true },
    { key: 'state', label: 'Memory screen' },
  ];
  protected readonly setupRows = computed(() =>
    (this.vm()?.setups ?? []).map((s) => ({
      name: s.name,
      trades: s.trades,
      win: `${s.winRatePct}%`,
      avgR: `${arrowOf(s.avgR)} ${signedR(s.avgR)}`.trim(),
      tone: toneOf(s.avgR),
      state: s.state === 'ACTIVE' ? 'Active' : `Watching, ${s.tradesToGo} trades to go`,
    })),
  );

  protected readonly tradeColumns: Column[] = [
    { key: 'date', label: 'Date' },
    { key: 'symbol', label: 'Stock', mono: true },
    { key: 'fundamental', label: 'Fundamental' },
    { key: 'technical', label: 'Technical' },
    { key: 'exit', label: 'Exit' },
    { key: 'result', label: 'Result', align: 'right', mono: true },
  ];
  protected readonly tradeRows = computed(() =>
    (this.vm()?.trades ?? []).map((t) => ({
      date: shortDate(t.closedAt),
      symbol: t.symbol,
      fundamental: verdictText(t.fundamental),
      technical: verdictText(t.technical),
      exit: exitLabel(t.exitReason),
      result: `${arrowOf(t.rMultiple)} ${signedR(t.rMultiple)}`.trim(),
      tone: toneOf(t.rMultiple),
    })),
  );
}
