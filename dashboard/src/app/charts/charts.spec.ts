import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { axisRange, linePath, sparklinePath, ticks, xAt, yAt } from './chart-math';
import { HistogramBars } from './histogram-bars';
import { LineChart } from './line-chart';
import { Sparkline } from './sparkline';

function render<T extends object>(type: new () => T, inputs: Record<string, unknown>): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('chart math', () => {
  it('spreads points edge to edge', () => {
    expect(xAt(0, 5, 800)).toBe(0);
    expect(xAt(2, 5, 800)).toBe(400);
    expect(xAt(4, 5, 800)).toBe(800);
    expect(xAt(0, 1, 800)).toBe(0);
  });

  it('maps values to y with the top at yMax', () => {
    expect(yAt(6, -2, 6, 240)).toBe(0);
    expect(yAt(-2, -2, 6, 240)).toBe(240);
    expect(yAt(0, -2, 6, 240)).toBe(180);
  });

  it('builds a path through every point', () => {
    expect(linePath([0, 6], -2, 6, { width: 800, height: 240 })).toBe('M0.0 180.0 L800.0 0.0');
    expect(linePath([], -2, 6, { width: 800, height: 240 })).toBe('');
  });

  it('scales a sparkline to its own range inside a margin', () => {
    expect(sparklinePath([1, 3], { width: 120, height: 40 })).toBe('M0.0 36.0 L120.0 4.0');
    expect(sparklinePath([5, 5], { width: 120, height: 40 })).toBe('M0.0 36.0 L120.0 36.0');
    expect(sparklinePath([], { width: 120, height: 40 })).toBe('');
  });

  it('picks axis bounds that include zero', () => {
    expect(axisRange([0.3, 4.2])).toEqual({ min: 0, max: 6 });
    expect(axisRange([-0.6, 1.1])).toEqual({ min: -2, max: 2 });
    expect(axisRange([])).toEqual({ min: -2, max: 6 });
  });

  it('lists ticks inclusive of both ends', () => {
    expect(ticks(-2, 6, 2)).toEqual([-2, 0, 2, 4, 6]);
  });
});

describe('LineChart', () => {
  const series = [
    { name: 'Total', color: '#fff', values: [0, 1, 2], width: 2.75 },
    { name: 'Backtest', color: '#999', values: [0, 2, 4], dashed: true },
  ];

  it('draws one path per series, a dashed baseline and a legend', () => {
    const el = render(LineChart, { series, xLabels: ['Week 1', 'Week 2'], ariaLabel: 'Return since start' });
    expect(el.querySelectorAll('svg path')).toHaveLength(2);
    expect(el.querySelectorAll('li')).toHaveLength(2);
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Return since start');
    const dashedLines = Array.from(el.querySelectorAll('svg line')).filter((l) => l.getAttribute('stroke-dasharray'));
    expect(dashedLines).toHaveLength(1);
    expect(el.querySelector('path[stroke-dasharray="6 5"]')).not.toBeNull();
    expect(el.textContent).toContain('+6%');
    expect(el.textContent).toContain('-2%');
  });

  it('shows an empty state when there is no data', () => {
    const el = render(LineChart, { series: [{ name: 'Total', color: '#fff', values: [] }], ariaLabel: 'x' });
    expect(el.querySelector('svg')).toBeNull();
    expect(el.textContent).toContain('No results yet');
  });
});

describe('Sparkline', () => {
  it('draws a path and hides itself from screen readers by default', () => {
    const el = render(Sparkline, { values: [1, 2, 3], color: '#f00' });
    expect(el.querySelector('path')?.getAttribute('d')).toContain('M0.0');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws nothing for no data', () => {
    const el = render(Sparkline, { values: [] });
    expect(el.querySelector('path')).toBeNull();
  });
});

describe('HistogramBars', () => {
  const bins = [
    { label: '-1', count: 10 },
    { label: '0', count: 2 },
    { label: '+3', count: 4 },
  ];

  it('scales bars to the tallest, shows counts and tones by sign', () => {
    const el = render(HistogramBars, { bins });
    const bars = Array.from(el.querySelectorAll<HTMLElement>('.bar'));
    expect(bars.map((b) => b.style.height)).toEqual(['150px', '30px', '60px']);
    expect(bars.map((b) => b.className)).toEqual(['bar loss', 'bar neutral', 'bar gain']);
    expect(Array.from(el.querySelectorAll('.count')).map((c) => c.textContent)).toEqual(['10', '2', '4']);
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('10 at -1R');
  });

  it('shows an empty state when no trades have closed', () => {
    const el = render(HistogramBars, { bins: [{ label: '-1', count: 0 }] });
    expect(el.querySelector('.bar')).toBeNull();
    expect(el.textContent).toContain('No closed trades yet');
  });
});
