import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StaleDataBanner } from './stale-data-banner';
import { MARKET_EARLY_CLOSES, MARKET_HOLIDAYS, ageText, isMarketHours, isStale } from './staleness';

// 2026-10-07 is a Wednesday; New York is on daylight time (UTC-4).
const noon = new Date('2026-10-07T16:00:00Z'); // 12:00 in New York
const night = new Date('2026-10-08T02:00:00Z'); // 22:00 in New York
const saturday = new Date('2026-10-10T16:00:00Z');

describe('market hours', () => {
  it('is open on a weekday between 9:30 and 16:00 New York time', () => {
    expect(isMarketHours(noon)).toBe(true);
    expect(isMarketHours(new Date('2026-10-07T13:29:00Z'))).toBe(false); // 9:29
    expect(isMarketHours(new Date('2026-10-07T13:30:00Z'))).toBe(true); // 9:30
    expect(isMarketHours(new Date('2026-10-07T20:00:00Z'))).toBe(false); // 16:00
  });

  it('is closed at night and on weekends', () => {
    expect(isMarketHours(night)).toBe(false);
    expect(isMarketHours(saturday)).toBe(false);
  });
});

describe('market holidays and early closes', () => {
  it('is closed all day on a holiday that falls on a weekday', () => {
    // Thanksgiving 2026, 12:00 in New York (UTC-5 in November).
    expect(isMarketHours(new Date('2026-11-26T17:00:00Z'))).toBe(false);
    // Independence Day is observed on Friday 3 July 2026, 12:00 in New York (UTC-4).
    expect(isMarketHours(new Date('2026-07-03T16:00:00Z'))).toBe(false);
    // The day before it is a normal trading day.
    expect(isMarketHours(new Date('2026-07-02T16:00:00Z'))).toBe(true);
  });

  it('closes at 13:00 on an early-close day', () => {
    expect(isMarketHours(new Date('2026-11-27T17:30:00Z'))).toBe(true); // 12:30
    expect(isMarketHours(new Date('2026-11-27T18:00:00Z'))).toBe(false); // 13:00
  });

  it('lists only weekdays, so no weekend date is needed in the table', () => {
    for (const d of [...MARKET_HOLIDAYS, ...MARKET_EARLY_CLOSES]) {
      const day = new Date(`${d}T12:00:00Z`).getUTCDay();
      expect([0, 6], d).not.toContain(day);
    }
  });

  it('does not warn about an old heartbeat on a holiday', () => {
    const holidayNoon = new Date('2026-11-26T17:00:00Z');
    expect(isStale('2026-11-25T21:00:00Z', holidayNoon)).toBe(false);
  });
});

describe('isStale', () => {
  it('flags a heartbeat older than 10 minutes during market hours', () => {
    expect(isStale('2026-10-07T15:49:00Z', noon)).toBe(true); // 11 minutes
    expect(isStale('2026-10-07T15:51:00Z', noon)).toBe(false); // 9 minutes
  });

  it('does not flag an old heartbeat when the market is closed', () => {
    expect(isStale('2026-10-07T15:00:00Z', night)).toBe(false);
    expect(isStale('2026-10-09T20:00:00Z', saturday)).toBe(false);
  });
});

describe('ageText', () => {
  it('writes minutes, hours and days', () => {
    expect(ageText('2026-10-07T15:59:00Z', noon)).toBe('1 minute ago');
    expect(ageText('2026-10-07T15:35:00Z', noon)).toBe('25 minutes ago');
    expect(ageText('2026-10-07T14:00:00Z', noon)).toBe('2 hours ago');
    expect(ageText('2026-10-03T16:00:00Z', noon)).toBe('4 days ago');
  });
});

describe('StaleDataBanner', () => {
  afterEach(() => vi.useRealTimers());

  function render(inputs: Record<string, unknown>): HTMLElement {
    vi.useFakeTimers({ now: noon, toFake: ['Date'] });
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(StaleDataBanner);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows an alert with the age when the data is stale', () => {
    const el = render({ lastHeartbeat: '2026-10-07T15:35:00Z' });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('last reported 25 minutes ago');
  });

  it('stays hidden when the heartbeat is fresh', () => {
    expect(render({ lastHeartbeat: '2026-10-07T15:58:00Z' }).querySelector('[role="alert"]')).toBeNull();
  });

  it('stays hidden for sample data', () => {
    expect(render({ lastHeartbeat: '2026-10-07T15:00:00Z', disabled: true }).querySelector('[role="alert"]')).toBeNull();
  });
});
