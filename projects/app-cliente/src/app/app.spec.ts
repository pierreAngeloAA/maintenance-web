import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { AuthService } from '@shared/core/auth.service';

describe('App', () => {
  function iniciarSesion() {
    localStorage.setItem(
      'maintenance.auth',
      JSON.stringify({
        token: 't',
        user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '' },
      }),
    );
  }

  afterEach(() => localStorage.clear());

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('crea el componente raiz', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el nombre de la aplicacion en el encabezado', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Maintenance');
  });

  it('sin sesion la navegacion ofrece entrar o crear cuenta', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('.app-nav a')).map((link) =>
      (link as HTMLElement).textContent?.trim(),
    );

    expect(links).toContain('Iniciar sesion');
    expect(links).toContain('Crear cuenta');
    expect(links).not.toContain('Mis vehiculos');
  });

  it('con sesion muestra los accesos, el correo y el boton de salir', () => {
    iniciarSesion();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('.app-nav') as HTMLElement;

    expect(nav.textContent).toContain('Mis vehiculos');
    expect(nav.textContent).toContain('Registrar vehiculo');
    expect(nav.textContent).toContain('pierre@example.com');
    expect(nav.querySelector('.app-nav__salir')).not.toBeNull();
  });

  it('salir cierra la sesion y deja la navegacion de visitante', () => {
    iniciarSesion();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-nav__salir') as HTMLButtonElement).click();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.method === 'DELETE')
      .flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).isLoggedIn()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.app-nav')?.textContent).toContain('Iniciar sesion');
  });

  it('tiene pie de pagina con la marca y el anio', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.app-footer') as HTMLElement;

    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain('Maintenance');
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
  });

  it('el pie enlaza a los dos repos, porque el proyecto es open source', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('.app-footer a')).map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );

    expect(hrefs).toContain('https://github.com/pierreAngeloAA/maintenance-api');
    expect(hrefs).toContain('https://github.com/pierreAngeloAA/maintenance-web');
  });

  it('el pie aclara que las probabilidades son estimaciones y no reemplazan a un mecanico', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.app-footer') as HTMLElement;

    expect(footer.textContent).toContain('estimaciones');
    expect(footer.textContent).toContain('mecanico');
  });

  it('deja un router-outlet para las rutas de la app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
