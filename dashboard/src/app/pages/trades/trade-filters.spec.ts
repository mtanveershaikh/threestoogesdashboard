import { describe, expect, it } from 'vitest';
import { MOCK_TRADES } from '../../data/mock-fixtures';
import { applyFilters, filtersFromParams, hasFilters, paramsFromFilters, summarize } from './trade-filters';

const params = (o: Record<string, string>) => (key: string) => o[key] ?? null;

describe('filtersFromParams', () => {
  it('reads valid values', () => {
    expect(filtersFromParams(params({ bot: 'pullback', result: 'win', exit: 'TARGET', from: '2026-09-01', to: '2026-09-30', q: ' dr ' }))).toEqual({
      bot: 'pullback', result: 'win', exit: 'TARGET', from: '2026-09-01', to: '2026-09-30', q: 'dr',
    });
  });

  it('drops anything invalid instead of breaking the page', () => {
    const f = filtersFromParams(params({ bot: 'nobody', result: 'maybe', exit: 'PANIC', from: 'yesterday', to: '2026-13-99x', q: '   ' }));
    expect(f).toEqual({ bot: undefined, result: undefined, exit: undefined, from: undefined, to: undefined, q: undefined });
    expect(hasFilters(f)).toBe(false);
  });

  it('round-trips through the URL, with null for what is not set', () => {
    const f = { bot: 'breakout' as const, q: 'AX' };
    expect(paramsFromFilters(f)).toEqual({ bot: 'breakout', result: null, exit: null, from: null, to: null, q: 'AX' });
    expect(hasFilters(f)).toBe(true);
  });
});

describe('applyFilters', () => {
  it('returns everything with no filters', () => {
    expect(applyFilters(MOCK_TRADES, {})).toHaveLength(50);
  });

  it('splits wins, losses and break-evens, which together are every trade', () => {
    const win = applyFilters(MOCK_TRADES, { result: 'win' });
    const loss = applyFilters(MOCK_TRADES, { result: 'loss' });
    const even = applyFilters(MOCK_TRADES, { result: 'even' });
    expect(win.every((t) => t.rMultiple > 0)).toBe(true);
    expect(loss.every((t) => t.rMultiple < 0)).toBe(true);
    expect(even.every((t) => t.rMultiple === 0)).toBe(true);
    expect(win.length + loss.length + even.length).toBe(50);
  });

  it('filters by bot, exit and stock search (any case, part of the ticker)', () => {
    expect(applyFilters(MOCK_TRADES, { bot: 'pullback' })).toHaveLength(18);
    expect(applyFilters(MOCK_TRADES, { exit: 'STOP' }).every((t) => t.exitReason === 'STOP')).toBe(true);
    expect(applyFilters(MOCK_TRADES, { q: 'drft' }).map((t) => t.symbol)).toEqual(['DRFT']);
    expect(applyFilters(MOCK_TRADES, { q: 'RF' }).map((t) => t.symbol)).toContain('DRFT');
  });

  it('includes both ends of a date range', () => {
    const inRange = applyFilters(MOCK_TRADES, { from: '2026-10-05', to: '2026-10-06' });
    expect(inRange.map((t) => t.closedAt).every((d) => d === '2026-10-05' || d === '2026-10-06')).toBe(true);
    expect(inRange.map((t) => t.symbol).sort()).toEqual(['DRFT', 'MNRL', 'PLSM']);
  });

  it('combines filters', () => {
    const both = applyFilters(MOCK_TRADES, { bot: 'breakout', result: 'loss', exit: 'STOP' });
    expect(both.every((t) => t.botId === 'breakout' && t.rMultiple < 0 && t.exitReason === 'STOP')).toBe(true);
    expect(both.length).toBeGreaterThan(0);
  });
});

describe('summarize', () => {
  it('matches the bot cards for a whole bot', () => {
    const s = summarize(MOCK_TRADES.filter((t) => t.botId === 'breakout'));
    expect(s).toMatchObject({ count: 20, winRatePct: 30, avgR: 0.21, totalR: 4.2, netUsd: 84 });
  });

  it('handles an empty list without dividing by zero', () => {
    expect(summarize([])).toEqual({ count: 0, wins: 0, winRatePct: 0, totalR: 0, avgR: 0, netUsd: 0 });
  });
});
