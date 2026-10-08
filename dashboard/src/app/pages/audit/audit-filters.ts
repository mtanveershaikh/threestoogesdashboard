import { AuditEvent } from '../../data/models';

export interface AuditFilters {
  plan?: string;
  trade?: string;
  action?: string;
}

const KEYS = ['plan', 'trade', 'action'] as const;

export function filtersFromParams(get: (key: string) => string | null): AuditFilters {
  const out: AuditFilters = {};
  for (const k of KEYS) {
    const v = get(k)?.trim();
    if (v) out[k] = v;
  }
  return out;
}

export function paramsFromFilters(f: AuditFilters): Record<string, string | null> {
  return Object.fromEntries(KEYS.map((k) => [k, f[k] ?? null]));
}

export const hasFilters = (f: AuditFilters): boolean => KEYS.some((k) => !!f[k]);

/** What the database is asked for: one field only, because each needs its own index. The page narrows the rest. */
export function serverQuery(f: AuditFilters): { planId?: string; tradeId?: string; action?: string } {
  if (f.plan) return { planId: f.plan };
  if (f.trade) return { tradeId: f.trade };
  if (f.action) return { action: f.action };
  return {};
}

export function applyFilters(events: AuditEvent[], f: AuditFilters): AuditEvent[] {
  return events.filter((e) => (!f.plan || e.planId === f.plan) && (!f.trade || e.tradeId === f.trade) && (!f.action || e.action === f.action));
}

/** The actions seen so far, for the filter list. */
export function actionsOf(events: AuditEvent[]): string[] {
  return [...new Set(events.map((e) => e.action))].sort();
}

/** `2026-10-07T13:05:12Z` as `7 Oct 13:05`. */
export function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })} ${d.toISOString().slice(11, 16)}`;
}
