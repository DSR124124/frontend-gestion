import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../pages/full-pages/auth/services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (!authService.isAdmin()) {
    router.navigate(['/auth/login'], {
      queryParams: { error: 'Acceso denegado. Se requiere rol de administrador.' }
    });
    return false;
  }

  return true;
};

