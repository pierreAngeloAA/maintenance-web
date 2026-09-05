import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from '@shared/core/auth.interceptor';
import { AuthService } from '@shared/core/auth.service';
import { environment } from '@shared/environments/environment';
import { ContextService } from '@shared/core/context.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  const baseUrl = `${environment.apiUrl}/api/v1`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function iniciarSesion() {
    auth.login({ email: 'pierre@example.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${baseUrl}/sessions`).flush(
      {
        user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '2026-08-24T00:00:00Z' },
        token: 'un-token',
      },
      { status: 201, statusText: 'Created' },
    );
  }

  it('no manda cabecera cuando no hay sesion', () => {
    http.get(`${baseUrl}/client/vehicles`).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/client/vehicles`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('agrega el token a las peticiones cuando hay sesion', () => {
    iniciarSesion();

    http.get(`${baseUrl}/client/vehicles`).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/client/vehicles`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer un-token');
    req.flush([]);
  });

  it('ante un 401 limpia la sesion y manda al login', () => {
    iniciarSesion();
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    http.get(`${baseUrl}/client/vehicles`).subscribe({ error: () => undefined });
    httpMock.expectOne(`${baseUrl}/client/vehicles`).flush('', { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('no toca la sesion ante otros errores', () => {
    iniciarSesion();

    http.get(`${baseUrl}/client/vehicles`).subscribe({ error: () => undefined });
    httpMock.expectOne(`${baseUrl}/client/vehicles`).flush('', { status: 500, statusText: 'Server Error' });

    expect(auth.isLoggedIn()).toBeTrue();
  });

  it('un 401 al iniciar sesion no manda al login: ya esta ahi', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    auth.login({ email: 'pierre@example.com', password: 'mala' }).subscribe({ error: () => undefined });
    httpMock
      .expectOne(`${baseUrl}/sessions`)
      .flush({ error: 'invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });

  // El token dice quien eres; este header, en nombre de quien actuas. Sin
  // contexto de organizacion la persona actua como cliente y no se manda.
  describe('X-Organization-Id', () => {
    it('no se manda cuando actua como cliente', () => {
      http.get(`${baseUrl}/client/vehicles`).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/client/vehicles`);

      expect(req.request.headers.has('X-Organization-Id')).toBe(false);
      req.flush([]);
    });

    it('viaja en cada peticion cuando hay una organizacion activa', () => {
      TestBed.inject(ContextService).select({ kind: 'workshop', organizationId: 12 });

      http.get(`${baseUrl}/client/vehicles`).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/client/vehicles`);

      expect(req.request.headers.get('X-Organization-Id')).toBe('12');
      req.flush([]);
    });
  });
});
