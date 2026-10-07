import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MockDataService } from '../../data/mock-data.service';
import { BotReport } from './bot-report';

async function render(id: string): Promise<HTMLElement> {
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
    expect(el.querySelector('h1')?.textContent).toBe('Breakout Bot');
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
    const tables = Array.from(el.querySelectorAll('app-data-table'));
    expect(tables[0].querySelectorAll('tbody tr')).toHaveLength(3);
    expect(tables[0].textContent).toContain('Watching, 9 trades to go');
    expect(tables[1].querySelectorAll('tbody tr')).toHaveLength(6);
    expect(tables[1].textContent).toContain('Buy 71');
    expect(tables[1].textContent).toContain('Hold 49');
    expect(tables[1].textContent).toContain('▲ +3.0R');
    expect(tables[1].textContent).toContain('▼ -1.0R');
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
