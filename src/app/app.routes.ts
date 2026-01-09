import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/full-pages/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/full-pages/error/components/error/error.component').then(m => m.ErrorComponent)
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadChildren: () => import('./pages/full-pages/layout/layout.routes').then(m => m.layoutRoutes)
  },
  {
    path: '**',
    redirectTo: '/error?type=404'
  }
];
