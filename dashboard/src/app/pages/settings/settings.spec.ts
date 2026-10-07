import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from '../../data/data.service';
import { MockDataService } from '../../data/mock-data.service';
import { MOCK_CONFIG } from '../../data/mock-fixtures';
import { SystemConfig } from '../../data/models';
import { Settings } from './settings';

async function render(service: DataService = new MockDataService()): Promise<HTMLElement> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: DataService, useValue: service }],
  });
  const fixture = TestBed.createComponent(Settings);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}
/** Label and value pairs from every definition list inside `root`. */
const facts = (root: ParentNode) =>
  Object.fromEntries(Array.from(root.querySelectorAll('dl > div')).map((row) => [row.querySelector('dt')!.textContent!.trim(), row.querySelector('dd')!.textContent!.trim()]));
const withConfig = (config: SystemConfig | undefined) =>
  Object.assign(new MockDataService(), { getConfig: (): Observable<SystemConfig | undefined> => of(config) });

describe('Settings page', () => {
  it('shows the account limits and the go-live thresholds', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    const [limits, gates] = Array.from(el.querySelectorAll('.two .card'));
    expect(facts(limits)).toMatchObject({
      'Starting capital': '$5,000',
      'Open risk limit': '4% of capital',
      'Trades per day': 'at most 10',
      'Kill switch': 'trips at a drawdown of -10%',
    });
    expect(facts(gates)).toEqual({
      'Closed trades': 'at least 100',
      'Average per trade': 'at least +0.15R',
      'Profit factor': 'at least 1.3',
      'Largest drawdown': 'within 20% of budget',
      'Profitable weeks': 'at least 60%',
      'Paper close to backtest': 'within 0.15R',
    });
  });

  it('says which config it is showing, and when it was written', async () => {
    const el = await render();
    expect(el.querySelector('.meta')?.textContent).toBe('Config version 9f3c2a1 · updated Oct 7, 12:00 UTC · Paper trading');
  });

  it('lists each strategy under its bot name, linked to the bot report, with its settings in words', async () => {
    const el = await render();
    const cards = Array.from(el.querySelectorAll('.strategy'));
    expect(cards).toHaveLength(3);
    expect(cards[0].querySelector('h3 a')?.textContent).toBe('Wasif');
    expect(cards[0].querySelector('h3 a')?.getAttribute('href')).toBe('/bots/breakout');
    expect(cards[0].textContent).toContain('breakout_v1');
    const [wasif, , nawaz] = cards.map((c) => facts(c));
    expect(wasif).toMatchObject({
      Universe: 'Nasdaq 100', Budget: '$2,000', 'Reward to risk': '1:3', 'Time stop': '10 days', 'High lookback': '55', 'Volume ratio': '1.5',
    });
    expect(nawaz['Reward to risk']).toBe('1:2');
    expect(cards[0].querySelector('.status')?.textContent).toBe('Paper trading');
  });

  it('shows Backtest only while the bots have only a backtest', async () => {
    const el = await render(new MockDataService('backtest'));
    expect(el.querySelector('.meta')?.textContent).toContain('Backtest only');
    expect(Array.from(el.querySelectorAll('.strategy .status')).map((s) => s.textContent)).toEqual(['Backtest only', 'Backtest only', 'Backtest only']);
  });

  it('cannot be edited: no form controls at all', async () => {
    const el = await render();
    expect(el.querySelectorAll('input, select, textarea, form, button')).toHaveLength(0);
  });

  it('hides a value that looks like a secret even if the bots wrote it', async () => {
    const leaky: SystemConfig = {
      ...MOCK_CONFIG,
      strategies: [{ ...MOCK_CONFIG.strategies[0], params: { stop_atr: 1.5, broker_api_key: 'SECRET-VALUE-123' } }],
    };
    const el = await render(withConfig(leaky));
    expect(el.textContent).not.toContain('SECRET-VALUE-123');
    expect(facts(el.querySelector('.strategy')!)['Broker api key']).toBe('Hidden');
  });

  it('warns when the bot budgets do not add up to the starting capital', async () => {
    const el = await render(withConfig({ ...MOCK_CONFIG, startingCapital: 4000 }));
    expect(el.querySelector('.notice')?.textContent).toContain('add up to $5,000, but starting capital is $4,000');
  });

  it('shows only the parts the bots wrote', async () => {
    const el = await render(withConfig({ strategies: [], limits: { tradeCapPerDay: 10 } }));
    expect(el.textContent).toContain('Trades per day');
    expect(el.textContent).not.toContain('Go-live checklist');
    expect(el.textContent).toContain('No strategies listed');
  });

  it('says plainly when the bots have not published settings', async () => {
    const el = await render(withConfig(undefined));
    expect(el.textContent).toContain('Settings are not published yet');
    expect(el.textContent).toContain('system/config');
    expect(el.querySelector('.strategy')).toBeNull();
  });

  it('shows a message and Try again when the settings cannot load', async () => {
    const el = await render(Object.assign(new MockDataService(), { getConfig: () => throwError(() => ({ code: 'permission-denied' })) }));
    expect(el.textContent).toContain('Settings could not load');
    expect(el.textContent).toContain('not allowed to read');
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Try again'))).toBe(true);
  });
});
