import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/full-pages/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadChildren: () => import('./pages/full-pages/layout/layout.routes').then(m => m.layoutRoutes)
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
