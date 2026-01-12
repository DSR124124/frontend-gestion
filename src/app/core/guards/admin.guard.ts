import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../pages/full-pages/auth/services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Normalizar la URL removiendo el baseHref si está presente
  let normalizedUrl = state.url;
  normalizedUrl = normalizedUrl.replace(/^\/sistema-gestion/, '');
  normalizedUrl = normalizedUrl.replace(/^\/+/, '').replace(/\/+$/, '');

  // Verificar si es una ruta de auth o error - estas NO deben tener guard
  // Si el guard se ejecuta para estas rutas por error, permitir acceso
  const isAuthRoute = normalizedUrl.startsWith('auth') || normalizedUrl === 'auth' || normalizedUrl.startsWith('auth/');
  const isErrorRoute = normalizedUrl.startsWith('error') || normalizedUrl === 'error';

  if (isAuthRoute || isErrorRoute) {
    // Si estamos en auth o error, permitir acceso (no debería ejecutarse aquí normalmente)
    return true;
  }

  // Verificar autenticación
  if (!authService.isAuthenticated()) {
    // Solo redirigir si no estamos ya en login
    const targetUrl = '/auth/login';
    const isAlreadyOnLogin = state.url.includes(targetUrl) || normalizedUrl.includes('login');

    if (!isAlreadyOnLogin) {
      router.navigate([targetUrl], { replaceUrl: true });
    }
    return false;
  }

  // Verificar si es administrador
  if (!authService.isAdmin()) {
    // Solo redirigir si no estamos ya en login
    const targetUrl = '/auth/login';
    const isAlreadyOnLogin = state.url.includes(targetUrl) || normalizedUrl.includes('login');

    if (!isAlreadyOnLogin) {
      router.navigate([targetUrl], {
        queryParams: { error: 'Acceso denegado. Se requiere rol de administrador.' },
        replaceUrl: true
      });
    }
    return false;
  }

  return true;
};

