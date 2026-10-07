import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

async function runGuard(canRead: boolean): Promise<unknown> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AuthService, useValue: { whenReady: async () => undefined, canRead: () => canRead } },
    ],
  });
  return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
}

describe('authGuard', () => {
  it('lets an allowed account through', async () => {
    expect(await runGuard(true)).toBe(true);
  });

  it('sends everyone else to the signed-out page', async () => {
    const result = await runGuard(false);
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/signed-out');
  });
});
