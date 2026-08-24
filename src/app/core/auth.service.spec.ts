import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1`;
  const authResponse = {
    user: { id: 1, email: 'pierre@example.com', name: 'Pierre', createdAt: '2026-08-24T00:00:00Z' },
    token: 'un-token',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('arranca sin sesion', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.token()).toBeNull();
  });

  it('inicia sesion y guarda usuario y token', () => {
    service.login({ email: 'pierre@example.com', password: 'unaClaveSegura1' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sessions`);
    expect(req.request.body).toEqual({
      session: { email: 'pierre@example.com', password: 'unaClaveSegura1' },
    });
    req.flush(authResponse, { status: 201, statusText: 'Created' });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.token()).toBe('un-token');
    expect(service.user()?.email).toBe('pierre@example.com');
  });

  it('registra al usuario y lo deja con sesion', () => {
    service.register({ email: 'pierre@example.com', password: 'unaClaveSegura1', name: 'Pierre' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/users`);
    expect(req.request.method).toBe('POST');
    req.flush(authResponse, { status: 201, statusText: 'Created' });

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('la sesion sobrevive a recargar la pagina', () => {
    service.login({ email: 'pierre@example.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${baseUrl}/sessions`).flush(authResponse, { status: 201, statusText: 'Created' });

    // Simula recargar: una instancia nueva que lee lo guardado.
    const otraInstancia = TestBed.runInInjectionContext(() => new AuthService());

    expect(otraInstancia.isLoggedIn()).toBeTrue();
    expect(otraInstancia.user()?.email).toBe('pierre@example.com');
  });

  it('cerrar sesion avisa al API y limpia el estado', () => {
    service.login({ email: 'pierre@example.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${baseUrl}/sessions`).flush(authResponse, { status: 201, statusText: 'Created' });

    service.logout().subscribe();
    httpMock.expectOne((req) => req.method === 'DELETE').flush(null, { status: 204, statusText: 'No Content' });

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('maintenance.auth')).toBeNull();
  });

  it('limpia la sesion aunque el API falle al cerrarla', () => {
    service.login({ email: 'pierre@example.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${baseUrl}/sessions`).flush(authResponse, { status: 201, statusText: 'Created' });

    service.logout().subscribe();
    httpMock
      .expectOne((req) => req.method === 'DELETE')
      .flush('', { status: 500, statusText: 'Server Error' });

    expect(service.isLoggedIn()).toBeFalse();
  });

  it('clearSession borra el estado sin llamar al API', () => {
    service.login({ email: 'pierre@example.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${baseUrl}/sessions`).flush(authResponse, { status: 201, statusText: 'Created' });

    service.clearSession();

    expect(service.isLoggedIn()).toBeFalse();
  });

  it('ignora una sesion guardada que quedo corrupta', () => {
    localStorage.setItem('maintenance.auth', 'esto no es json');

    expect(TestBed.runInInjectionContext(() => new AuthService()).isLoggedIn()).toBeFalse();
  });
});
