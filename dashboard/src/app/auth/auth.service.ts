import { Injectable, computed, signal } from '@angular/core';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { firebaseAuth } from '../data/firebase';

/**
 * Google sign-in for the real database. In mock mode there is no sign-in and everything is readable.
 * The Firestore rules are the real lock; this only decides which screen to show.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** False in mock mode. */
  readonly enabled = environment.dataSource === 'firestore';

  private readonly current = signal<User | null>(null);
  private readonly resolved = signal(!this.enabled);

  readonly user = this.current.asReadonly();
  /** True once the first sign-in state is known. */
  readonly ready = this.resolved.asReadonly();
  /** True when the app may read data: always in mock mode, otherwise only for an allowed, verified account. */
  readonly canRead = computed(() => {
    if (!this.enabled) return true;
    const u = this.current();
    return !!u && !!u.email && environment.allowedEmails.includes(u.email) && u.emailVerified;
  });

  private readonly readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      if (!this.enabled) return resolve();
      onAuthStateChanged(firebaseAuth(), (u) => {
        this.current.set(u);
        this.resolved.set(true);
        resolve();
      });
    });
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async signIn(): Promise<void> {
    await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
  }

  async signOut(): Promise<void> {
    await signOut(firebaseAuth());
  }
}

/** One plain sentence for a failed sign-in, by what actually went wrong. */
export function describeSignInError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'The browser blocked the sign-in pop-up. Allow pop-ups for this site and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The sign-in window was closed before it finished. Try again.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Google sign-in is not turned on for this project. In the Firebase console, open Authentication and enable the Google provider.';
    case 'auth/unauthorized-domain':
      return 'This web address is not authorized for sign-in. In the Firebase console, add it under Authentication, Settings, Authorized domains.';
    case 'auth/network-request-failed':
      return 'The network request failed. Check your connection and try again.';
    default:
      return `Sign-in did not finish${code ? ` (${code})` : ''}. Try again.`;
  }
}
