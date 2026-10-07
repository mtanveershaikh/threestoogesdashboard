import { Bot, Trade } from '../../data/models';
import { CsvCell } from '../../shared/csv';
import { exitLabel } from '../../shared/format';

/** The filtered trades as CSV rows. Numbers are plain: R as 0.21, dollars as 60, losses negative. */
export function tradesRows(trades: Trade[], bots: Bot[]): CsvCell[][] {
  const name = (id: string) => bots.find((b) => b.id === id)?.name ?? id;
  return [
    ['Date closed', 'Stock', 'Bot', 'Fundamental', 'Fundamental score', 'Technical', 'Technical score', 'Exit', 'Result (R)', 'Result (USD)'],
    ...trades.map((t): CsvCell[] => [
      t.closedAt, t.symbol, name(t.botId), t.fundamental?.verdict, t.fundamental?.score, t.technical?.verdict, t.technical?.score,
      exitLabel(t.exitReason), t.rMultiple, t.pnlUsd,
    ]),
  ];
}
