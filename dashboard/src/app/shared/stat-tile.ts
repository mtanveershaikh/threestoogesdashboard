import { Component, computed, input } from '@angular/core';
import { Tone } from './format';

const ARROWS: Record<Tone, string> = { gain: '▲ ', loss: '▼ ', neutral: '' };

/** A KPI tile. Pass `delta` already signed, for example "+2.5% since start". */
@Component({
  selector: 'app-stat-tile',
  template: `
    <div class="label">{{ label() }}</div>
    <div class="value" [class]="valueClass()">{{ value() }}</div>
    @if (delta()) {
      <div class="delta" [class]="tone()">{{ arrow() }}{{ delta() }}</div>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 18px;
    }
    .label {
      color: var(--text-muted);
      font-size: 12px;
    }
    .value {
      font-family: var(--font-mono);
      font-size: 28px;
      font-weight: 500;
      margin-top: 6px;
    }
    .value.text {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 600;
      margin-top: 8px;
    }
    .delta {
      font-size: 13px;
      margin-top: 4px;
    }
    .gain { color: var(--gain); }
    .loss { color: var(--loss); }
    .neutral { color: var(--text-muted); }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly delta = input<string>();
  readonly tone = input<Tone>('neutral');
  /** Show the value as words (for example "Armed, normal") instead of a figure. */
  readonly textValue = input(false);
  /** Turn off the ▲/▼ glyph when the delta line is not a gain or loss. */
  readonly showArrow = input(true);

  protected readonly arrow = computed(() => (this.showArrow() ? ARROWS[this.tone()] : ''));
  protected readonly valueClass = computed(() => (this.textValue() ? `text ${this.tone()}` : ''));
}
