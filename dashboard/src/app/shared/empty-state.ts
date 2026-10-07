import { Component, input } from '@angular/core';

/** Empty, loading-failed and coming-soon moments: say what is missing and what to do. */
@Component({
  selector: 'app-empty-state',
  template: `
    @if (level() === 1) {
      <h1>{{ title() }}</h1>
    } @else if (level() === 2) {
      <h2>{{ title() }}</h2>
    } @else {
      <h3>{{ title() }}</h3>
    }
    @if (message()) {
      <p>{{ message() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
      padding: 32px 20px;
      border: 1px dashed var(--border-dashed);
      border-radius: var(--radius-card);
      text-align: center;
    }
    h1, h2, h3 { font-size: 16px; }
    p {
      margin: 6px auto 0;
      max-width: 52ch;
      color: var(--text-muted);
    }
  `,
  host: { role: 'status' },
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input<string>();
  /** 1 when the empty state is the whole page, 2 under a page heading, 3 inside a card that has its own heading. */
  readonly level = input<1 | 2 | 3>(3);
}
