import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';
import { environment } from '@shared/environments/environment';
import { APP_IDENTITY } from '@shared/core/app-identity';
import { AppNavigator } from '@shared/core/app-navigator';
import { ContextService } from '@shared/core/context.service';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let httpMock: HttpTestingController;
  let navigate: jasmine.Spy;
  let navigator: jasmine.SpyObj<AppNavigator>;
  const url = `${environment.apiUrl}/api/v1/sessions`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_IDENTITY, useValue: { kind: 'client', home: '/vehicles' } },
        { provide: AppNavigator, useValue: jasmine.createSpyObj('AppNavigator', ['go']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
    navigator = TestBed.inject(AppNavigator) as jasmine.SpyObj<AppNavigator>;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('arranca invalido pero con el boton habilitado', () => {
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(component.form.invalid).toBeTrue();
    expect(button.disabled).toBeFalse();
  });

  it('al enviar vacio dice que falta', () => {
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.auth-form__error').length).toBeGreaterThan(0);
    httpMock.expectNone(() => true);
  });

  it('inicia sesion y entra a mis vehiculos', () => {
    component.form.setValue({ email: 'pierre@example.com', password: 'unaClaveSegura1' });

    component.submit();

    const req = httpMock.expectOne(url);
    expect(req.request.body).toEqual({
      session: { email: 'pierre@example.com', password: 'unaClaveSegura1' },
    });
    req.flush(
      { user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '' }, token: 't' },
      { status: 201, statusText: 'Created' },
    );

    // Entrar ya no es solo autenticarse: hay que saber en nombre de quien se actua.
    httpMock.expectOne(`${environment.apiUrl}/api/v1/me`).flush({
      user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '' },
      contexts: [{ kind: 'client' }],
      activeContext: { kind: 'client' },
    });

    expect(navigate).toHaveBeenCalledWith('/vehicles');
  });

  it('avisa cuando las credenciales no sirven, sin decir cual fallo', () => {
    component.form.setValue({ email: 'pierre@example.com', password: 'mala' });

    component.submit();
    httpMock
      .expectOne(url)
      .flush({ error: 'invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Correo o contrasena incorrectos');
  });

  it('avisa cuando el servidor no responde', () => {
    component.form.setValue({ email: 'pierre@example.com', password: 'x' });

    component.submit();
    httpMock.expectOne(url).flush('', { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos conectarnos');
  });

  it('ofrece ir a crear una cuenta', () => {
    const link = fixture.nativeElement.querySelector('a[href="/register"]');

    expect(link).not.toBeNull();
  });

  describe('a donde entra cada app', () => {
    function entrar(contexts: unknown[]): void {
      component.form.setValue({ email: 'pierre@example.com', password: 'unaClaveSegura1' });
      component.submit();
      httpMock.expectOne(url).flush(
        { user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '' }, token: 't' },
        { status: 201, statusText: 'Created' },
      );
      httpMock.expectOne(`${environment.apiUrl}/api/v1/me`).flush({
        user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '' },
        contexts,
        activeContext: { kind: 'client' },
      });
    }

    it('entra a la casa de la app, no a una ruta que quiza no exista', () => {
      TestBed.resetTestingModule();
      // Se reconfigura como si fuera la app del taller: su casa no es /vehicles.
      TestBed.configureTestingModule({
        imports: [Login],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: APP_IDENTITY, useValue: { kind: 'workshop', home: '/servicios' } },
          { provide: AppNavigator, useValue: jasmine.createSpyObj('AppNavigator', ['go']) },
        ],
      });
      fixture = TestBed.createComponent(Login);
      component = fixture.componentInstance;
      httpMock = TestBed.inject(HttpTestingController);
      navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
      fixture.detectChanges();

      entrar([{ kind: 'client' }, { kind: 'workshop', organizationId: 3, name: 'Taller La 80' }]);

      expect(navigate).toHaveBeenCalledWith('/servicios');
    });

    it('deja activo el contexto de la app: entrar por el taller es venir a trabajar', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Login],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: APP_IDENTITY, useValue: { kind: 'workshop', home: '/servicios' } },
          { provide: AppNavigator, useValue: jasmine.createSpyObj('AppNavigator', ['go']) },
        ],
      });
      fixture = TestBed.createComponent(Login);
      component = fixture.componentInstance;
      httpMock = TestBed.inject(HttpTestingController);
      spyOn(TestBed.inject(Router), 'navigateByUrl');
      fixture.detectChanges();

      entrar([{ kind: 'client' }, { kind: 'workshop', organizationId: 3, name: 'Taller La 80' }]);

      expect(TestBed.inject(ContextService).active()).toEqual(
        jasmine.objectContaining({ kind: 'workshop', organizationId: 3 }),
      );
    });

    it('no deja a nadie encerrado en una app que no le corresponde', () => {
      const navigator = jasmine.createSpyObj('AppNavigator', ['go']);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Login],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: APP_IDENTITY, useValue: { kind: 'workshop', home: '/servicios' } },
          { provide: AppNavigator, useValue: navigator },
        ],
      });
      fixture = TestBed.createComponent(Login);
      component = fixture.componentInstance;
      httpMock = TestBed.inject(HttpTestingController);
      navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
      fixture.detectChanges();

      // Un cliente sin taller que entra por la puerta del taller.
      entrar([{ kind: 'client' }]);

      expect(navigate).not.toHaveBeenCalled();
      expect(navigator.go).toHaveBeenCalledWith(environment.appUrls.client);
    });

    it('si /me falla no deja a la persona parada en el login', () => {
      component.form.setValue({ email: 'pierre@example.com', password: 'unaClaveSegura1' });
      component.submit();
      httpMock.expectOne(url).flush(
        { user: { id: 1, email: 'pierre@example.com', name: null, createdAt: '' }, token: 't' },
        { status: 201, statusText: 'Created' },
      );
      httpMock
        .expectOne(`${environment.apiUrl}/api/v1/me`)
        .flush('', { status: 500, statusText: 'Server Error' });

      // Sin contextos no puede adoptar ninguno, asi que sale a su app en vez
      // de quedarse en el login como si no hubiera pasado nada.
      expect(navigate).not.toHaveBeenCalled();
      expect(navigator.go).toHaveBeenCalledWith(environment.appUrls.client);
    });
  });
});
