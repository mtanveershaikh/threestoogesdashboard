import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MockDataService } from '../../data/mock-data.service';
import { AuditEvent } from '../../data/models';
import { Audit } from './audit';
import { applyFilters, filtersFromParams, paramsFromFilters, serverQuery, timeLabel } from './audit-filters';

const ev = (id: string, o: Partial<AuditEvent> = {}): AuditEvent => ({ id, time: '2026-10-07T13:05:12Z', actor: 'system', action: 'scan', ...o });

class Counting extends MockDataService {
  requests: object[] = [];
  override getAuditEvents(o: { limit: number; planId?: string; tradeId?: string; action?: string }): Observable<AuditEvent[]> {
    this.requests.push(o);
    return super.getAuditEvents(o);
  }
}

async function open(url: string, service: DataService = new MockDataService()) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'audit', component: Audit }]), { provide: DataService, useValue: service }] });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, Audit);
  harness.detectChanges();
  await harness.fixture.whenStable();
  const el = harness.routeNativeElement as HTMLElement;
  return { el, rows: () => Array.from(el.querySelectorAll('tbody tr')) };
}

describe('audit filters', () => {
  it('round-trips through the address and ignores blanks', () => {
    const f = filtersFromParams((k) => ({ plan: ' plan-ornx ', action: '' } as Record<string, string>)[k] ?? null);
    expect(f).toEqual({ plan: 'plan-ornx' });
    expect(paramsFromFilters(f)).toEqual({ plan: 'plan-ornx', trade: null, action: null });
  });

  it('asks the database for one field only, plan first', () => {
    expect(serverQuery({ plan: 'p', trade: 't', action: 'a' })).toEqual({ planId: 'p' });
    expect(serverQuery({ trade: 't', action: 'a' })).toEqual({ tradeId: 't' });
    expect(serverQuery({})).toEqual({});
  });

  it('narrows the loaded events by every filter', () => {
    const events = [ev('1', { planId: 'p', action: 'scan' }), ev('2', { planId: 'p', action: 'fill' }), ev('3', { planId: 'q', action: 'fill' })];
    expect(applyFilters(events, { plan: 'p', action: 'fill' }).map((e) => e.id)).toEqual(['2']);
  });

  it('shows the time in UTC', () => {
    expect(timeLabel('2026-10-07T13:05:12Z')).toBe('7 Oct 13:05');
  });
});

describe('Audit page', () => {
  it('lists events newest first and links to a plan', async () => {
    const { el, rows } = await open('/audit');
    expect(el.querySelector('h1')?.textContent).toBe('Audit');
    expect(rows().length).toBeGreaterThan(5);
    expect(el.querySelector('tbody a')).not.toBeNull();
  });

  it('shows one plan story, oldest step last, when the address names a plan', async () => {
    const { rows } = await open('/audit?plan=plan-ornx');
    expect(rows().length).toBe(4);
    expect(rows()[0].textContent).toContain('proposal');
  });

  it('says so when nothing matches', async () => {
    const { el } = await open('/audit?plan=nope');
    expect(el.textContent).toContain('No events');
  });

  it('reads once, never on a timer, and asks for the plan only', async () => {
    const service = new Counting();
    await open('/audit?plan=plan-ornx', service);
    expect(service.requests).toEqual([{ planId: 'plan-ornx', limit: 100 }]);
  });
});
