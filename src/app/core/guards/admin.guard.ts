import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../pages/full-pages/auth/services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Evitar loop de redirección: si ya estamos en login, no redirigir
  if (state.url.includes('/auth/login')) {
    return false;
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { replaceUrl: true });
    return false;
  }

  if (!authService.isAdmin()) {
    router.navigate(['/auth/login'], {
      queryParams: { error: 'Acceso denegado. Se requiere rol de administrador.' },
      replaceUrl: true
    });
    return false;
  }

  return true;
};

