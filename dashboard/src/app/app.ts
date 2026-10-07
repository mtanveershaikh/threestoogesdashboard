import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from './auth/auth.service';
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
  protected readonly auth = inject(AuthService);
  private readonly data = inject(DataService);

  /** Only reads once the account is allowed to, so a signed-out visit never hits the database. */
  protected readonly status = toSignal(
    toObservable(this.auth.canRead).pipe(switchMap((ok) => (ok ? this.data.getSystemStatus() : of(undefined)))),
  );
}
