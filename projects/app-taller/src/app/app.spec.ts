import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_SHARED } from '@shared/core/api-routes';
import { AuthService } from '@shared/core/auth.service';
import { APP_IDENTITY } from '@shared/core/app-identity';
import { App } from './app';

describe('App (taller)', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: APP_IDENTITY, useValue: { kind: 'workshop', home: '/servicios' } },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
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

  describe('navegacion', () => {
    it('lleva a los servicios, que es la casa del taller', () => {
      logIn();
      const fixture = render();
      httpMock.expectOne(`${API_SHARED}/me`).flush({
        user: { id: 1, email: 'tecnico@taller.co', name: 'Andres', createdAt: '' },
        contexts: [{ kind: 'workshop', organizationId: 1, name: 'Taller La 80' }],
        activeContext: { kind: 'workshop', organizationId: 1 },
      });
      fixture.detectChanges();

      const enlace = fixture.nativeElement.querySelector('a[href="/servicios"]');

      expect(enlace).not.toBeNull();
      expect(enlace.textContent).toContain('Servicios');
    });

    it('no muestra la navegacion a quien no ha entrado', () => {
      const fixture = render();

      expect(fixture.nativeElement.querySelector('.app-nav')).toBeNull();
    });

    it('dice quien esta trabajando: el tecnico tiene que poder verificarlo', () => {
      logIn();
      const fixture = render();
      httpMock.expectOne(`${API_SHARED}/me`).flush({
        user: { id: 1, email: 'tecnico@taller.co', name: 'Andres', createdAt: '' },
        contexts: [{ kind: 'workshop', organizationId: 1, name: 'Taller La 80' }],
        activeContext: { kind: 'workshop', organizationId: 1 },
      });
      fixture.detectChanges();

      // El correo sale de la sesion, no de /me: es el dato que la persona uso
      // para entrar, y es lo que le permite verificar con que cuenta trabaja.
      expect(fixture.nativeElement.querySelector('.app-header__usuario').textContent)
        .toContain('a@b.co');
    });
  });

  describe('pie de pagina', () => {
    it('enlaza el codigo de los dos repos: el proyecto es abierto', () => {
      const fixture = render();
      const enlaces = fixture.nativeElement.querySelectorAll('.app-footer__links a');

      expect(enlaces.length).toBe(2);
    });

    it('muestra el ano en curso', () => {
      const fixture = render();

      expect(fixture.nativeElement.querySelector('.app-footer').textContent)
        .toContain(String(new Date().getFullYear()));
    });

    it('recuerda que lo que se mide queda en el historial del cliente', () => {
      const fixture = render();

      expect(fixture.nativeElement.querySelector('.app-footer__aviso').textContent)
        .toContain('historial');
    });
  });
});
