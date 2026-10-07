import { Injector, provideZonelessChangeDetection, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { createLoader, describeError } from './load-state';

function inCtx<T>(fn: () => T): T {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  return runInInjectionContext(TestBed.inject(Injector), fn);
}

describe('createLoader', () => {
  it('is loading until the source emits, then ready', () => {
    const src = new Subject<number>();
    const loader = inCtx(() => createLoader(() => src));
    TestBed.tick();
    expect(loader.state().status).toBe('loading');
    src.next(5);
    expect(loader.state()).toEqual({ status: 'ready', value: 5 });
  });

  it('turns a failed read into an error message, and retry runs the source again', () => {
    let fail = true;
    const loader = inCtx(() => createLoader(() => (fail ? throwError(() => ({ code: 'unavailable' })) : of(1))));
    TestBed.tick();
    const s = loader.state();
    expect(s.status).toBe('error');
    expect(s.status === 'error' && s.message).toContain('could not be reached');
    fail = false;
    loader.retry();
    TestBed.tick();
    expect(loader.state()).toEqual({ status: 'ready', value: 1 });
  });
});

describe('describeError', () => {
  it('says what to do for the common failures', () => {
    expect(describeError({ code: 'permission-denied' })).toContain('Sign out');
    expect(describeError({ code: 'failed-precondition' })).toContain('index');
    expect(describeError(new Error('x'))).toContain('Try again');
  });
});
