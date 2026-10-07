import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DataService } from '../data/data.service';
import { MockDataService } from '../data/mock-data.service';
import { Avatar } from './avatar';
import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { ProgressRow } from './progress-row';
import { SampleDataBadge } from './sample-data-badge';
import { StatTile } from './stat-tile';
import { VerdictChip } from './verdict-chip';

function render<T extends object>(
  type: new () => T,
  inputs: Record<string, unknown>,
): { el: HTMLElement; fixture: ReturnType<typeof TestBed.createComponent<T>> } {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), { provide: DataService, useClass: MockDataService }],
  });
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, fixture };
}

describe('StatTile', () => {
  it('shows the label, value and a signed delta with an arrow', () => {
    const { el } = render(StatTile, { label: 'Today', value: '-$14', delta: '-0.3% of equity', tone: 'loss' });
    expect(el.textContent).toContain('Today');
    expect(el.textContent).toContain('-$14');
    expect(el.querySelector('.delta')?.textContent?.trim()).toBe('▼ -0.3% of equity');
  });

  it('omits the delta line when there is none', () => {
    const { el } = render(StatTile, { label: 'Equity', value: '$5,127' });
    expect(el.querySelector('.delta')).toBeNull();
  });
});

describe('VerdictChip', () => {
  it('writes the verdict as a word with its score', () => {
    const { el } = render(VerdictChip, { verdict: 'BUY', score: 74, prefix: 'Fundamental' });
    expect(el.textContent?.trim()).toBe('Fundamental: Buy 74');
  });

  it('shows the split verdict flag in words', () => {
    const { el } = render(VerdictChip, { verdict: 'SPLIT' });
    expect(el.textContent?.trim()).toBe('Split verdict');
    expect(el.classList).toContain('split');
  });
});

describe('ProgressRow', () => {
  it('exposes the value to assistive tech and clamps it', () => {
    const { el } = render(ProgressRow, { label: 'Open risk', status: '2.1%', value: 140 });
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(el.textContent).toContain('2.1%');
  });
});

describe('Avatar', () => {
  it('shows a placeholder without a url', () => {
    const { el } = render(Avatar, { name: 'Breakout Bot', color: '#F2B84B' });
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('Breakout Bot');
  });

  it('shows the picture with alt text when there is a url', () => {
    const { el } = render(Avatar, { name: 'Breakout Bot', url: '/a.png' });
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('Breakout Bot');
  });
});

describe('SampleDataBadge', () => {
  it('shows in mock mode', () => {
    const { el } = render(SampleDataBadge, {});
    expect(el.textContent).toContain('Sample data');
  });

  it('is hidden when the data is real', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DataService, useValue: { isSample: false } },
      ],
    });
    const fixture = TestBed.createComponent(SampleDataBadge);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });
});

describe('EmptyState', () => {
  it('can be the page heading', () => {
    const { el } = render(EmptyState, { title: 'Bot not found', level: 1 });
    expect(el.querySelector('h1')?.textContent).toBe('Bot not found');
    expect(el.querySelector('h3')).toBeNull();
  });

  it('shows a title and message', () => {
    const { el } = render(EmptyState, { title: 'No trades yet', message: 'Trades appear after the first exit.' });
    expect(el.textContent).toContain('No trades yet');
    expect(el.textContent).toContain('Trades appear after the first exit.');
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'symbol', label: 'Stock' },
    { key: 'r', label: 'Result', align: 'right' as const },
  ];

  it('renders headers and rows', () => {
    const { el } = render(DataTable, {
      caption: 'Open positions',
      columns,
      rows: [{ symbol: 'TMPL', r: '+1.3R' }, { symbol: 'VELA', r: '-0.4R' }],
    });
    expect(el.querySelectorAll('th')).toHaveLength(2);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(el.textContent).toContain('-0.4R');
  });

  it('shows the empty text when there are no rows', () => {
    const { el } = render(DataTable, { caption: 'Open positions', columns, rows: [], emptyText: 'No open positions.' });
    expect(el.querySelector('table')).toBeNull();
    expect(el.textContent).toContain('No open positions.');
  });
});
