import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from '@shared/core/auth.interceptor';
import { APP_IDENTITY } from '@shared/core/app-identity';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Los parametros de ruta llegan como inputs del componente.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // Quien es esta app: su contexto y su primera pantalla util.
    { provide: APP_IDENTITY, useValue: { kind: 'workshop', home: '/servicios' } },
  ],
};
