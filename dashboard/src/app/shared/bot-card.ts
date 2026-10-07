import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sparkline } from '../charts/sparkline';
import { BacktestSummary, Bot } from '../data/models';
import { Avatar } from './avatar';
import { arrowOf, ratio, signedPct, signedR, statusLabel, toneOf, usd } from './format';

/** Summary of one bot with its trend and a link to its report. A backtest-only bot shows its backtest instead. */
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
      <span class="status" [class.backtest]="backtestOnly()">{{ status() }}</span>
    </div>
    <div class="ret">
      <div>
        <div class="muted small">{{ view().caption }}</div>
        <div class="big" [class]="view().tone">{{ view().arrow }} {{ view().ret }}</div>
      </div>
      <app-sparkline [values]="trend()" [color]="bot().color" [ariaLabel]="bot().name + (backtestOnly() ? ' backtest return' : ' return since start')" />
    </div>
    <dl class="stats">
      <div><dt>Win rate</dt><dd>{{ view().win }}</dd></div>
      <div><dt>Avg R</dt><dd>{{ view().avgR }}</dd></div>
      <div><dt>Profit factor</dt><dd>{{ view().pf }}</dd></div>
      <div><dt>Trades</dt><dd>{{ view().trades }}</dd></div>
    </dl>
    <div class="foot">
      <span class="muted">{{ view().foot }}</span>
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
      white-space: nowrap;
    }
    .status.backtest {
      background: rgba(91, 184, 255, 0.14);
      color: #8cccff;
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
  /** Return since start per day, for the sparkline. For a backtest-only bot, the backtest curve. */
  readonly trend = input<number[]>([]);
  /** The bot's backtest. Used instead of paper results while the bot is backtest-only. */
  readonly backtest = input<BacktestSummary>();

  protected readonly backtestOnly = computed(() => this.bot().status === 'BACKTEST_ONLY');
  protected readonly status = computed(() => statusLabel(this.bot().status));

  /** Paper numbers, or backtest numbers when the bot has not started paper trading. */
  protected readonly view = computed(() => {
    const b = this.bot();
    const bt = this.backtest();
    const budget = usd(b.budget);
    const target = ratio(b.targetRR);
    if (this.backtestOnly() && bt) {
      return {
        caption: `Backtest return on ${budget} budget`,
        ret: signedPct(bt.returnPct),
        tone: toneOf(bt.returnPct),
        arrow: arrowOf(bt.returnPct),
        win: `${bt.winRatePct}%`,
        avgR: signedR(bt.avgR, 2),
        pf: bt.profitFactor.toFixed(1),
        trades: `${bt.trades}`,
        foot: `Target ${target} · no paper trades yet`,
      };
    }
    return {
      caption: `Return on ${budget} budget`,
      ret: signedPct(b.returnPct),
      tone: toneOf(b.returnPct),
      arrow: arrowOf(b.returnPct),
      win: `${b.winRatePct}%`,
      avgR: signedR(b.avgR, 2),
      pf: b.profitFactor.toFixed(1),
      trades: `${b.tradeCount}`,
      foot: `Target ${target} · ${b.openCount} open`,
    };
  });
}
