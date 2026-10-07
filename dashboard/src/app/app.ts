import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { DataService } from './data/data.service';
import { Avatar } from './shared/avatar';
import { SampleDataBadge } from './shared/sample-data-badge';
import { StaleDataBanner } from './shared/stale-data-banner';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SampleDataBadge, Avatar, StaleDataBanner],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  protected readonly isSample = this.data.isSample;

  /** Only reads once the account is allowed to, so a signed-out visit never hits the database. */
  protected readonly status = toSignal(
    toObservable(this.auth.canRead).pipe(switchMap((ok) => (ok ? this.data.getSystemStatus() : of(undefined)))),
  );

  /** The skip link must move focus, not only scroll, or the next Tab returns to the header. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
