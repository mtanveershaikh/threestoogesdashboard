import { Bot, BotReport, SetupStat, Trade } from '../data/models';
import { CsvCell } from './csv';
import { exitLabel } from './format';

const GATE_WORDS = { MET: 'Met', PENDING: 'Not yet', FAILED: 'Not met' } as const;

export interface BotReportData {
  bot: Bot;
  report?: BotReport;
  setups: SetupStat[];
  trades: Trade[];
}

/**
 * The bot report as CSV rows. Numbers are plain (percent as 4.2, R as 0.21, losses negative) and
 * the headers say the unit. A backtest-only bot leaves the paper column blank.
 */
export function botReportRows(d: BotReportData, generated: string): CsvCell[][] {
  const { bot, report, setups, trades } = d;
  const bt = report?.backtest;
  const noPaper = bot.status === 'BACKTEST_ONLY';
  const paper = <T extends CsvCell>(v: T): CsvCell => (noPaper ? '' : v);

  const rows: CsvCell[][] = [
    ['Report', bot.name, 'Generated', generated],
    ['Strategy', bot.strategy, 'Universe', bot.universe],
    ['Budget (USD)', bot.budget, 'Target reward to risk', bot.targetRR, 'Time stop (days)', bot.timeStopDays],
    [],
    ['Measure', 'Paper', 'Backtest'],
    ['Trades', paper(bot.tradeCount), bt?.trades],
    ['Win rate (%)', paper(bot.winRatePct), bt?.winRatePct],
    ['Average per trade (R)', paper(bot.avgR), bt?.avgR],
    ['Profit factor', paper(bot.profitFactor), bt?.profitFactor],
    ['Max drawdown (% of budget)', paper(bot.maxDrawdownPct), bt?.maxDrawdownPct],
    ['Average hold (days)', paper(bot.avgHoldDays), bt?.avgHoldDays],
    ['Return on budget (%)', paper(bot.returnPct), bt?.returnPct],
  ];
  if (bt) rows.push(['Backtest period', bt.periodStart, 'to', bt.periodEnd, 'Cost per trade (R)', bt.costR]);

  rows.push([], ['Go-live gate', 'Rule', 'Status', 'Result', 'Detail']);
  for (const g of report?.gates ?? []) rows.push([g.name, g.rule, GATE_WORDS[g.status], g.result, g.detail]);

  rows.push([], ['Setup', 'Trades', 'Win rate (%)', 'Average per trade (R)', 'Memory screen']);
  for (const s of setups) {
    rows.push([s.name, s.trades, s.winRatePct, s.avgR, s.state === 'ACTIVE' ? 'Active' : `Watching, ${s.tradesToGo ?? 0} trades to go`]);
  }

  rows.push([], ['Date closed', 'Stock', 'Fundamental', 'Fundamental score', 'Technical', 'Technical score', 'Exit', 'Result (R)', 'Result (USD)']);
  for (const t of trades) {
    rows.push([t.closedAt, t.symbol, t.fundamental?.verdict, t.fundamental?.score, t.technical?.verdict, t.technical?.score, exitLabel(t.exitReason), t.rMultiple, t.pnlUsd]);
  }
  return rows;
}

/** "wasif-report-2026-10-07.csv" */
export function botReportFilename(bot: Bot, generated: string): string {
  return `${bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report-${generated}.csv`;
}
