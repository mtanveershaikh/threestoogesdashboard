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
  /** True when the app may read data: always in mock mode, otherwise only for the allowed, verified account. */
  readonly canRead = computed(() => {
    if (!this.enabled) return true;
    const u = this.current();
    return !!u && u.email === environment.allowedEmail && u.emailVerified;
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
