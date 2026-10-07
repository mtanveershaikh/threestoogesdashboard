import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Overview · The Three Stooges', canActivate: [authGuard], loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview) },
  { path: 'trades', title: 'Trades · The Three Stooges', canActivate: [authGuard], loadComponent: () => import('./pages/trades/trades').then((m) => m.Trades) },
  { path: 'bots/:id', title: 'Bot report · The Three Stooges', canActivate: [authGuard], loadComponent: () => import('./pages/bot-report/bot-report').then((m) => m.BotReport) },
  { path: 'signed-out', title: 'Sign in · The Three Stooges', loadComponent: () => import('./pages/signed-out/signed-out').then((m) => m.SignedOut) },
  // Hidden: not linked from the nav.
  { path: 'styleguide', title: 'Styleguide · The Three Stooges', loadComponent: () => import('./pages/styleguide/styleguide').then((m) => m.Styleguide) },
  { path: '**', redirectTo: '' },
];
