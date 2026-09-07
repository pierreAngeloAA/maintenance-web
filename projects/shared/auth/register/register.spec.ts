import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Register } from './register';
import { environment } from '@shared/environments/environment';
import { APP_IDENTITY } from '@shared/core/app-identity';
import { AppNavigator } from '@shared/core/app-navigator';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let component: Register;
  let httpMock: HttpTestingController;
  let navigate: jasmine.Spy;
  const url = `${environment.apiUrl}/api/v1/users`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_IDENTITY, useValue: { kind: 'client', home: '/vehicles' } },
        { provide: AppNavigator, useValue: jasmine.createSpyObj('AppNavigator', ['go']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('exige una contrasena de al menos 8 caracteres, igual que el backend', () => {
    component.form.patchValue({ email: 'pierre@example.com', password: 'corta' });
    component.submit();
    fixture.detectChanges();

    httpMock.expectNone(() => true);
    expect(fixture.nativeElement.textContent).toContain('8 caracteres');
  });

  it('crea la cuenta y entra directo', () => {
    component.form.setValue({ email: 'pierre@example.com', password: 'unaClaveSegura1', name: 'Pierre' });

    component.submit();

    const req = httpMock.expectOne(url);
    expect(req.request.body.user.email).toBe('pierre@example.com');
    req.flush(
      { user: { id: 1, email: 'pierre@example.com', name: 'Pierre', createdAt: '' }, token: 't' },
      { status: 201, statusText: 'Created' },
    );

    httpMock.expectOne(`${environment.apiUrl}/api/v1/me`).flush({
      user: { id: 1, email: 'pierre@example.com', name: 'Pierre', createdAt: '' },
      contexts: [{ kind: 'client' }],
      activeContext: { kind: 'client' },
    });

    expect(navigate).toHaveBeenCalledWith('/vehicles');
  });

  it('muestra los errores por campo que devuelve el API', () => {
    component.form.setValue({ email: 'pierre@example.com', password: 'unaClaveSegura1', name: '' });

    component.submit();
    httpMock.expectOne(url).flush(
      { errors: { email: ['has already been taken'] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Correo');
    expect(fixture.nativeElement.textContent).toContain('ya esta registrado');
  });

  it('avisa cuando el servidor no responde', () => {
    component.form.setValue({ email: 'pierre@example.com', password: 'unaClaveSegura1', name: '' });

    component.submit();
    httpMock.expectOne(url).flush('', { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos conectarnos');
  });

  it('ofrece volver al login', () => {
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).not.toBeNull();
  });
});
