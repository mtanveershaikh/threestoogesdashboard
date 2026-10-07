import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Sends anyone who may not read to the signed-out page. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.whenReady();
  return auth.canRead() ? true : inject(Router).createUrlTree(['/signed-out']);
};
