import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DataService } from './data/data.service';
import { Avatar } from './shared/avatar';
import { SampleDataBadge } from './shared/sample-data-badge';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SampleDataBadge, Avatar],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly status = toSignal(inject(DataService).getSystemStatus());
}
