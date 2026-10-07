import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [authGuard], loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview) },
  { path: 'bots/:id', canActivate: [authGuard], loadComponent: () => import('./pages/bot-report/bot-report').then((m) => m.BotReport) },
  { path: 'signed-out', loadComponent: () => import('./pages/signed-out/signed-out').then((m) => m.SignedOut) },
  // Hidden: not linked from the nav.
  { path: 'styleguide', loadComponent: () => import('./pages/styleguide/styleguide').then((m) => m.Styleguide) },
  { path: '**', redirectTo: '' },
];
