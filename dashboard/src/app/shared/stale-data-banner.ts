import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { ageText, isStale } from './staleness';

const TICK_MS = 30_000;

/** Warns when the bots' heartbeat is old during market hours. Hidden otherwise. */
@Component({
  selector: 'app-stale-data-banner',
  template: `
    @if (stale()) {
      <div class="banner" role="alert">
        <strong>The data may be out of date.</strong>
        The bots last reported {{ age() }}. Check that they are running.
      </div>
    }
  `,
  styles: `
    .banner {
      padding: 12px 16px;
      border-radius: 10px;
      background: rgba(242, 184, 75, 0.1);
      border: 1px solid rgba(242, 184, 75, 0.35);
      font-size: 13px;
    }
    strong { color: var(--warn); margin-right: 4px; }
  `,
})
export class StaleDataBanner {
  readonly lastHeartbeat = input.required<string>();
  /** Sample data is never live, so it is never stale. */
  readonly disabled = input(false);

  private readonly now = signal(new Date());
  protected readonly stale = computed(() => !this.disabled() && isStale(this.lastHeartbeat(), this.now()));
  protected readonly age = computed(() => ageText(this.lastHeartbeat(), this.now()));

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
