/** Paging maths, kept apart from the component so it can be tested on its own. */

export interface PageInfo {
  /** The page being shown, 1-based, never past the last page. */
  page: number;
  pages: number;
  size: number;
  total: number;
  /** 1-based position of the first and last item on this page. Both 0 when there are no items. */
  from: number;
  to: number;
}

export function paginate(total: number, requestedPage: number, size: number): PageInfo {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), pages);
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  return { page, pages, size, total, from, to };
}

export type PageItem = number | 'gap';

/**
 * The page buttons to show: all of them when there are few, otherwise the first, the last, the current page and
 * its neighbours, with a gap marker where pages are skipped. Always `max` items or fewer.
 */
export function pageItems(page: number, pages: number, max = 7): PageItem[] {
  if (pages <= max) return Array.from({ length: pages }, (_, i) => i + 1);
  const edge = Math.floor((max - 3) / 2) + 1; // how many pages to keep together near either end
  if (page <= edge + 1) return [...Array.from({ length: max - 2 }, (_, i) => i + 1), 'gap', pages];
  if (page >= pages - edge) return [1, 'gap', ...Array.from({ length: max - 2 }, (_, i) => pages - (max - 3) + i)];
  return [1, 'gap', page - 1, page, page + 1, 'gap', pages];
}
