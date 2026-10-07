import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { DataService } from '../../data/data.service';
import { BotId, StrategyConfig } from '../../data/models';
import { EmptyState } from '../../shared/empty-state';
import { modeLabel, usd } from '../../shared/format';
import { createLoader } from '../../shared/load-state';
import {
  budgetNotice, gateLines, humanizeKey, limitLines, paramValue, rewardToRiskLabel, strategyStatusLabel, universeLabel, updatedLabel,
} from './settings-view';

/** Read-only view of `system/config`. Nothing on this page can be edited. */
@Component({
  selector: 'app-settings',
  imports: [EmptyState, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly data = inject(DataService);

  protected readonly loader = createLoader(() => combineLatest({ config: this.data.getConfig(), bots: this.data.getBots() }));
  private readonly load = this.loader.state;
  protected readonly status = computed(() => this.load().status);
  protected readonly errorMessage = computed(() => {
    const l = this.load();
    return l.status === 'error' ? l.message : '';
  });
  private readonly ready = computed(() => {
    const l = this.load();
    return l.status === 'ready' ? l.value : undefined;
  });

  protected readonly config = computed(() => this.ready()?.config);
  protected readonly meta = computed(() => {
    const c = this.config();
    if (!c) return '';
    return [
      c.configVersion && `Config version ${c.configVersion}`,
      c.updatedAt && `updated ${updatedLabel(c.updatedAt)}`,
      c.mode && modeLabel(c.mode),
    ]
      .filter(Boolean)
      .join(' · ');
  });
  protected readonly limits = computed(() => (this.config() ? limitLines(this.config()!) : []));
  protected readonly gates = computed(() => (this.config() ? gateLines(this.config()!) : []));
  protected readonly notice = computed(() => (this.config() ? budgetNotice(this.config()!) : undefined));

  protected readonly strategies = computed(() => {
    const bots = new Map((this.ready()?.bots ?? []).map((b) => [b.id, b]));
    return (this.config()?.strategies ?? []).map((s: StrategyConfig) => ({
      id: s.id,
      botId: s.botId as BotId,
      name: bots.get(s.botId)?.name ?? s.bot,
      color: bots.get(s.botId)?.color,
      status: strategyStatusLabel(s.status),
      backtestOnly: s.status === 'backtest_only',
      facts: [
        { label: 'Universe', value: universeLabel(s.universe) },
        { label: 'Budget', value: usd(s.budgetUsd) },
        { label: 'Reward to risk', value: rewardToRiskLabel(s.rewardToRisk) },
        { label: 'Time stop', value: `${s.timeStopDays} days` },
      ],
      params: Object.entries(s.params ?? {}).map(([key, value]) => ({ label: humanizeKey(key), value: paramValue(key, value) })),
    }));
  });

  protected refresh(): void {
    this.loader.retry();
  }
}
