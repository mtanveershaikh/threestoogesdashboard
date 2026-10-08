import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { DataService } from '../../data/data.service';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { createLoader } from '../../shared/load-state';
import { PAGE_SIZES, Pager } from '../../shared/pager';
import { paginate } from '../../shared/pagination';
import { AuditFilters, actionsOf, applyFilters, filtersFromParams, hasFilters, paramsFromFilters, serverQuery, timeLabel } from './audit-filters';

export const AUDIT_PAGE_SIZE = 50;
/** Events read per request; "Load older events" adds this many. */
export const AUDIT_STEP = 100;
const MAX_EVENTS = 500;

@Component({
  selector: 'app-audit',
  imports: [DataTable, EmptyState, Pager, RouterLink],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
})
export class Audit {
  private readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly filters = computed<AuditFilters>(() => filtersFromParams((k) => this.params().get(k)));
  protected readonly filtered = computed(() => hasFilters(this.filters()));
  private readonly pageParam = computed(() => {
    const n = Number(this.params().get('page'));
    return Number.isInteger(n) && n >= 1 ? n : 1;
  });
  protected readonly pageSize = computed(() => {
    const n = Number(this.params().get('size'));
    return PAGE_SIZES.includes(n) ? n : AUDIT_PAGE_SIZE;
  });

  private readonly limit = signal(AUDIT_STEP);
  private readonly request = computed(() => ({ ...serverQuery(this.filters()), limit: this.limit() }));
  private readonly request$ = toObservable(this.request);

  protected readonly loader = createLoader(() => this.request$.pipe(switchMap((r) => this.data.getAuditEvents(r))));
  private readonly load = this.loader.state;
  protected readonly status = computed(() => this.load().status);
  protected readonly errorMessage = computed(() => {
    const l = this.load();
    return l.status === 'error' ? l.message : '';
  });
  protected readonly loaded = computed(() => {
    const l = this.load();
    return l.status === 'ready' ? l.value : [];
  });
  protected readonly canLoadMore = computed(() => this.loaded().length >= this.limit() && this.limit() < MAX_EVENTS);
  protected readonly shown = computed(() => applyFilters(this.loaded(), this.filters()));
  protected readonly actions = computed(() => actionsOf(this.loaded()));

  protected readonly columns: Column[] = [
    { key: 'time', label: 'Time (UTC)', nowrap: true },
    { key: 'action', label: 'Action', nowrap: true },
    { key: 'actor', label: 'By', nowrap: true },
    { key: 'reason', label: 'Detail' },
    { key: 'plan', label: 'Plan', mono: true },
    { key: 'trade', label: 'Trade', mono: true },
  ];
  protected readonly pageInfo = computed(() => paginate(this.shown().length, this.pageParam(), this.pageSize()));
  protected readonly rows = computed(() => {
    const { from, to } = this.pageInfo();
    return this.shown().slice(Math.max(0, from - 1), to).map((e) => ({
      time: timeLabel(e.time), action: e.action, actor: e.actor, reason: e.reason ?? '–', plan: e.planId ?? '–', trade: e.tradeId ?? '–',
      planId: e.planId, tradeId: e.tradeId,
    }));
  });

  protected setFilter(key: keyof AuditFilters, value: string): void {
    const next = { ...this.filters(), [key]: value.trim() === '' ? undefined : value.trim() } as AuditFilters;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { ...paramsFromFilters(next), page: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected clearFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { ...paramsFromFilters({}), page: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected setPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page <= 1 ? null : page }, queryParamsHandling: 'merge' });
  }

  protected setPageSize(size: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { size: size === AUDIT_PAGE_SIZE ? null : size, page: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected loadMore(): void {
    this.limit.update((n) => Math.min(MAX_EVENTS, n + AUDIT_STEP));
  }

  protected refresh(): void {
    this.loader.retry();
  }
}
