import { describe, expect, it } from 'vitest';
import { pageItems, paginate } from './pagination';

describe('paginate', () => {
  it('numbers the items on each page', () => {
    expect(paginate(50, 1, 25)).toEqual({ page: 1, pages: 2, size: 25, total: 50, from: 1, to: 25 });
    expect(paginate(50, 2, 25)).toEqual({ page: 2, pages: 2, size: 25, total: 50, from: 26, to: 50 });
  });

  it('ends on a short last page', () => {
    expect(paginate(53, 3, 25)).toMatchObject({ pages: 3, from: 51, to: 53 });
  });

  it('keeps the page inside the range when the list shrinks, for example after a filter', () => {
    expect(paginate(10, 9, 25)).toMatchObject({ page: 1, pages: 1, from: 1, to: 10 });
    expect(paginate(50, 99, 10)).toMatchObject({ page: 5, from: 41, to: 50 });
    expect(paginate(50, 0, 10).page).toBe(1);
    expect(paginate(50, NaN, 10).page).toBe(1);
    expect(paginate(50, -3, 10).page).toBe(1);
  });

  it('has one empty page for no items', () => {
    expect(paginate(0, 1, 25)).toEqual({ page: 1, pages: 1, size: 25, total: 0, from: 0, to: 0 });
  });

  it('fits exactly on one page', () => {
    expect(paginate(25, 1, 25)).toMatchObject({ pages: 1, from: 1, to: 25 });
    expect(paginate(26, 1, 25)).toMatchObject({ pages: 2 });
  });
});

describe('pageItems', () => {
  it('shows every page when there are few', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps the first pages together near the start', () => {
    expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
    expect(pageItems(3, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
  });

  it('keeps the last pages together near the end', () => {
    expect(pageItems(20, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
    expect(pageItems(18, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
  });

  it('shows the current page and its neighbours in the middle', () => {
    expect(pageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
  });

  it('never shows more than seven items, and always includes the current page', () => {
    for (let pages = 1; pages <= 40; pages++) {
      for (let page = 1; page <= pages; page++) {
        const items = pageItems(page, pages);
        expect(items.length).toBeLessThanOrEqual(7);
        expect(items).toContain(page);
        expect(items[0]).toBe(1);
        expect(items[items.length - 1]).toBe(pages);
        const numbers = items.filter((i): i is number => i !== 'gap');
        expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
      }
    }
  });
});
