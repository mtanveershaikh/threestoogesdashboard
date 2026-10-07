import { Component, computed, input } from '@angular/core';
import { Bot, Plan } from '../data/models';
import { ratio } from './format';
import { VerdictChip } from './verdict-chip';

/** A plan waiting for approval. Read-only: approval happens in Telegram. */
@Component({
  selector: 'app-plan-card',
  imports: [VerdictChip],
  template: `
    <div class="top">
      <div class="who">
        <span class="symbol">{{ plan().symbol }}</span>
        <span class="dot" [style.background]="bot()?.color"></span>
        <span class="muted">{{ bot()?.strategy }}</span>
      </div>
      <span class="muted small">Reward to risk {{ rr() }}</span>
    </div>
    <dl class="levels">
      <div><dt>Entry</dt><dd>{{ plan().entry.toFixed(2) }}</dd></div>
      <div><dt>Stop</dt><dd>{{ plan().stop.toFixed(2) }}</dd></div>
      <div><dt>Target</dt><dd>{{ plan().target.toFixed(2) }}</dd></div>
    </dl>
    <div class="verdicts">
      <app-verdict-chip [verdict]="plan().fundamental.verdict" [score]="plan().fundamental.score" prefix="Fundamental" />
      <app-verdict-chip [verdict]="plan().technical.verdict" [score]="plan().technical.score" prefix="Technical" />
      @if (plan().splitVerdict) {
        <app-verdict-chip verdict="SPLIT" />
      }
    </div>
    <div class="muted small">{{ plan().note }} · {{ plan().shares }} shares, \${{ plan().positionUsd }}</div>
    <a class="approve" [href]="telegramUrl()" target="_blank" rel="noopener">Approve in Telegram</a>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px;
      background: var(--bg-inset);
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .who { display: flex; align-items: center; gap: 8px; }
    .symbol { font-family: var(--font-mono); font-weight: 500; font-size: 16px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .muted { color: var(--text-muted); }
    .small { font-size: 12px; }
    .levels {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
      font-family: var(--font-mono);
      font-size: 13px;
    }
    dt { color: var(--text-muted); font-size: 11px; font-family: var(--font-body); }
    dd { margin: 0; }
    .verdicts { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .approve {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: var(--touch);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      color: var(--text);
      font-weight: 500;
    }
    .approve:hover { background: var(--bg-raised); }
  `,
})
export class PlanCard {
  readonly plan = input.required<Plan>();
  readonly bot = input<Bot>();
  readonly telegramUrl = input.required<string>();

  protected readonly rr = computed(() => ratio(this.plan().rewardToRisk));
}
