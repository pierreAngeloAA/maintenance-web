import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';
import { environment } from '@shared/environments/environment';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let httpMock: HttpTestingController;
  let navigate: jasmine.Spy;
  const url = `${environment.apiUrl}/api/v1/sessions`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigate');
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

    expect(navigate).toHaveBeenCalledWith(['/vehicles']);
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
});
