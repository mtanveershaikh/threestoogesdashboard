import { Component, computed, input } from '@angular/core';

/** A labeled meter for risk, caps and go-live gates. The status text carries the meaning, not the bar color. */
@Component({
  selector: 'app-progress-row',
  template: `
    @if (label()) {
      <div class="head">
        <span>{{ label() }}</span>
        <span class="status">{{ status() }}</span>
      </div>
    }
    <div
      class="track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="pct()"
      [attr.aria-label]="label() || status()"
    >
      <div class="fill" [style.width.%]="pct()" [style.background]="color()"></div>
    </div>
    @if (detail()) {
      <div class="detail">{{ detail() }}</div>
    }
  `,
  styles: `
    :host { display: block; }
    .head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }
    .status { color: var(--text-muted); }
    .track {
      height: 6px;
      border-radius: 3px;
      background: var(--border);
      overflow: hidden;
    }
    .fill { height: 100%; border-radius: 3px; }
    .detail {
      margin-top: 6px;
      color: var(--text-muted);
      font-size: 12px;
    }
  `,
})
export class ProgressRow {
  readonly label = input<string>();
  readonly status = input<string>();
  /** 0 to 100. Values outside the range are clamped. */
  readonly value = input.required<number>();
  readonly color = input('var(--info)');
  readonly detail = input<string>();

  protected readonly pct = computed(() => Math.min(100, Math.max(0, Math.round(this.value()))));
}
