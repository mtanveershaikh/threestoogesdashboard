import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MockDataService } from '../../data/mock-data.service';
import { BotReport } from './bot-report';

async function render(id: string): Promise<HTMLElement> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: DataService, useClass: MockDataService },
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
    ],
  });
  const fixture = TestBed.createComponent(BotReport);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('BotReport', () => {
  it('shows the header and the five KPI tiles for the breakout bot', async () => {
    const el = await render('breakout');
    expect(el.querySelector('h1')?.textContent).toBe('Wasif');
    expect(el.querySelector('.head')?.textContent).toContain('2,000 USD budget, target 1:3, time stop 10 days');
    const kpis = el.querySelector('.kpis')!.textContent!;
    expect(kpis).toContain('+4.2%');
    expect(kpis).toContain('+$84 on $2,000');
    expect(kpis).toContain('+0.21R');
    expect(kpis).toContain('6 of 20 trades. Break-even at 1:3 is 25%');
    expect(kpis).toContain('Gate: at least 1.3');
    expect(kpis).toContain('-6.1%');
    expect(el.querySelectorAll('.kpis app-stat-tile')).toHaveLength(5);
  });

  it('compares paper and backtest side by side with the same dates and costs', async () => {
    const el = await render('breakout');
    const card = el.querySelector('.compare')!;
    expect(card.querySelector('h2')?.textContent).toContain('side by side');
    const text = card.textContent!;
    expect(text).toContain('no analyst filter');
    expect(text).toContain('0.03R of cost and slippage');
    const row = (label: string) => Array.from(card.querySelectorAll('tbody tr')).find((r) => r.textContent?.includes(label))!;
    expect(row('Trades').textContent).toContain('20');
    expect(row('Trades').textContent).toContain('42');
    expect(row('Average per trade').textContent).toContain('+0.21R');
    expect(row('Average per trade').textContent).toContain('+0.28R');
    expect(card.querySelectorAll('tbody tr')).toHaveLength(7);
  });

  it('names each bot as in the config, with its strategy underneath', async () => {
    const wasif = await render('breakout');
    expect(wasif.querySelector('h1')?.textContent).toBe('Wasif');
    expect(wasif.querySelector('.head')?.textContent).toContain('Breakout momentum');
    expect((await render('pullback')).querySelector('h1')?.textContent).toBe('Waseem');
    expect((await render('reversion')).querySelector('h1')?.textContent).toBe('Nawaz');
  });

  it('lets you switch between the three bots and marks the current one', async () => {
    const el = await render('pullback');
    const links = Array.from(el.querySelectorAll('nav.switcher a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Wasif', 'Waseem', 'Nawaz']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/bots/breakout', '/bots/pullback', '/bots/reversion']);
  });

  it('marks only the current bot in the switcher, using the real router', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'bots/:id', component: BotReport }]),
        { provide: DataService, useClass: MockDataService },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/bots/pullback', BotReport);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    const active = Array.from(el.querySelectorAll('nav.switcher a.active'));
    expect(active.map((a) => a.textContent?.trim())).toEqual(['Waseem']);
    expect(active[0].getAttribute('aria-current')).toBe('page');
  });

  it('has no write controls', async () => {
    const el = await render('breakout');
    const labels = Array.from(el.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels.filter((t) => /pause|halt|approve|reject/i.test(t ?? ''))).toEqual([]);
  });

  it('draws paper and backtest lines, the histogram and the checklist', async () => {
    const el = await render('breakout');
    expect(el.querySelectorAll('app-line-chart svg path')).toHaveLength(2);
    expect(el.querySelector('app-line-chart')?.textContent).toContain('Backtest expectation');
    expect(el.querySelectorAll('app-histogram-bars .bar')).toHaveLength(7);
    expect(el.querySelectorAll('.checklist app-progress-row')).toHaveLength(6);
    const checklist = el.querySelector('.checklist')!.textContent!;
    expect(checklist).toContain('Not yet: 20 of 100');
    expect(checklist).toContain('Met: +0.21R');
    expect(el.querySelector('.verdict-title')?.textContent).toBe('Not yet');
  });

  it('lists setups and recent trades with both analyst verdicts', async () => {
    const el = await render('breakout');
    const table = (caption: string) =>
      Array.from(el.querySelectorAll('app-data-table')).find((t) => t.querySelector(`[aria-label="${caption}"]`))!;
    const setups = table('Results by setup');
    const trades = table('Recent trades');
    expect(setups.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(setups.textContent).toContain('Watching, 9 trades to go');
    expect(trades.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(trades.textContent).toContain('Buy 71');
    expect(trades.textContent).toContain('Hold 49');
    expect(trades.textContent).toContain('▲ +3.0R');
    expect(trades.textContent).toContain('▼ -1.0R');
  });

  it('says not ready for the reversion bot and shows its negative return with a sign', async () => {
    const el = await render('reversion');
    expect(el.querySelector('.verdict-title')?.textContent).toBe('Not ready');
    expect(el.querySelector('.kpis')?.textContent).toContain('▼ -$8 on $1,250');
    expect(el.querySelector('.kpis')?.textContent).toContain('-0.6%');
  });

  it('shows a clear message for an unknown bot', async () => {
    const el = await render('nope');
    expect(el.querySelector('h1')?.textContent).toBe('Bot not found');
    expect(el.querySelector('.kpis')).toBeNull();
  });

  it('shows a message and a Try again button when the data cannot be read', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: DataService, useValue: Object.assign(new MockDataService(), { getBot: () => throwError(() => ({ code: 'unavailable' })) }) },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'breakout' })) } },
      ],
    });
    const fixture = TestBed.createComponent(BotReport);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('The report could not load');
    expect(el.textContent).toContain('could not be reached');
    expect(el.querySelector('button')?.textContent).toContain('Try again');
  });
});
