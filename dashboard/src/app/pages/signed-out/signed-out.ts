import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, describeSignInError } from '../../auth/auth.service';
import { EmptyState } from '../../shared/empty-state';

@Component({
  selector: 'app-signed-out',
  imports: [EmptyState],
  template: `
    @if (auth.user(); as u) {
      <app-empty-state [level]="1" title="This account cannot view the dashboard" [message]="u.email + ' is not on the list of accounts allowed to view this dashboard. Sign out and try another account.'">
        <button type="button" class="button" (click)="signOut()">Sign out</button>
      </app-empty-state>
    } @else {
      <app-empty-state [level]="1" title="Sign in to see your bots" message="This dashboard shows private trading results. Sign in with the Google account it is set up for.">
        <button type="button" class="button" (click)="signIn()">Sign in with Google</button>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </app-empty-state>
    }
  `,
  styles: `
    .error { color: var(--loss); margin: 12px 0 0; }
  `,
})
export class SignedOut {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly error = signal('');

  protected async signIn(): Promise<void> {
    this.error.set('');
    try {
      await this.auth.signIn();
      if (this.auth.canRead()) await this.router.navigateByUrl('/');
    } catch (err) {
      this.error.set(describeSignInError(err));
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
