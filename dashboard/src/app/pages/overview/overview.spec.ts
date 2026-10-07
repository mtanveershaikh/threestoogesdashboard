import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { DailyRollup } from '../../data/models';
import { MOCK_ROLLUPS } from '../../data/mock-fixtures';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MockDataService } from '../../data/mock-data.service';
import { Overview } from './overview';

async function render(): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: DataService, useClass: MockDataService }],
  });
  const fixture = TestBed.createComponent(Overview);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Overview', () => {
  it('shows the key figures with signs', async () => {
    const el = await render();
    const text = el.querySelector('.kpis')!.textContent!;
    expect(text).toContain('$5,127');
    expect(text).toContain('▲ +2.5% since start');
    expect(text).toContain('+$14');
    expect(text).toContain('2.1%');
    expect(text).toContain('Armed, normal');
    expect(text).toContain('Drawdown -1.8% of -10%');
  });

  it('draws the return chart with the three bots and the total', async () => {
    const el = await render();
    expect(el.querySelectorAll('app-line-chart svg path')).toHaveLength(4);
    expect(el.querySelector('app-line-chart')?.textContent).toContain('Total');
  });

  it('lists the plans read-only with a Telegram link and one split verdict flag', async () => {
    const el = await render();
    expect(el.querySelectorAll('app-plan-card')).toHaveLength(2);
    expect(el.textContent).toContain('2 plans');
    expect(el.querySelectorAll('app-verdict-chip.split')).toHaveLength(1);
    expect(el.querySelectorAll('a.approve')).toHaveLength(2);
    expect(el.querySelector('a.approve')?.getAttribute('rel')).toContain('noopener');
    const buttons = Array.from(el.querySelectorAll('button')).map((b) => b.textContent);
    expect(buttons.filter((t) => /approve|reject/i.test(t ?? ''))).toEqual([]);
  });

  it('uses the bot names in the chart legend, the cards and the tables', async () => {
    const el = await render();
    const legend = Array.from(el.querySelectorAll('app-line-chart .legend li')).map((l) => l.textContent?.trim());
    expect(legend).toEqual(['Wasif', 'Waseem', 'Nawaz', 'Total']);
    expect(Array.from(el.querySelectorAll('app-bot-card h3')).map((h) => h.textContent)).toEqual(['Wasif', 'Waseem', 'Nawaz']);
    expect(el.querySelector('.tables')?.textContent).toContain('Nawaz');
    expect(el.textContent).not.toMatch(/Breakout Bot|Pullback Bot|Reversion Bot/);
  });

  it('shows three bot cards with a link to each report', async () => {
    const el = await render();
    const cards = Array.from(el.querySelectorAll('app-bot-card'));
    expect(cards).toHaveLength(3);
    expect(cards[2].textContent).toContain('▼ -0.6%');
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/bots/breakout');
    // The bot's name and the View report link both go to its report.
    expect(cards.map((c) => c.querySelector('h3 a')?.getAttribute('href'))).toEqual(['/bots/breakout', '/bots/pullback', '/bots/reversion']);
  });

  it('fills both tables, with signs on every result', async () => {
    const el = await render();
    const [positions, closed] = Array.from(el.querySelectorAll('.tables app-data-table'));
    expect(positions.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(closed.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(positions.textContent).toContain('▼ -0.4R');
    expect(closed.textContent).toContain('▲ +3.0R');
    expect(closed.textContent).toContain('Oct 6');
    expect(closed.textContent).toContain('Time stop');
  });

  it('links the recently closed list to every trade', async () => {
    const el = await render();
    expect(el.querySelector<HTMLAnchorElement>('a.more')?.getAttribute('href')).toBe('/trades');
    expect(el.querySelector('a.more')?.textContent?.trim()).toBe('See all trades →');
  });

  it('labels sample data in the footer', async () => {
    const el = await render();
    expect(el.querySelector('footer')?.textContent).toContain('sample data');
  });

  it('shows a plain message and a Try again button when the data cannot be read', async () => {
    const failing = Object.assign(new MockDataService(), {
      getBots: () => throwError(() => ({ code: 'permission-denied' })),
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: DataService, useValue: failing }],
    });
    const fixture = TestBed.createComponent(Overview);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('The overview could not load');
    expect(el.textContent).toContain('not allowed to read');
    expect(el.querySelector('button')?.textContent).toContain('Try again');
    expect(el.querySelector('.kpis')).toBeNull();
  });

  describe('chart range', () => {
    /** Sample service whose All time has 60 earlier days on top of the usual eight weeks, and counts the calls. */
    class RangeService extends MockDataService {
      allCalls = 0;
      override getRollups(days: number | 'all'): Observable<DailyRollup[]> {
        if (days !== 'all') return super.getRollups(days);
        this.allCalls++;
        const earlier: DailyRollup[] = Array.from({ length: 60 }, (_, i) => ({
          ...MOCK_ROLLUPS[0],
          date: new Date(Date.UTC(2026, 4, 1 + i)).toISOString().slice(0, 10),
        }));
        return of([...earlier, ...MOCK_ROLLUPS]);
      }
    }

    async function renderRange(service: MockDataService): Promise<{ el: HTMLElement; settle: () => Promise<void> }> {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: DataService, useValue: service }],
      });
      const fixture = TestBed.createComponent(Overview);
      await fixture.whenStable();
      return { el: fixture.nativeElement as HTMLElement, settle: () => fixture.whenStable() };
    }
    const button = (el: HTMLElement, text: string) =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('.range button')).find((b) => b.textContent?.trim() === text)!;

    it('starts on 8 weeks and does not fetch all-time data until it is picked', async () => {
      const service = new RangeService();
      const { el } = await renderRange(service);
      expect(button(el, '8 weeks').getAttribute('aria-pressed')).toBe('true');
      expect(button(el, 'All time').getAttribute('aria-pressed')).toBe('false');
      expect(service.allCalls).toBe(0);
      expect(el.querySelector('app-line-chart .xaxis')?.textContent).toContain('Week 8');
    });

    it('fetches once on All time, then plots every day with dates', async () => {
      const service = new RangeService();
      const { el, settle } = await renderRange(service);
      button(el, 'All time').click();
      await settle();
      expect(service.allCalls).toBe(1);
      expect(button(el, 'All time').getAttribute('aria-pressed')).toBe('true');
      const xaxis = el.querySelector('app-line-chart .xaxis')!.textContent!;
      expect(xaxis).toContain('May 1');
      expect(xaxis).not.toContain('Week');
    });

    it('goes back to 8 weeks without fetching again', async () => {
      const service = new RangeService();
      const { el, settle } = await renderRange(service);
      button(el, 'All time').click();
      await settle();
      button(el, '8 weeks').click();
      await settle();
      expect(service.allCalls).toBe(1);
      expect(el.querySelector('app-line-chart .xaxis')?.textContent).toContain('Week 8');
    });

    it('shows a message and Try again when all-time data cannot load', async () => {
      const service = Object.assign(new MockDataService(), {
        getRollups: (days: number | 'all') => (days === 'all' ? throwError(() => ({ code: 'unavailable' })) : new MockDataService().getRollups(days)),
      });
      const { el, settle } = await renderRange(service);
      button(el, 'All time').click();
      await settle();
      const note = el.querySelector('.range-note.error');
      expect(note?.textContent).toContain('could not be reached');
      expect(note?.querySelector('button')?.textContent).toContain('Try again');
      // The chart keeps the last eight weeks meanwhile.
      expect(el.querySelectorAll('app-line-chart svg path')).toHaveLength(4);
    });

    it('is not offered when there are only backtests', async () => {
      const { el } = await renderRange(new MockDataService('backtest'));
      expect(el.querySelector('.range')).toBeNull();
    });
  });

  describe('backtest only', () => {
    async function renderBacktest(): Promise<HTMLElement> {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: DataService, useValue: new MockDataService('backtest') }],
      });
      const fixture = TestBed.createComponent(Overview);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('says paper trading has not started and does not claim a paper week', async () => {
      const el = await renderBacktest();
      expect(el.querySelector('.notice')?.textContent).toContain('Paper trading has not started');
      expect(el.querySelector('.title')?.textContent).toContain('Paper trading has not started');
      expect(el.querySelector('.title')?.textContent).not.toMatch(/Week \d+ of the/);
    });

    it('charts the three backtests, with dates and without a paper total', async () => {
      const el = await renderBacktest();
      const legend = Array.from(el.querySelectorAll('app-line-chart .legend li')).map((l) => l.textContent?.trim());
      expect(legend).toEqual(['Wasif', 'Waseem', 'Nawaz']);
      expect(el.querySelectorAll('app-line-chart svg path')).toHaveLength(3);
      expect(el.querySelector('.chart h2')?.textContent).toBe('Backtest return');
      expect(el.querySelector('app-line-chart .xaxis')?.textContent).toContain('Aug 13');
    });

    it('bot cards show the backtest with a Backtest only pill and no paper trades', async () => {
      const el = await renderBacktest();
      const cards = Array.from(el.querySelectorAll('app-bot-card'));
      expect(cards).toHaveLength(3);
      expect(cards[0].querySelector('.status')?.textContent).toBe('Backtest only');
      expect(cards[0].textContent).toContain('Backtest return on $2,000 budget');
      expect(cards[0].textContent).toContain('▲ +11.8%');
      expect(cards[0].textContent).toContain('no paper trades yet');
    });

    it('explains the empty paper sections instead of showing blanks', async () => {
      const el = await renderBacktest();
      expect(el.textContent).toContain('No plans waiting');
      expect(el.textContent).toContain('No open positions.');
      expect(el.textContent).toContain('No closed trades yet.');
    });
  });
});
