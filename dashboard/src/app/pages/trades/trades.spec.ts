import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MOCK_TRADES } from '../../data/mock-fixtures';
import { MockDataService } from '../../data/mock-data.service';
import { BotId, Trade } from '../../data/models';
import { FileDownload } from '../../shared/file-download';
import { Trades } from './trades';

/** Counts the history requests, and serves a longer history so paging has something to page through. */
class HistoryService extends MockDataService {
  requests: { limit: number; botId?: BotId }[] = [];
  readonly history: Trade[] = Array.from({ length: 250 }, (_, i) => ({ ...MOCK_TRADES[i % MOCK_TRADES.length], id: `h-${String(i).padStart(3, '0')}` }));
  override getTradeHistory(options: { limit: number; botId?: BotId }): Observable<Trade[]> {
    this.requests.push(options);
    const all = options.botId ? this.history.filter((t) => t.botId === options.botId) : this.history;
    return of(all.slice(0, options.limit));
  }
}

async function open(url: string, service: DataService = new MockDataService(), saved: { filename: string; text: string }[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([{ path: 'trades', component: Trades }]),
      { provide: DataService, useValue: service },
      { provide: FileDownload, useValue: { save: (filename: string, text: string) => saved.push({ filename, text }) } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, Trades);
  harness.detectChanges();
  await harness.fixture.whenStable();
  const el = () => harness.routeNativeElement as HTMLElement;
  const settle = async () => {
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const rows = () => Array.from(el().querySelectorAll('tbody tr'));
  const set = async (selector: string, value: string, event = 'change') => {
    const control = el().querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    control.value = value;
    control.dispatchEvent(new Event(event, { bubbles: true }));
    await settle();
  };
  const control = (label: string) =>
    Array.from(el().querySelectorAll('.filters label')).find((l) => l.querySelector('span')?.textContent === label)!.querySelector('select, input') as HTMLSelectElement | HTMLInputElement;
  const setByLabel = async (label: string, value: string, event = 'change') => {
    const c = control(label);
    c.value = value;
    c.dispatchEvent(new Event(event, { bubbles: true }));
    await settle();
  };
  const tile = (label: string) =>
    Array.from(el().querySelectorAll('app-stat-tile')).find((t) => t.textContent?.includes(label))!.textContent!.replace(/\s+/g, ' ');
  return { harness, el, rows, set, setByLabel, control, settle, tile };
}

describe('Trades page', () => {
  it('lists every closed trade, newest first, with signs and arrows on results', async () => {
    const { el, rows } = await open('/trades');
    expect(el().querySelector('h1')?.textContent).toBe('Trades');
    // 25 rows a page by default, of the 50 trades.
    expect(rows()).toHaveLength(25);
    expect(rows()[0].textContent).toContain('DRFT');
    expect(rows()[0].textContent).toContain('▲ +3.0R');
    expect(rows()[0].textContent).toContain('▲ +$60');
    expect(el().querySelector('app-pager .range')?.textContent?.trim()).toBe('Showing 1–25 of 50 trades');
    expect(el().querySelector('.foot p')?.textContent).toContain('50 of the latest 50 loaded trades match');
  });

  it('summarizes what is shown, matching the bot card for one bot', async () => {
    const { tile } = await open('/trades?bot=breakout');
    expect(tile('Trades shown')).toContain('20');
    expect(tile('Win rate')).toContain('30%');
    expect(tile('Win rate')).toContain('6 of 20 trades');
    expect(tile('Total result (R)')).toContain('+4.20R');
    expect(tile('Average per trade (R)')).toContain('+0.21R');
    expect(tile('Net result (USD)')).toContain('+$84');
  });

  it('reads the filters from the URL and shows them in the controls', async () => {
    const { el, rows } = await open('/trades?bot=pullback&result=win&exit=TARGET');
    expect((el().querySelector('select option[value="pullback"]') as HTMLOptionElement).selected).toBe(true);
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().every((r) => r.textContent?.includes('Waseem') && r.textContent?.includes('Target'))).toBe(true);
  });

  it('writes a changed filter to the URL, so a view can be shared', async () => {
    const { el, setByLabel, rows } = await open('/trades');
    await setByLabel('Stock', 'drft', 'input');
    expect(TestBed.inject(Router).url).toBe('/trades?q=drft');
    expect(rows()).toHaveLength(1);
    await setByLabel('Bot', 'reversion');
    expect(TestBed.inject(Router).url).toContain('bot=reversion');
    expect(el().textContent).toContain('No trades match');
  });

  it('filters by result', async () => {
    const { setByLabel, rows } = await open('/trades');
    await setByLabel('Result', 'loss');
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().every((r) => r.textContent?.includes('▼'))).toBe(true);
    await setByLabel('Result', 'win');
    expect(rows().every((r) => r.textContent?.includes('▲'))).toBe(true);
  });

  it('filters by a date range typed into the From and To boxes', async () => {
    const { setByLabel, rows } = await open('/trades');
    await setByLabel('From', '2026-10-05');
    await setByLabel('To', '2026-10-06');
    expect(TestBed.inject(Router).url).toBe('/trades?from=2026-10-05&to=2026-10-06');
    expect(rows()).toHaveLength(3);
  });

  it('keeps both ends of a date range', async () => {
    const { rows } = await open('/trades?from=2026-10-05&to=2026-10-06');
    expect(rows().map((r) => r.querySelector('td:nth-child(2)')?.textContent?.trim()).sort()).toEqual(['DRFT', 'MNRL', 'PLSM']);
  });

  it('says plainly when nothing matches and offers Clear filters', async () => {
    const { el, rows, settle } = await open('/trades?q=zzzz');
    expect(rows()).toHaveLength(0);
    expect(el().textContent).toContain('No trades match');
    expect(el().textContent).toContain('None of the loaded trades match these filters.');
    const clear = Array.from(el().querySelectorAll('.list button')).find((b) => b.textContent?.trim() === 'Clear filters') as HTMLButtonElement;
    clear.click();
    await settle();
    expect(rows()).toHaveLength(25);
  });

  it('clears every filter at once', async () => {
    const { el, settle, rows } = await open('/trades?q=zzzz&result=win');
    (el().querySelector('.filters .clear') as HTMLButtonElement).click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/trades');
    expect(rows()).toHaveLength(25);
  });

  it('loads the first 100 once and does not refresh on a timer', async () => {
    const service = new HistoryService();
    const { el } = await open('/trades', service);
    expect(service.requests).toEqual([{ limit: 100, botId: undefined }]);
    // 100 are loaded; the table shows the first page of them.
    expect(el().querySelectorAll('tbody tr')).toHaveLength(25);
    expect(el().querySelector('app-pager .range')?.textContent?.trim()).toBe('Showing 1–25 of 100 trades');
    expect(el().textContent).toContain('Older trades are not loaded yet.');
  });

  it('loads 100 older trades on request, and stops offering it when there are no more', async () => {
    const service = new HistoryService();
    const { el, settle } = await open('/trades', service);
    const more = () => Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Load 100 older trades');
    more()!.click();
    await settle();
    expect(service.requests.map((r) => r.limit)).toEqual([100, 200]);
    expect(el().querySelector('app-pager .range')?.textContent?.trim()).toBe('Showing 1–25 of 200 trades');
    more()!.click();
    await settle();
    expect(service.requests.map((r) => r.limit)).toEqual([100, 200, 300]);
    expect(el().querySelector('app-pager .range')?.textContent?.trim()).toBe('Showing 1–25 of 250 trades');
    expect(more()).toBeUndefined();
    expect(el().textContent).not.toContain('Older trades are not loaded yet.');
  });

  it('asks the database for one bot when a bot is chosen, and remembers each bot own paging', async () => {
    const service = new HistoryService();
    const { setByLabel } = await open('/trades', service);
    await setByLabel('Bot', 'breakout');
    expect(service.requests.at(-1)).toEqual({ limit: 100, botId: 'breakout' });
  });

  it('downloads the trades on screen as a CSV with plain numbers', async () => {
    const saved: { filename: string; text: string }[] = [];
    const { el } = await open('/trades?bot=breakout&result=loss', new MockDataService(), saved);
    (Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Download CSV') as HTMLButtonElement).click();
    expect(saved).toHaveLength(1);
    expect(saved[0].filename).toMatch(/^trades-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = saved[0].text.trim().split('\r\n');
    expect(lines[0]).toContain('Date closed,Stock,Bot,Fundamental');
    // All 12 matching losses, not only the ones on this page.
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(1).every((l) => l.includes('Wasif') && /,-\d/.test(l))).toBe(true);
  });

  describe('pagination', () => {
    const pager = (el: HTMLElement) => el.querySelector('app-pager .range')?.textContent?.trim();
    const click = (el: HTMLElement, text: string) =>
      (Array.from(el.querySelectorAll('app-pager button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement).click();

    it('moves to the next page, puts it in the URL, and shows the next trades', async () => {
      const { el, rows, settle } = await open('/trades');
      expect(rows()[0].textContent).toContain(MOCK_TRADES[0].symbol);
      expect(rows()[24].textContent).toContain(MOCK_TRADES[24].symbol);
      click(el(), 'Next');
      await settle();
      expect(TestBed.inject(Router).url).toBe('/trades?page=2');
      expect(pager(el())).toBe('Showing 26–50 of 50 trades');
      expect(rows()).toHaveLength(25);
      // Page 2 starts at the 26th trade and ends at the 50th.
      expect(rows()[0].textContent).toContain(MOCK_TRADES[25].symbol);
      expect(rows()[24].textContent).toContain(MOCK_TRADES[49].symbol);
    });

    it('shows every trade exactly once across the pages, newest first', async () => {
      const { el, rows, settle } = await open('/trades');
      const seen: string[] = [];
      for (let page = 1; page <= 2; page++) {
        seen.push(...rows().map((r) => `${r.querySelector('td:nth-child(1)')?.textContent?.trim()} ${r.querySelector('td:nth-child(2)')?.textContent?.trim()}`));
        if (page === 1) {
          click(el(), 'Next');
          await settle();
        }
      }
      expect(seen).toHaveLength(50);
      expect(new Set(seen).size).toBe(50);
    });

    it('opens straight to a page from a shared link, and names the page for screen readers', async () => {
      const { el } = await open('/trades?page=2');
      expect(pager(el())).toBe('Showing 26–50 of 50 trades');
      expect(el().querySelector('app-pager button[aria-current="page"]')?.getAttribute('aria-label')).toBe('Page 2 of 2');
      expect(el().querySelector('table caption')?.textContent).toBe('Closed trades, page 2 of 2');
    });

    it('disables Previous on the first page and Next on the last', async () => {
      const first = await open('/trades');
      const prev = Array.from(first.el().querySelectorAll('app-pager button')).find((b) => b.textContent?.trim() === 'Previous') as HTMLButtonElement;
      expect(prev.disabled).toBe(true);
      const last = await open('/trades?page=2');
      const next = Array.from(last.el().querySelectorAll('app-pager button')).find((b) => b.textContent?.trim() === 'Next') as HTMLButtonElement;
      expect(next.disabled).toBe(true);
    });

    it('changes the rows per page, and goes back to the first page', async () => {
      const { el, rows, settle } = await open('/trades?page=2');
      const select = el().querySelector('app-pager select') as HTMLSelectElement;
      select.value = '10';
      select.dispatchEvent(new Event('change'));
      await settle();
      expect(TestBed.inject(Router).url).toBe('/trades?size=10');
      expect(rows()).toHaveLength(10);
      expect(pager(el())).toBe('Showing 1–10 of 50 trades');
      expect(el().querySelectorAll('app-pager button.num')).toHaveLength(5);
    });

    it('goes back to the first page when a filter changes, so you never land on an empty page', async () => {
      const { el, rows, setByLabel } = await open('/trades?page=2');
      await setByLabel('Bot', 'reversion');
      expect(TestBed.inject(Router).url).toBe('/trades?bot=reversion');
      expect(rows()).toHaveLength(12);
      expect(pager(el())).toBe('Showing 1–12 of 12 trades');
    });

    it('shows the last page when the link asks for one past the end, and ignores nonsense', async () => {
      const past = await open('/trades?page=99');
      expect(pager(past.el())).toBe('Showing 26–50 of 50 trades');
      const nonsense = await open('/trades?page=abc&size=7');
      expect(pager(nonsense.el())).toBe('Showing 1–25 of 50 trades');
      expect(nonsense.rows()).toHaveLength(25);
    });

    it('keeps the summary and the download for every matching trade, not only this page', async () => {
      const saved: { filename: string; text: string }[] = [];
      const { el, tile } = await open('/trades?page=2&size=10', new MockDataService(), saved);
      expect(tile('Trades shown')).toContain('50');
      const csv = Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Download CSV') as HTMLButtonElement;
      expect(csv.getAttribute('aria-label')).toBe('Download all 50 matching trades as CSV');
      csv.click();
      expect(saved[0].text.trim().split('\r\n')).toHaveLength(51);
    });

    it('shows no pager when nothing matches', async () => {
      const { el } = await open('/trades?q=zzzz');
      expect(el().querySelector('app-pager')).toBeNull();
    });
  });

  it('shows a message and Try again when the trades cannot load', async () => {
    const failing = Object.assign(new MockDataService(), { getTradeHistory: () => throwError(() => ({ code: 'unavailable' })) });
    const { el } = await open('/trades', failing);
    expect(el().querySelectorAll('h1')).toHaveLength(1);
    expect(el().textContent).toContain('Trades could not load');
    expect(el().textContent).toContain('could not be reached');
    expect(Array.from(el().querySelectorAll('button')).some((b) => b.textContent?.includes('Try again'))).toBe(true);
  });

  it('disables the download when there is nothing to download', async () => {
    const { el } = await open('/trades?q=zzzz');
    const button = Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Download CSV') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
