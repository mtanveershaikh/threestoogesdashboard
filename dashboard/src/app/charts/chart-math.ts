/** Pure geometry for the SVG charts, kept apart from the components so it can be tested directly. */

export interface Box {
  width: number;
  height: number;
}

/** x position of point `i` out of `n`, spread edge to edge. A single point sits at the left edge. */
export function xAt(i: number, n: number, width: number): number {
  return n <= 1 ? 0 : (i / (n - 1)) * width;
}

/** y position of `value` in a chart whose top is `yMax` and bottom is `yMin`. SVG y grows downward. */
export function yAt(value: number, yMin: number, yMax: number, height: number): number {
  return height - ((value - yMin) / (yMax - yMin)) * height;
}

const fmt = (n: number) => n.toFixed(1);

/** SVG path "M x y L x y ..." through the values, or '' when there are none. */
export function linePath(values: number[], yMin: number, yMax: number, box: Box): string {
  return values
    .map((v, i) => `${i ? 'L' : 'M'}${fmt(xAt(i, values.length, box.width))} ${fmt(yAt(v, yMin, yMax, box.height))}`)
    .join(' ');
}

/** Sparkline path: scaled to the series' own min and max, with a 4px margin top and bottom. */
export function sparklinePath(values: number[], box: Box, margin = 4): string {
  if (!values.length) return '';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const usable = box.height - margin * 2;
  return values
    .map((v, i) => {
      const y = box.height - margin - ((v - lo) / span) * usable;
      return `${i ? 'L' : 'M'}${fmt(xAt(i, values.length, box.width))} ${fmt(y)}`;
    })
    .join(' ');
}

/** Whole-number ticks from `min` to `max` inclusive, every `step`. */
export function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

/** Axis bounds in whole steps that always include 0 and a little room, for any set of values. */
export function axisRange(values: number[], step = 2): { min: number; max: number } {
  if (!values.length) return { min: -step, max: step * 3 };
  return {
    min: Math.min(0, Math.floor(Math.min(...values) / step) * step),
    max: Math.max(step, Math.ceil(Math.max(...values) / step) * step),
  };
}
