import { Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

export type Load<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string };

/** Turns a data error into one plain sentence that says what to do next. */
export function describeError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  if (code === 'permission-denied') return 'This account is not allowed to read this data. Sign out and sign in with the account the dashboard is set up for.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'The database could not be reached. Check your connection, then try again.';
  if (code === 'failed-precondition') return 'The database is missing an index for this page. Deploy the Firestore indexes, then try again.';
  return 'Something went wrong while loading. Try again in a moment.';
}

export interface Loader<T> {
  state: Signal<Load<T>>;
  /** Runs the source again after an error. */
  retry: () => void;
}

/**
 * Wraps a data stream as loading, ready or error, so a failed read shows a message instead of a blank page.
 * Call it in an injection context, for example a field initializer.
 */
export function createLoader<T>(source: () => Observable<T>): Loader<T> {
  const attempt = signal(0);
  const state = toSignal(
    toObservable(attempt).pipe(
      switchMap(() =>
        source().pipe(
          map((value): Load<T> => ({ status: 'ready', value })),
          catchError((err) => of<Load<T>>({ status: 'error', message: describeError(err) })),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as Load<T> },
  );
  return { state, retry: () => attempt.update((n) => n + 1) };
}
