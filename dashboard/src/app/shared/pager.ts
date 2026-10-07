import { Component, computed, input, output } from '@angular/core';
import { PageItem, paginate, pageItems } from './pagination';

export const PAGE_SIZES: readonly number[] = [10, 25, 50, 100];

/**
 * Page controls for a long list: which items are on screen, Previous and Next, numbered pages, and a rows-per-page
 * choice. It only reports what the person chose; the page decides what to show.
 */
@Component({
  selector: 'app-pager',
  template: `
    <nav class="pager" aria-label="Pagination">
      <p class="range" role="status">
        @if (info().total === 0) {
          No {{ noun() }}
        } @else {
          Showing {{ info().from }}–{{ info().to }} of {{ info().total }} {{ noun() }}
        }
      </p>

      <label class="size">
        <span>Rows per page</span>
        <select (change)="sizeChange.emit(+$any($event.target).value)">
          @for (s of sizes(); track s) {
            <option [value]="s" [selected]="s === pageSize()">{{ s }}</option>
          }
        </select>
      </label>

      <ul class="pages">
        <li>
          <button type="button" [disabled]="info().page <= 1" (click)="pageChange.emit(info().page - 1)">Previous</button>
        </li>
        @for (item of items(); track $index) {
          @if (isGap(item)) {
            <li class="gap" aria-hidden="true">…</li>
          } @else {
            <li>
              <button
                type="button"
                class="num"
                [attr.aria-current]="item === info().page ? 'page' : null"
                [attr.aria-label]="'Page ' + item + ' of ' + info().pages"
                (click)="pageChange.emit(+item)"
              >
                {{ item }}
              </button>
            </li>
          }
        }
        <li>
          <button type="button" [disabled]="info().page >= info().pages" (click)="pageChange.emit(info().page + 1)">Next</button>
        </li>
      </ul>
    </nav>
  `,
  styles: `
    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 20px;
    }
    .range { margin: 0; color: var(--text-muted); font-size: 13px; }
    .size {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      font-size: 13px;
    }
    select {
      min-height: var(--touch);
      padding: 0 10px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      background: var(--bg-inset);
      color: var(--text);
      font: inherit;
    }
    .pages {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    button {
      min-width: var(--touch);
      min-height: var(--touch);
      padding: 0 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--text);
      font: inherit;
      font-weight: 500;
    }
    button:hover:not(:disabled) { background: var(--bg-raised); }
    button:disabled { color: var(--text-muted); opacity: 0.5; cursor: not-allowed; }
    button[aria-current='page'] {
      background: var(--bg-raised);
      border-color: var(--border-strong);
    }
    .gap { padding: 0 4px; color: var(--text-muted); }
  `,
})
export class Pager {
  /** The page to show, 1-based. A page past the end is shown as the last page. */
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly sizes = input<readonly number[]>(PAGE_SIZES);
  /** What the items are called, for example "trades". */
  readonly noun = input('items');

  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  protected readonly info = computed(() => paginate(this.total(), this.page(), this.pageSize()));
  protected readonly items = computed<PageItem[]>(() => pageItems(this.info().page, this.info().pages));
  protected isGap(item: PageItem): item is 'gap' {
    return item === 'gap';
  }
}
