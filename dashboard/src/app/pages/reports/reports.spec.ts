import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MockDataService } from '../../data/mock-data.service';
import { MOCK_TRADES } from '../../data/mock-fixtures';
import { Trade } from '../../data/models';
import { FileDownload } from '../../shared/file-download';
import { MAX_TRADES } from '../trades/trade-limits';
import { Reports } from './reports';

async function open(url: string, service: DataService = new MockDataService(), saved: { filename: string; text: string }[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([{ path: 'reports', component: Reports }]),
      { provide: DataService, useValue: service },
      { provide: FileDownload, useValue: { save: (filename: string, text: string) => saved.push({ filename, text }) } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, Reports);
  harness.detectChanges();
  await harness.fixture.whenStable();
  const el = () => harness.routeNativeElement as HTMLElement;
  const settle = async () => {
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const rows = () => Array.from(el().querySelectorAll('tbody tr'));
  const button = (text: string) => Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
  return { el, rows, settle, button };
}

describe('Reports page', () => {
  it('starts weekly: nine weeks, newest first, with the latest week up top', async () => {
    const { el, rows } = await open('/reports');
    expect(el().querySelectorAll('h1')).toHaveLength(1);
    expect(el().querySelector('.latest-title')?.textContent).toBe('Latest week: Week of Oct 5');
    expect(rows()).toHaveLength(9);
    expect(rows()[0].textContent).toContain('Week of Oct 5');
    expect(rows()[8].textContent).toContain('Week of Aug 10');
    expect(el().querySelector('.range button[aria-pressed="true"]')?.textContent).toBe('Weekly');
  });

  it('names each bot as a column and signs every return, with an arrow', async () => {
    const { el, rows } = await open('/reports');
    const headers = Array.from(el().querySelectorAll('th')).map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Week', 'Return', 'Wasif', 'Waseem', 'Nawaz', 'Trades', 'Win rate', 'Avg R', 'Net USD', 'Best bot', 'Worst bot']);
    const returns = rows().map((r) => r.querySelector('td:nth-child(2)')?.textContent?.trim() ?? '');
    expect(returns.every((t) => /^(▲ \+|▼ -)\d+\.\d{2}%$|^0\.00%$/.test(t))).toBe(true);
  });

  it('switches to months and keeps the choice in the URL', async () => {
    const { el, rows, settle, button } = await open('/reports');
    button('Monthly').click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/reports?view=month');
    expect(rows().map((r) => r.querySelector('td')?.textContent?.trim())).toEqual(['October 2026', 'September 2026', 'August 2026']);
    expect(el().querySelector('.latest-title')?.textContent).toBe('Latest month: October 2026');
    button('Weekly').click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/reports');
    expect(rows()).toHaveLength(9);
  });

  it('opens straight to months from a shared link', async () => {
    const { rows } = await open('/reports?view=month');
    expect(rows()).toHaveLength(3);
  });

  it('counts every sample trade across the periods', async () => {
    const { rows } = await open('/reports');
    const trades = rows().reduce((s, r) => s + Number(r.querySelector('td:nth-child(6)')?.textContent), 0);
    expect(trades).toBe(MOCK_TRADES.length);
  });

  it('explains that there is nothing to report before paper trading starts', async () => {
    const { el } = await open('/reports', new MockDataService('backtest'));
    expect(el().textContent).toContain('No paper results yet');
    expect(el().querySelector('.range')).toBeNull();
    expect(el().querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('warns when the trade counts may be cut off by the load limit', async () => {
    class Many extends MockDataService {
      override getTradeHistory(): Observable<Trade[]> {
        return of(Array.from({ length: MAX_TRADES }, (_, i) => ({ ...MOCK_TRADES[i % 50], id: `x-${i}` })));
      }
    }
    const { el } = await open('/reports', new Many());
    expect(el().querySelector('.foot')?.textContent).toContain(`latest ${MAX_TRADES} trades`);
  });

  it('shows a message and Try again when the data cannot load', async () => {
    const failing = Object.assign(new MockDataService(), { getRollups: () => throwError(() => ({ code: 'permission-denied' })) });
    const { el, button } = await open('/reports', failing);
    expect(el().textContent).toContain('Reports could not load');
    expect(el().textContent).toContain('not allowed to read');
    expect(button('Try again')).toBeTruthy();
  });

  it('downloads the periods as a CSV with plain numbers', async () => {
    const saved: { filename: string; text: string }[] = [];
    const { button } = await open('/reports?view=month', new MockDataService(), saved);
    button('Download CSV').click();
    expect(saved[0].filename).toMatch(/^monthly-report-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = saved[0].text.trim().split('\r\n');
    expect(lines[0]).toContain('Month,First day,Last day,Return (% of capital),Wasif (% of its budget)');
    expect(lines).toHaveLength(4);
    expect(lines[1].startsWith('2026-10,')).toBe(true);
  });
});
