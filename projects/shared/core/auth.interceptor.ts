import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '@shared/core/auth.service';
import { ContextService } from '@shared/core/context.service';

/** Peticiones de entrada a la sesion: un 401 ahi es credenciales malas, no sesion vencida. */
const AUTH_ENDPOINTS = /\/api\/v1\/(sessions|users)$/;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const context = inject(ContextService);
  const router = inject(Router);
  const token = auth.token();

  // El token dice quien eres; el header de organizacion, en nombre de quien
  // actuas. Sin organizacion activa la persona actua como cliente y no se manda.
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const organizationId = context.organizationId();

  if (organizationId !== null) {
    headers['X-Organization-Id'] = String(organizationId);
  }

  const authorized = Object.keys(headers).length ? request.clone({ setHeaders: headers }) : request;

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 fuera del login significa que el token dejo de servir.
      if (error.status === 401 && !AUTH_ENDPOINTS.test(request.url)) {
        auth.clearSession();
        context.clear();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
