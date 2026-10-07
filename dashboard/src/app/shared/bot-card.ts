import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sparkline } from '../charts/sparkline';
import { Bot } from '../data/models';
import { Avatar } from './avatar';
import { arrowOf, ratio, signedPct, signedR, toneOf, usd } from './format';

/** Summary of one bot with its trend and a link to its report. */
@Component({
  selector: 'app-bot-card',
  imports: [Avatar, Sparkline, RouterLink],
  template: `
    <div class="head">
      <app-avatar [name]="bot().name" [color]="bot().color" [url]="bot().avatarUrl" />
      <div class="names">
        <h3><a class="name" [routerLink]="['/bots', bot().id]">{{ bot().name }}</a></h3>
        <div class="muted">{{ bot().strategy }}</div>
      </div>
      <span class="status">{{ status() }}</span>
    </div>
    <div class="ret">
      <div>
        <div class="muted small">Return on {{ budget() }} budget</div>
        <div class="big" [class]="tone()">{{ arrow() }} {{ ret() }}</div>
      </div>
      <app-sparkline [values]="trend()" [color]="bot().color" [ariaLabel]="bot().name + ' return since start'" />
    </div>
    <dl class="stats">
      <div><dt>Win rate</dt><dd>{{ bot().winRatePct }}%</dd></div>
      <div><dt>Avg R</dt><dd>{{ avgR() }}</dd></div>
      <div><dt>Profit factor</dt><dd>{{ bot().profitFactor.toFixed(1) }}</dd></div>
      <div><dt>Trades</dt><dd>{{ bot().tradeCount }}</dd></div>
    </dl>
    <div class="foot">
      <span class="muted">Target {{ rr() }} · {{ bot().openCount }} open</span>
      <a [routerLink]="['/bots', bot().id]" [attr.aria-label]="'View report for ' + bot().name">View report →</a>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
    }
    .head { display: flex; align-items: center; gap: 14px; }
    .names { min-width: 0; }
    h3 { font-size: 18px; }
    .name {
      display: inline-flex;
      align-items: center;
      min-height: var(--touch);
      color: var(--text);
    }
    .name:hover { text-decoration: underline; }
    .muted { color: var(--text-muted); }
    .small { font-size: 12px; }
    .status {
      margin-left: auto;
      padding: 3px 9px;
      border-radius: var(--radius-pill);
      background: rgba(67, 217, 160, 0.14);
      color: var(--gain);
      font-size: 12px;
      font-weight: 600;
    }
    .ret { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
    .big { font-family: var(--font-mono); font-size: 30px; font-weight: 500; }
    .gain { color: var(--gain); }
    .loss { color: var(--loss); }
    .neutral { color: var(--text); }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    dt { color: var(--text-muted); font-size: 11px; }
    dd { margin: 0; font-family: var(--font-mono); }
    .foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .foot a {
      display: inline-flex;
      align-items: center;
      min-height: var(--touch);
      color: var(--text);
      font-weight: 500;
    }
  `,
})
export class BotCard {
  readonly bot = input.required<Bot>();
  /** Return since start per day, for the sparkline. */
  readonly trend = input<number[]>([]);

  protected readonly budget = computed(() => usd(this.bot().budget));
  protected readonly ret = computed(() => signedPct(this.bot().returnPct));
  protected readonly tone = computed(() => toneOf(this.bot().returnPct));
  protected readonly arrow = computed(() => arrowOf(this.bot().returnPct));
  protected readonly avgR = computed(() => signedR(this.bot().avgR, 2));
  protected readonly rr = computed(() => ratio(this.bot().targetRR));
  protected readonly status = computed(() => {
    const s = this.bot().status;
    return s.charAt(0) + s.slice(1).toLowerCase();
  });
}
