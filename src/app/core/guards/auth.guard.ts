import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../pages/full-pages/auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Normalizar la URL para evitar problemas con baseHref
  // Remover el baseHref si está presente (ej: /sistema-gestion/)
  let currentUrl = state.url;
  if (currentUrl.startsWith('/sistema-gestion/')) {
    currentUrl = currentUrl.replace('/sistema-gestion', '');
  }
  currentUrl = currentUrl.replace(/^\/+/, '').replace(/\/+$/, '');

  // Verificar si es una ruta de auth o error (no deben tener guard)
  const isAuthRoute = currentUrl.startsWith('auth') || currentUrl === 'auth';
  const isErrorRoute = currentUrl.startsWith('error') || currentUrl === 'error';

  // Si estamos intentando acceder a auth o error, permitir sin verificación
  if (isAuthRoute || isErrorRoute) {
    return true;
  }

  // Verificar autenticación
  if (!authService.isAuthenticated()) {
    // Solo redirigir si no estamos ya en login para evitar loops
    if (!currentUrl.includes('login')) {
      router.navigate(['/auth/login'], { replaceUrl: true });
    }
    return false;
  }

  return true;
};

