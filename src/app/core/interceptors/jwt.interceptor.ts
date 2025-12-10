import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../pages/full-pages/auth/services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Excluir el endpoint de login del interceptor
  if (req.url.includes('/api/auth/login')) {
    // Aún así, enviar con credenciales
    req = req.clone({
      withCredentials: true
    });
    return next(req);
  }
  
  const token = authService.getToken();

  if (token && token.trim() !== '') {
    // Clonar la request y agregar el header Authorization
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token.trim()}`
      },
      withCredentials: true
    });
    
    // Log para debugging (solo en desarrollo)
    if (!req.url.includes('/api/auth/')) {
      console.log(`[JWT Interceptor] Enviando petición ${req.method} a ${req.url} con token`);
    }
    
    return next(clonedReq);
  } else {
    // No hay token - log warning y continuar sin token
    console.warn(`[JWT Interceptor] No se encontró token para la petición ${req.method} a ${req.url}`);
    req = req.clone({
      withCredentials: true
    });
    return next(req);
  }
};

