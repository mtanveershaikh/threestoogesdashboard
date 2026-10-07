import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview) },
  { path: 'bots/:id', loadComponent: () => import('./pages/bot-report/bot-report').then((m) => m.BotReport) },
  // Hidden: not linked from the nav.
  { path: 'styleguide', loadComponent: () => import('./pages/styleguide/styleguide').then((m) => m.Styleguide) },
  { path: '**', redirectTo: '' },
];
