import { Component, inject } from '@angular/core';
import { DataService } from '../data/data.service';

/** Shown whenever the data is sample data, so sample numbers are never mistaken for results. */
@Component({
  selector: 'app-sample-data-badge',
  template: `@if (isSample) { <span class="badge">Sample data</span> }`,
  styles: `
    .badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: var(--radius-pill);
      border: 1px dashed var(--border-dashed);
      color: var(--text-muted);
      font-size: 12px;
    }
  `,
})
export class SampleDataBadge {
  protected readonly isSample = inject(DataService).isSample;
}
