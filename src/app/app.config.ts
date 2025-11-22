import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { CustomNettalcoPreset } from './config/custom-theme.preset';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

import { routes } from './app.routes';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    MessageService, // MessageService de PrimeNG requerido para Toast
    providePrimeNG({
      theme: {
        preset: CustomNettalcoPreset,
        options: {
          // Prefijo para las variables CSS (por defecto 'p')
          prefix: 'p',
          // Deshabilitar modo oscuro automático - siempre usar modo claro
          darkModeSelector: false,
          // CSS Layer deshabilitado por defecto
          cssLayer: false
        }
      }
    })
  ],
};
