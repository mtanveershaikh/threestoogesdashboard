import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
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

  it('shows three bot cards with a link to each report', async () => {
    const el = await render();
    const cards = Array.from(el.querySelectorAll('app-bot-card'));
    expect(cards).toHaveLength(3);
    expect(cards[2].textContent).toContain('▼ -0.6%');
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/bots/breakout');
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
});
