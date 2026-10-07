import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Pager } from './pager';

function render(inputs: Record<string, unknown>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Pager);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const pages: number[] = [];
  const sizes: number[] = [];
  fixture.componentInstance.pageChange.subscribe((p) => pages.push(p));
  fixture.componentInstance.sizeChange.subscribe((s) => sizes.push(s));
  const button = (text: string) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
  return { el, pages, sizes, button };
}

describe('Pager', () => {
  it('says which items are on screen', () => {
    const { el } = render({ page: 2, pageSize: 25, total: 53, noun: 'trades' });
    expect(el.querySelector('.range')?.textContent?.trim()).toBe('Showing 26–50 of 53 trades');
  });

  it('says so plainly when there is nothing to page', () => {
    const { el } = render({ page: 1, pageSize: 25, total: 0, noun: 'trades' });
    expect(el.querySelector('.range')?.textContent?.trim()).toBe('No trades');
    expect((el.querySelector('.pages button:first-child') as HTMLButtonElement).disabled).toBe(true);
  });

  it('marks the current page for assistive tech, and names every page button', () => {
    const { el } = render({ page: 2, pageSize: 10, total: 50 });
    const current = el.querySelectorAll('button[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe('2');
    expect(current[0].getAttribute('aria-label')).toBe('Page 2 of 5');
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
  });

  it('disables Previous on the first page and Next on the last', () => {
    const first = render({ page: 1, pageSize: 25, total: 50 });
    expect(first.button('Previous').disabled).toBe(true);
    expect(first.button('Next').disabled).toBe(false);
    const last = render({ page: 2, pageSize: 25, total: 50 });
    expect(last.button('Previous').disabled).toBe(false);
    expect(last.button('Next').disabled).toBe(true);
  });

  it('reports the page the person chose', () => {
    const { pages, button } = render({ page: 3, pageSize: 10, total: 50 });
    button('Next').click();
    button('Previous').click();
    button('5').click();
    expect(pages).toEqual([4, 2, 5]);
  });

  it('shows a gap instead of every page when there are many', () => {
    const { el } = render({ page: 10, pageSize: 10, total: 200 });
    const labels = Array.from(el.querySelectorAll('.pages li')).map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Previous', '1', '…', '9', '10', '11', '…', '20', 'Next']);
    expect(el.querySelectorAll('li.gap[aria-hidden="true"]')).toHaveLength(2);
  });

  it('treats a page past the end as the last page', () => {
    const { el } = render({ page: 99, pageSize: 25, total: 50 });
    expect(el.querySelector('.range')?.textContent?.trim()).toBe('Showing 26–50 of 50 items');
    expect(el.querySelector('button[aria-current="page"]')?.textContent?.trim()).toBe('2');
  });

  it('offers rows per page, with the current size chosen, and reports a change', () => {
    const { el, sizes } = render({ page: 1, pageSize: 25, total: 50 });
    const select = el.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent?.trim())).toEqual(['10', '25', '50', '100']);
    expect(Array.from(select.options).find((o) => o.selected)?.textContent?.trim()).toBe('25');
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    expect(sizes).toEqual([50]);
  });
});
