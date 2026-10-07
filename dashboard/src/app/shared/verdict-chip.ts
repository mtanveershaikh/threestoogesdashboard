import { Component, computed, input } from '@angular/core';
import { Verdict } from '../data/models';

const WORDS: Record<Verdict, string> = { BUY: 'Buy', HOLD: 'Hold', AVOID: 'Avoid' };

/** An analyst verdict with its score, or the SPLIT VERDICT flag when the analysts disagree. */
@Component({
  selector: 'app-verdict-chip',
  template: `{{ text() }}`,
  styles: `
    :host {
      display: inline-block;
      padding: 3px 8px;
      border-radius: var(--radius-control);
      background: var(--bg-raised);
      font-size: 12px;
    }
    :host(.split) {
      background: rgba(255, 138, 138, 0.16);
      color: #ff9a9a;
      font-weight: 600;
    }
  `,
  host: { '[class.split]': 'verdict() === "SPLIT"' },
})
export class VerdictChip {
  readonly verdict = input.required<Verdict | 'SPLIT'>();
  readonly score = input<number>();
  /** Prefix such as "Fundamental", giving "Fundamental: Buy 74". */
  readonly prefix = input<string>();

  protected readonly text = computed(() => {
    const v = this.verdict();
    if (v === 'SPLIT') return 'Split verdict';
    const core = this.score() === undefined ? WORDS[v] : `${WORDS[v]} ${this.score()}`;
    return this.prefix() ? `${this.prefix()}: ${core}` : core;
  });
}
