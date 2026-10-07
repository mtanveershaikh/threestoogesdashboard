import { Component, computed, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { axisRange } from '../../charts/chart-math';
import { HistogramBars } from '../../charts/histogram-bars';
import { histogramCaption } from '../../charts/histogram-caption';
import { LineChart, LineSeries } from '../../charts/line-chart';
import { DataService } from '../../data/data.service';
import { AnalystVerdict, BotId } from '../../data/models';
import { Avatar } from '../../shared/avatar';
import { botReportFilename, botReportRows } from '../../shared/bot-report-csv';
import { toCsv } from '../../shared/csv';
import { FileDownload } from '../../shared/file-download';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { createLoader } from '../../shared/load-state';
import { arrowOf, dateLabels, exitLabel, ratio, shortDate, signedPct, signedR, signedUsd, statusLabel, toneOf, usd } from '../../shared/format';
import { GATE_COLORS, gateStatusText, gateVerdict } from '../../shared/gates';
import { ProgressRow } from '../../shared/progress-row';
import { StatTile } from '../../shared/stat-tile';

const DAYS = 60;
const TRADING_DAYS_PER_WEEK = 5;
const TRADES_SHOWN = 10;

const verdictText = (v?: AnalystVerdict) => (v ? `${v.verdict.charAt(0)}${v.verdict.slice(1).toLowerCase()} ${v.score}` : '–');

@Component({
  selector: 'app-bot-report',
  imports: [RouterLink, RouterLinkActive, Avatar, StatTile, LineChart, HistogramBars, ProgressRow, DataTable, EmptyState],
  templateUrl: './bot-report.html',
  styleUrl: './bot-report.scss',
})
export class BotReport {
  private readonly data = inject(DataService);
  protected readonly isSample = this.data.isSample;

  private readonly route = inject(ActivatedRoute);

  protected readonly loader = createLoader(() =>
    this.route.paramMap.pipe(
      map((p) => p.get('id') as BotId),
      switchMap((id) =>
        combineLatest({
          bots: this.data.getBots(),
          bot: this.data.getBot(id),
          rollups: this.data.getRollups(DAYS),
          report: this.data.getBotReport(id),
          setups: this.data.getSetupStats(id),
          trades: this.data.getRecentTrades(TRADES_SHOWN, id),
        }),
      ),
    ),
  );
  protected readonly load = this.loader.state;
  protected readonly errorMessage = computed(() => {
    const l = this.load();
    return l.status === 'error' ? l.message : '';
  });
  /** undefined while loading or after an error; `bot` is undefined inside when the id is unknown. */
  protected readonly vm = computed(() => {
    const l = this.load();
    return l.status === 'ready' ? l.value : undefined;
  });

  private readonly files = inject(FileDownload);

  /** Saves this report as a CSV, built in the browser. Nothing is sent anywhere. */
  protected downloadReport(): void {
    const vm = this.vm();
    if (!vm?.bot) return;
    const generated = new Date().toISOString().slice(0, 10);
    const csv = toCsv(botReportRows({ bot: vm.bot, report: vm.report, setups: vm.setups, trades: vm.trades }, generated));
    this.files.save(botReportFilename(vm.bot, generated), csv);
  }

  private readonly title = inject(Title);
  private readonly setTitle = effect(() => {
    const name = this.vm()?.bot?.name;
    if (name) this.title.setTitle(`${name} · The Three Stooges`);
  });

  // Header and KPI tiles
  protected readonly description = computed(() => {
    const b = this.vm()?.bot;
    return b && `${b.strategy} on the ${b.universe}. ${b.budget.toLocaleString('en-US')} USD budget, target ${ratio(b.targetRR)}, time stop ${b.timeStopDays} days.`;
  });
  protected readonly status = computed(() => {
    const st = this.vm()?.bot?.status;
    return st ? statusLabel(st) : '';
  });
  /** True while the bot only has a backtest: no paper trades yet. */
  protected readonly backtestOnly = computed(() => this.vm()?.bot?.status === 'BACKTEST_ONLY');
  protected readonly kpis = computed(() => {
    const b = this.vm()?.bot;
    if (!b) return undefined;
    const gate = (id: string) => {
      const g = this.vm()?.report?.gates.find((x) => x.id === id);
      return g && `Gate: ${g.rule}`;
    };
    const breakEven = Math.round(100 / (1 + b.targetRR));
    const bt = this.vm()?.report?.backtest;
    if (this.backtestOnly() && bt) {
      const wins = Math.round((bt.winRatePct * bt.trades) / 100);
      return {
        ret: { label: 'Backtest return', value: signedPct(bt.returnPct), tone: toneOf(bt.returnPct), delta: `${signedUsd((b.budget * bt.returnPct) / 100)} on ${usd(b.budget)}` },
        avgR: { label: 'Average per trade', value: signedR(bt.avgR, 2), tone: toneOf(bt.avgR), note: 'Backtest, after costs and slippage' },
        win: { label: 'Win rate', value: `${bt.winRatePct}%`, note: `${wins} of ${bt.trades} backtest trades. Break-even at ${ratio(b.targetRR)} is ${breakEven}%` },
        pf: { label: 'Profit factor', value: bt.profitFactor.toFixed(1), note: gate('profit-factor') },
        dd: { label: 'Max drawdown', value: `-${bt.maxDrawdownPct}%`, note: gate('drawdown') },
      };
    }
    const wins = Math.round((b.winRatePct * b.tradeCount) / 100);
    return {
      ret: { label: 'Return', value: signedPct(b.returnPct), tone: toneOf(b.returnPct), delta: `${signedUsd((b.budget * b.returnPct) / 100)} on ${usd(b.budget)}` },
      avgR: { label: 'Average per trade', value: signedR(b.avgR, 2), tone: toneOf(b.avgR), note: 'After costs and slippage' },
      win: { label: 'Win rate', value: `${b.winRatePct}%`, note: `${wins} of ${b.tradeCount} trades. Break-even at ${ratio(b.targetRR)} is ${breakEven}%` },
      pf: { label: 'Profit factor', value: b.profitFactor.toFixed(1), note: gate('profit-factor') },
      dd: { label: 'Max drawdown', value: `-${b.maxDrawdownPct}%`, note: gate('drawdown') },
    };
  });

  // Paper against backtest
  protected readonly series = computed<LineSeries[]>(() => {
    const vm = this.vm();
    if (!vm?.bot) return [];
    const backtest = vm.report?.backtestReturnPct ?? [];
    if (this.backtestOnly()) return [{ name: 'Backtest', color: vm.bot.color, width: 2.75, values: backtest }];
    return [
      ...(vm.report ? [{ name: 'Backtest expectation', color: 'var(--text-muted)', dashed: true, values: backtest }] : []),
      { name: 'Paper', color: vm.bot.color, width: 2.75, values: vm.rollups.map((r) => r.botReturnPct[vm.bot!.id]) },
    ];
  });
  protected readonly weekLabels = computed(() => {
    const bt = this.vm()?.report?.backtest;
    if (this.backtestOnly()) return bt ? dateLabels(bt.periodStart, bt.periodEnd) : [];
    return Array.from({ length: Math.ceil((this.vm()?.rollups.length ?? 0) / TRADING_DAYS_PER_WEEK) }, (_, i) => `Week ${i + 1}`);
  });
  protected readonly chartTitle = computed(() => (this.backtestOnly() ? 'Backtest results' : 'Paper results against the backtest'));
  protected readonly chartLabel = computed(() =>
    this.backtestOnly() ? `Backtest return for ${this.vm()?.bot?.name}` : `Paper return against the backtest expectation for ${this.vm()?.bot?.name}`,
  );
  protected readonly yRange = computed(() => axisRange(this.series().flatMap((s) => s.values)));

  /** One sentence about the histogram, from the numbers. */
  protected readonly histogramNote = computed(() => {
    const vm = this.vm();
    return vm?.bot && vm.report ? histogramCaption(vm.report.rHistogram, vm.bot.targetRR) : '';
  });

  // Paper and backtest side by side
  protected readonly compareColumns: Column[] = [
    { key: 'measure', label: 'Measure' },
    { key: 'paper', label: 'Paper', align: 'right', mono: true },
    { key: 'backtest', label: 'Backtest', align: 'right', mono: true },
  ];
  protected readonly compare = computed(() => {
    const vm = this.vm();
    const bot = vm?.bot;
    const bt = vm?.report?.backtest;
    if (!bot || !bt) return undefined;
    const none = this.backtestOnly();
    const paper = (value: string) => (none ? '–' : value);
    const rows = [
      { measure: 'Trades', paper: paper(`${bot.tradeCount}`), backtest: `${bt.trades}` },
      { measure: 'Win rate', paper: paper(`${bot.winRatePct}%`), backtest: `${bt.winRatePct}%` },
      { measure: 'Average per trade', paper: paper(signedR(bot.avgR, 2)), backtest: signedR(bt.avgR, 2) },
      { measure: 'Profit factor', paper: paper(bot.profitFactor.toFixed(1)), backtest: bt.profitFactor.toFixed(1) },
      { measure: 'Max drawdown', paper: paper(`-${bot.maxDrawdownPct}%`), backtest: `-${bt.maxDrawdownPct}%` },
      { measure: 'Average hold', paper: paper(`${bot.avgHoldDays} days`), backtest: `${bt.avgHoldDays} days` },
      { measure: 'Return on budget', paper: paper(signedPct(bot.returnPct)), backtest: signedPct(bt.returnPct) },
    ];
    const note = `Backtest over the same trading days (${shortDate(bt.periodStart)} to ${shortDate(bt.periodEnd)}): every signal taken, no analyst filter, after ${bt.costR}R of cost and slippage per trade.`;
    return { rows, note };
  });

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
  protected readonly noTradesText = computed(() => (this.backtestOnly() ? 'No paper trades yet.' : 'No closed trades yet.'));

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
