import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Sends anyone who may not read to the signed-out page. */
export const authGuard: CanActivateFn = async () => {
  // inject() only works before the first await.
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  return auth.canRead() ? true : router.createUrlTree(['/signed-out']);
};
