import { describe, expect, it } from 'vitest';
import { HistogramBin } from '../data/models';
import { MOCK_REPORTS } from '../data/mock-fixtures';
import { histogramCaption } from './histogram-caption';

const bins = (counts: number[]): HistogramBin[] =>
  ['-1', '-0.5', '0', '+0.5', '+1', '+2', '+3'].map((label, i) => ({ label, count: counts[i] }));

describe('histogramCaption', () => {
  it('says nothing when there are no trades', () => {
    expect(histogramCaption(bins([0, 0, 0, 0, 0, 0, 0]), 3)).toBe('');
    expect(histogramCaption([], 3)).toBe('');
  });

  it('matches the mockup for the breakout bot: most lose, a few reach 3R and pay for the rest', () => {
    expect(histogramCaption(MOCK_REPORTS.breakout.rHistogram, 3)).toBe('Most trades lose 1R. A few reach 3R and pay for the rest.');
  });

  it('does not claim the wins pay for the losses when they do not', () => {
    // 12 stops and 2 winners: net R is negative.
    expect(histogramCaption(bins([12, 0, 0, 0, 0, 0, 2]), 3)).toBe('Most trades lose 1R. A few reach 3R, but not enough to pay for the rest.');
  });

  it('says so when no trade has reached the target yet', () => {
    expect(histogramCaption(bins([9, 1, 0, 0, 0, 0, 0]), 3)).toBe('Most trades lose 1R, and none has reached the 3R target yet.');
  });

  it('says some, not a few, when a quarter or more reach the target', () => {
    expect(histogramCaption(bins([10, 0, 0, 0, 0, 0, 6]), 3)).toBe('Most trades lose 1R. Some reach 3R and pay for the rest.');
  });

  it('uses the bot target: 2R for a 1:2 bot', () => {
    expect(histogramCaption(bins([10, 0, 0, 0, 0, 6, 0]), 2)).toBe('Most trades lose 1R. Some reach 2R and pay for the rest.');
  });

  it('treats a break-even mix as not paying for the rest', () => {
    // 10 stops (-10R) and 5 winners at +2R (+10R) net to zero.
    expect(histogramCaption(bins([10, 0, 0, 0, 0, 5, 0]), 2)).toBe('Most trades lose 1R. Some reach 2R, but not enough to pay for the rest.');
  });

  it('notes when most trades reach the target', () => {
    expect(histogramCaption(bins([2, 0, 0, 0, 0, 0, 8]), 3)).toBe('Most trades reach the 3R target.');
  });

  it('otherwise names the most common result', () => {
    expect(histogramCaption(MOCK_REPORTS.pullback.rHistogram, 3)).toBe('The most common result is -1R: 8 of 18 trades.');
    expect(histogramCaption(MOCK_REPORTS.reversion.rHistogram, 2)).toBe('The most common result is -1R: 5 of 12 trades.');
  });
});
