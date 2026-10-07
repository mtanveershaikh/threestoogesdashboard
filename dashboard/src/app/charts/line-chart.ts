import { Component, computed, input } from '@angular/core';
import { EmptyState } from '../shared/empty-state';
import { linePath, ticks, yAt } from './chart-math';

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
  /** Stroke width; the total line is drawn thicker. */
  width?: number;
  /** Dashed line, for example the backtest expectation. */
  dashed?: boolean;
}

const W = 800;
const H = 240;

/** Multi-series line chart with a dashed zero baseline, axis labels and a legend. */
@Component({
  selector: 'app-line-chart',
  imports: [EmptyState],
  template: `
    @if (hasData()) {
      @if (legend()) {
        <ul class="legend">
          @for (s of series(); track s.name) {
            <li>
              <span class="key" [class.dashed]="s.dashed" [style.--c]="s.color"></span>{{ s.name }}
            </li>
          }
        </ul>
      }
      <div class="plot">
        <div class="yaxis" [style.height.px]="height">
          @for (t of yTicks(); track t.value) {
            <span [style.top.%]="t.pct">{{ t.label }}</span>
          }
        </div>
        <div class="body">
          <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" width="100%" [attr.height]="height" role="img" [attr.aria-label]="ariaLabel()">
            @for (t of yTicks(); track t.value) {
              <line x1="0" [attr.y1]="t.y" [attr.x2]="width" [attr.y2]="t.y" [attr.stroke]="t.value === 0 ? 'var(--border-dashed)' : 'var(--border)'" [attr.stroke-dasharray]="t.value === 0 ? '4 4' : null" />
            }
            @for (p of paths(); track p.name) {
              <path [attr.d]="p.d" fill="none" [attr.stroke]="p.color" [attr.stroke-width]="p.width" [attr.stroke-dasharray]="p.dashed ? '6 5' : null" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
            }
          </svg>
          <div class="xaxis">
            @for (l of xLabels(); track $index) {
              <span>{{ l }}</span>
            }
          </div>
        </div>
      </div>
    } @else {
      <app-empty-state [title]="emptyTitle()" [message]="emptyMessage()" />
    }
  `,
  styles: `
    :host { display: block; }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin: 0 0 12px;
      padding: 0;
      list-style: none;
      font-size: 13px;
    }
    .legend li { display: flex; align-items: center; gap: 6px; }
    .key {
      width: 14px;
      height: 3px;
      border-radius: 2px;
      background: var(--c);
    }
    .key.dashed {
      background: repeating-linear-gradient(90deg, var(--c) 0 5px, transparent 5px 8px);
    }
    .plot { display: flex; gap: 10px; }
    .yaxis {
      position: relative;
      flex: none;
      width: 34px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 12px;
      text-align: right;
    }
    .yaxis span {
      position: absolute;
      right: 0;
      transform: translateY(-50%);
    }
    .body { flex: 1; min-width: 0; }
    svg { display: block; }
    .xaxis {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 12px;
    }
    .xaxis span { white-space: nowrap; }
    /* On a phone, show every other label so none wrap. */
    @media (max-width: 640px) {
      .xaxis span:nth-child(even) { display: none; }
    }
  `,
})
export class LineChart {
  readonly series = input.required<LineSeries[]>();
  readonly xLabels = input<string[]>([]);
  readonly yMin = input(-2);
  readonly yMax = input(6);
  readonly yStep = input(2);
  /** Describes the chart for screen readers. Required: the chart is an image to them. */
  readonly ariaLabel = input.required<string>();
  readonly legend = input(true);
  readonly emptyTitle = input('No results yet');
  readonly emptyMessage = input('The chart fills in after the first day of trading.');

  protected readonly width = W;
  protected readonly height = H;

  protected readonly hasData = computed(() => this.series().some((s) => s.values.length > 0));

  protected readonly yTicks = computed(() =>
    ticks(this.yMin(), this.yMax(), this.yStep()).map((value) => {
      const y = yAt(value, this.yMin(), this.yMax(), H);
      return {
        value,
        y: Math.min(H - 1, y),
        pct: (y / H) * 100,
        label: `${value > 0 ? '+' : ''}${value}%`,
      };
    }),
  );

  /** Thin lines first, so the thick total line is drawn on top. */
  protected readonly paths = computed(() =>
    this.series().map((s) => ({
      name: s.name,
      color: s.color,
      dashed: !!s.dashed,
      width: s.width ?? 1.75,
      d: linePath(s.values, this.yMin(), this.yMax(), { width: W, height: H }),
    })),
  );
}
