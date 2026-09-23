import { Routes } from '@angular/router';
import { hasChildNameGuard } from './core/has-child-name.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/welcome/welcome').then((m) => m.Welcome),
  },
  {
    path: 'start',
    canActivate: [hasChildNameGuard],
    loadComponent: () => import('./features/start/start').then((m) => m.Start),
  },
  {
    path: 'play',
    canActivate: [hasChildNameGuard],
    loadComponent: () => import('./features/play/play').then((m) => m.Play),
  },
  { path: '**', redirectTo: '' },
];
