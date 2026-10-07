import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { EmptyState } from '../../shared/empty-state';

@Component({
  selector: 'app-signed-out',
  imports: [EmptyState],
  template: `
    @if (auth.user(); as u) {
      <app-empty-state title="This account cannot view the dashboard" [message]="u.email + ' is not the account this dashboard is set up for. Sign out and try another account.'">
        <button type="button" (click)="signOut()">Sign out</button>
      </app-empty-state>
    } @else {
      <app-empty-state title="Sign in to see your bots" message="This dashboard shows private trading results. Sign in with the Google account it is set up for.">
        <button type="button" (click)="signIn()">Sign in with Google</button>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </app-empty-state>
    }
  `,
  styles: `
    button {
      min-height: var(--touch);
      margin-top: 16px;
      padding: 0 18px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      background: var(--bg-raised);
      color: var(--text);
      font-size: 14px;
      font-weight: 500;
    }
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
    } catch {
      this.error.set('Sign-in did not finish. Allow the pop-up and try again.');
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
