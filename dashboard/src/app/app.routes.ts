import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Overview · Tradebots', canActivate: [authGuard], loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview) },
  { path: 'bots/:id', title: 'Bot report · Tradebots', canActivate: [authGuard], loadComponent: () => import('./pages/bot-report/bot-report').then((m) => m.BotReport) },
  { path: 'signed-out', title: 'Sign in · Tradebots', loadComponent: () => import('./pages/signed-out/signed-out').then((m) => m.SignedOut) },
  // Hidden: not linked from the nav.
  { path: 'styleguide', title: 'Styleguide · Tradebots', loadComponent: () => import('./pages/styleguide/styleguide').then((m) => m.Styleguide) },
  { path: '**', redirectTo: '' },
];
