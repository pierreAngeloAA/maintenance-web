import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_SHARED } from '@shared/core/api-routes';
import { AuthService } from '@shared/core/auth.service';
import { App } from './app';

describe('App (taller)', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  // Los contextos se piden en el constructor, asi que la sesion tiene que
  // existir antes de montar el componente.
  function render(): ComponentFixture<App> {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    return fixture;
  }

  function logIn(): void {
    TestBed.inject(AuthService).login({ email: 'a@b.co', password: 'secreto12' }).subscribe();
    httpMock
      .expectOne(`${API_SHARED}/sessions`)
      .flush({ token: 't', user: { id: 1, email: 'a@b.co', name: null, createdAt: '' } });
  }

  it('se monta y muestra su titulo', () => {
    const fixture = render();

    httpMock.verify();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Taller');
  });

  // La identidad es una sola: sin sesion no se piden contextos ni se muestra el
  // selector, y el guard manda al login.
  it('sin sesion no pide los contextos', () => {
    const fixture = render();

    httpMock.expectNone(`${API_SHARED}/me`);
    expect(fixture.nativeElement.querySelector('app-context-switcher')).toBeNull();
  });

  it('con sesion pide los contextos una vez', () => {
    logIn();

    render();

    httpMock.expectOne(`${API_SHARED}/me`).flush({
      user: {},
      contexts: [{ kind: 'client' }],
      activeContext: { kind: 'client' },
    });
    httpMock.verify();
  });

  // Que /me falle no puede dejar la app en blanco: el selector simplemente no
  // aparece.
  it('si /me falla, la app sigue en pie', () => {
    logIn();

    const fixture = render();

    httpMock.expectOne(`${API_SHARED}/me`).flush('', { status: 500, statusText: 'Server Error' });

    expect(fixture.nativeElement.querySelector('h1')).not.toBeNull();
  });
});
