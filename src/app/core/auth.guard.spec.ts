import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => localStorage.clear());

  function run() {
    // El guard no usa la ruta ni el estado: se pasan vacios.
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  it('deja pasar cuando hay sesion', () => {
    localStorage.setItem(
      'maintenance.auth',
      JSON.stringify({ token: 't', user: { id: 1, email: 'a@b.com', name: null, createdAt: '' } }),
    );

    expect(TestBed.inject(AuthService).isLoggedIn()).toBeTrue();
    expect(run()).toBeTrue();
  });

  it('manda al login cuando no hay sesion', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    expect(run()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
