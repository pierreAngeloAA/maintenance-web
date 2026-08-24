import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/** Peticiones de entrada a la sesion: un 401 ahi es credenciales malas, no sesion vencida. */
const AUTH_ENDPOINTS = /\/api\/v1\/(sessions|users)$/;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 fuera del login significa que el token dejo de servir.
      if (error.status === 401 && !AUTH_ENDPOINTS.test(request.url)) {
        auth.clearSession();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
