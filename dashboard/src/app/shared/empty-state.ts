import { Component, input } from '@angular/core';

/** Empty, loading-failed and coming-soon moments: say what is missing and what to do. */
@Component({
  selector: 'app-empty-state',
  template: `
    <h3>{{ title() }}</h3>
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
    h3 { font-size: 16px; }
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
}
