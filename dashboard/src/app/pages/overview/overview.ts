import { Component } from '@angular/core';
import { EmptyState } from '../../shared/empty-state';

/** Placeholder until D4. */
@Component({
  selector: 'app-overview',
  imports: [EmptyState],
  template: `<app-empty-state title="Overview is coming next" message="The KPI row, return chart, plans and bot cards are built in stage D4." />`,
})
export class Overview {}
