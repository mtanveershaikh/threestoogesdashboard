import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, input } from '@angular/core';

export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right';
  /** Figures in the mono font. */
  mono?: boolean;
  /** Keep each value on one line (dates, tickers); the table scrolls sideways instead. */
  nowrap?: boolean;
}

export interface CellContext {
  $implicit: Record<string, unknown>;
  column: Column;
}

/**
 * Table that scrolls inside its own box at phone width.
 * Pass a `cell` template to render rich cells (bot dot, signed result); plain text is the default.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet],
  template: `
    <div class="scroll" tabindex="0" role="region" [attr.aria-label]="caption()">
      @if (rows().length) {
        <table>
          <caption class="visually-hidden">{{ caption() }}</caption>
          <thead>
            <tr>
              @for (c of columns(); track c.key) {
                <th scope="col" [class.right]="c.align === 'right'">{{ c.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              <tr>
                @for (c of columns(); track c.key) {
                  <td [class.right]="c.align === 'right'" [class.mono]="c.mono" [class.nowrap]="c.nowrap">
                    @if (cell(); as tpl) {
                      <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row, column: c }" />
                    } @else {
                      {{ row[c.key] }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="empty">{{ emptyText() }}</p>
      }
    </div>
  `,
  styles: `
    .scroll { overflow-x: auto; }
    table {
      width: 100%;
      min-width: 480px;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      padding: 8px 6px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 500;
      text-align: left;
    }
    td {
      padding: 12px 6px;
      border-top: 1px solid var(--border);
    }
    .right { text-align: right; }
    .mono { font-family: var(--font-mono); }
    .nowrap { white-space: nowrap; }
    .empty { margin: 0; padding: 16px 6px; color: var(--text-muted); }
  `,
})
export class DataTable {
  readonly caption = input.required<string>();
  readonly columns = input.required<Column[]>();
  readonly rows = input.required<Record<string, unknown>[]>();
  readonly cell = input<TemplateRef<CellContext>>();
  readonly emptyText = input('Nothing to show yet.');
}
