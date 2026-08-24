import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser, Credentials, RegistrationInput } from './auth.model';

const STORAGE_KEY = 'maintenance.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1`;

  private readonly session = signal<AuthResponse | null>(readStoredSession());

  readonly user = computed<AuthUser | null>(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  token(): string | null {
    return this.session()?.token ?? null;
  }

  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/sessions`, { session: credentials })
      .pipe(tap((response) => this.store(response)));
  }

  register(input: RegistrationInput): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users`, { user: input })
      .pipe(tap((response) => this.store(response)));
  }

  /**
   * Cierra la sesion en el API, pero limpia el estado local pase lo que pase:
   * si el API falla, dejar al usuario "adentro" con un token que no sirve es
   * peor que sacarlo.
   */
  logout(): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/sessions`).pipe(
      catchError(() => of(null)),
      tap(() => this.clearSession()),
    );
  }

  /** Usado tambien cuando el API responde 401: el token ya no sirve. */
  clearSession(): void {
    this.session.set(null);
    safeRemove();
  }

  private store(response: AuthResponse): void {
    this.session.set(response);
    safeWrite(response);
  }
}

function readStoredSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    // Sesion corrupta o almacenamiento bloqueado: se arranca sin sesion.
    return null;
  }
}

function safeWrite(response: AuthResponse): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
  } catch {
    // Sin almacenamiento la sesion dura lo que dure la pestana.
  }
}

function safeRemove(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que hacer.
  }
}
