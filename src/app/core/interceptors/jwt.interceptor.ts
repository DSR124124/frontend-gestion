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
    
    return next(clonedReq);
  } else {
    // No hay token - continuar sin token
    req = req.clone({
      withCredentials: true
    });
    return next(req);
  }
};

