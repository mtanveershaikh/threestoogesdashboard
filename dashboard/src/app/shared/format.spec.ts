import { describe, expect, it } from 'vitest';
import { arrowOf, dateLabels, exitLabel, modeLabel, ratio, shortDate, spreadDateLabels, statusLabel, signedPct, signedR, signedUsd, toneOf, usd } from './format';

describe('format', () => {
  it('adds a sign to gains and losses', () => {
    expect(signedPct(4.2)).toBe('+4.2%');
    expect(signedPct(-0.6)).toBe('-0.6%');
    expect(signedR(0.21, 2)).toBe('+0.21R');
    expect(signedR(-1, 1)).toBe('-1.0R');
    expect(signedUsd(14)).toBe('+$14');
    expect(signedUsd(-1234)).toBe('-$1,234');
  });

  it('leaves zero unsigned', () => {
    expect(signedR(0)).toBe('0.0R');
    expect(signedUsd(0)).toBe('$0');
    expect(arrowOf(0)).toBe('');
    expect(toneOf(0)).toBe('neutral');
  });

  it('picks tone and arrow from the sign', () => {
    expect(toneOf(1)).toBe('gain');
    expect(toneOf(-1)).toBe('loss');
    expect(arrowOf(1)).toBe('▲');
    expect(arrowOf(-1)).toBe('▼');
  });

  it('formats plain dollars', () => {
    expect(usd(5127.25)).toBe('$5,127');
  });

  it('writes short dates without a time zone shift', () => {
    expect(shortDate('2026-10-06')).toBe('Oct 6');
    expect(shortDate('2026-01-01')).toBe('Jan 1');
  });

  it('names exits in words and ratios as 1:n', () => {
    expect(exitLabel('TIME_STOP')).toBe('Time stop');
    expect(ratio(3)).toBe('1:3');
  });

  it('names modes and statuses in words', () => {
    expect(modeLabel('backtest')).toBe('Backtest only');
    expect(modeLabel('paper')).toBe('Paper trading');
    expect(statusLabel('BACKTEST_ONLY')).toBe('Backtest only');
    expect(statusLabel('ACTIVE')).toBe('Active');
  });

  it('spaces date labels evenly', () => {
    expect(dateLabels('2026-08-13', '2026-10-07', 3)).toEqual(['Aug 13', 'Sep 9', 'Oct 7']);
    expect(dateLabels('bad', '2026-10-07')).toEqual([]);
    const dates = Array.from({ length: 40 }, (_, i) => new Date(Date.UTC(2026, 7, 13 + i)).toISOString().slice(0, 10));
    const picked = spreadDateLabels(dates, 4);
    expect(picked).toHaveLength(4);
    expect(picked[0]).toBe('Aug 13');
    expect(spreadDateLabels(['2026-10-06', '2026-10-07'], 8)).toEqual(['Oct 6', 'Oct 7']);
    expect(spreadDateLabels([])).toEqual([]);
  });
});
