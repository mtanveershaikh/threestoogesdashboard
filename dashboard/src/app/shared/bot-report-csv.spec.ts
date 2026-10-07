import { describe, expect, it } from 'vitest';
import { BACKTEST_DATASET, PAPER_DATASET } from '../data/mock-scenarios';
import { botReportFilename, botReportRows } from './bot-report-csv';
import { toCsv } from './csv';

const GENERATED = '2026-10-07';

function rowsFor(dataset: typeof PAPER_DATASET, id: 'breakout' | 'pullback' | 'reversion') {
  return botReportRows(
    {
      bot: dataset.bots.find((b) => b.id === id)!,
      report: dataset.reports[id],
      setups: dataset.setups.filter((s) => s.botId === id),
      trades: dataset.trades.filter((t) => t.botId === id),
    },
    GENERATED,
  );
}
const row = (rows: ReturnType<typeof rowsFor>, label: string) => rows.find((r) => r[0] === label)!;

describe('bot report CSV', () => {
  it('names the file after the bot and the day', () => {
    expect(botReportFilename(PAPER_DATASET.bots[0], GENERATED)).toBe('wasif-report-2026-10-07.csv');
  });

  it('puts the header facts first', () => {
    const rows = rowsFor(PAPER_DATASET, 'breakout');
    expect(rows[0]).toEqual(['Report', 'Wasif', 'Generated', GENERATED]);
    expect(rows[1].slice(0, 2)).toEqual(['Strategy', 'Breakout momentum']);
    expect(rows[2].slice(0, 2)).toEqual(['Budget (USD)', 2000]);
  });

  it('gives paper and backtest side by side as plain numbers, losses negative', () => {
    const rows = rowsFor(PAPER_DATASET, 'breakout');
    expect(row(rows, 'Trades')).toEqual(['Trades', 20, 42]);
    expect(row(rows, 'Average per trade (R)')).toEqual(['Average per trade (R)', 0.21, 0.28]);
    expect(row(rows, 'Win rate (%)').slice(1, 2)).toEqual([30]);
    const reversion = rowsFor(PAPER_DATASET, 'reversion');
    expect(row(reversion, 'Return on budget (%)')[1]).toBe(-0.6);
  });

  it('lists every gate with its status in words', () => {
    const rows = rowsFor(PAPER_DATASET, 'breakout');
    const gates = rows.filter((r) => ['Met', 'Not yet', 'Not met'].includes(r[2] as string));
    expect(gates).toHaveLength(6);
    expect(gates[0]).toEqual(['Closed trades', 'at least 100', 'Not yet', '20 of 100', expect.any(String)]);
  });

  it('lists the trades with both analyst verdicts and the exit in words', () => {
    const rows = rowsFor(PAPER_DATASET, 'breakout');
    const drft = rows.find((r) => r[1] === 'DRFT')!;
    expect(drft).toEqual(['2026-10-06', 'DRFT', 'BUY', 71, 'BUY', 66, 'Target', 3, 60]);
    const brlk = rows.find((r) => r[1] === 'BRLK')!;
    expect(brlk.slice(-2)).toEqual([-1, -20]);
  });

  it('leaves the paper column blank for a backtest-only bot', () => {
    const rows = rowsFor(BACKTEST_DATASET, 'breakout');
    expect(row(rows, 'Trades')).toEqual(['Trades', '', 42]);
    expect(row(rows, 'Return on budget (%)')[1]).toBe('');
    expect(rows.some((r) => r[0] === 'Backtest period')).toBe(true);
  });

  it('turns into CSV text with quoting where it is needed', () => {
    const text = toCsv(rowsFor(PAPER_DATASET, 'breakout'));
    expect(text).toContain('"55-day high, volume above 1.5x"');
    expect(text).toContain('Closed trades,at least 100,Not yet,20 of 100,');
  });
});
