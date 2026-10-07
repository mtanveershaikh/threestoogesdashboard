import { Component } from '@angular/core';
import { EmptyState } from '../../shared/empty-state';

/** Placeholder until D5. */
@Component({
  selector: 'app-bot-report',
  imports: [EmptyState],
  template: `<app-empty-state title="Bot report is coming soon" message="The report page is built in stage D5." />`,
})
export class BotReport {}
