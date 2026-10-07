import { HistogramBin } from '../data/models';

/** The bin's value in R, from its label ("-0.5" is -0.5, "+3" is 3). */
const binValue = (label: string) => Number(label);

/**
 * One sentence about the shape of the R histogram, written from the numbers so it is never wrong for a bot
 * that is losing. Returns '' when there are no trades.
 */
export function histogramCaption(bins: HistogramBin[], targetRR: number): string {
  const total = bins.reduce((s, b) => s + b.count, 0);
  if (total === 0) return '';

  const countAt = (label: string) => bins.find((b) => b.label === label)?.count ?? 0;
  const stops = countAt('-1');
  const atTarget = countAt(`+${targetRR}`);
  const target = `${targetRR}R`;
  const netR = bins.reduce((s, b) => s + b.count * binValue(b.label), 0);

  if (stops / total >= 0.5) {
    if (atTarget === 0) return `Most trades lose 1R, and none has reached the ${target} target yet.`;
    const how = atTarget / total < 0.25 ? 'A few' : 'Some';
    return netR > 0
      ? `Most trades lose 1R. ${how} reach ${target} and pay for the rest.`
      : `Most trades lose 1R. ${how} reach ${target}, but not enough to pay for the rest.`;
  }
  if (atTarget / total >= 0.5) return `Most trades reach the ${target} target.`;

  const modal = bins.reduce((best, b) => (b.count > best.count ? b : best), bins[0]);
  return `The most common result is ${modal.label}R: ${modal.count} of ${total} trades.`;
}
