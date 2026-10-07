import { describe, expect, it } from 'vitest';
import { arrowOf, exitLabel, ratio, shortDate, signedPct, signedR, signedUsd, toneOf, usd } from './format';

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
});
