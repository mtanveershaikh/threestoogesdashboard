import { Component, computed, input } from '@angular/core';
import { HistogramBin } from '../data/models';
import { EmptyState } from '../shared/empty-state';

const HEIGHT = 150;

/** Count of trades per R result. Each bar shows its count as a number, and bins are labeled with their sign. */
@Component({
  selector: 'app-histogram-bars',
  imports: [EmptyState],
  template: `
    @if (total() > 0) {
      <div class="bars" role="img" [attr.aria-label]="summary()">
        @for (b of bars(); track b.label) {
          <div class="col">
            <span class="count">{{ b.count }}</span>
            <div class="bar" [style.height.px]="b.px" [class]="b.tone"></div>
          </div>
        }
      </div>
      <div class="labels" aria-hidden="true">
        @for (b of bars(); track b.label) {
          <span>{{ b.label }}</span>
        }
      </div>
    } @else {
      <app-empty-state title="No closed trades yet" message="The chart fills in after the first trade closes." />
    }
  `,
  styles: `
    :host { display: block; }
    .bars {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 190px;
      border-bottom: 1px solid var(--border-dashed);
    }
    .col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }
    .count { font-family: var(--font-mono); font-size: 12px; }
    .bar { width: 100%; border-radius: 4px 4px 0 0; }
    .bar.gain { background: var(--gain); }
    .bar.loss { background: var(--loss); }
    .bar.neutral { background: var(--neutral); }
    .labels {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 12px;
    }
    .labels span { flex: 1; text-align: center; }
  `,
})
export class HistogramBars {
  readonly bins = input.required<HistogramBin[]>();

  protected readonly total = computed(() => this.bins().reduce((s, b) => s + b.count, 0));

  protected readonly bars = computed(() => {
    const max = Math.max(1, ...this.bins().map((b) => b.count));
    return this.bins().map((b) => ({
      ...b,
      px: (b.count / max) * HEIGHT,
      tone: b.label.startsWith('-') ? 'loss' : b.label === '0' ? 'neutral' : 'gain',
    }));
  });

  protected readonly summary = computed(
    () => 'Trades per R result: ' + this.bins().map((b) => `${b.count} at ${b.label}R`).join(', '),
  );
}
