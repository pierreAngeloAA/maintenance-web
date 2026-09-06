import { routes } from './app.routes';

describe('rutas', () => {
  function pathsOf(): string[] {
    return routes.map((route) => route.path ?? '');
  }

  it('login y registro son publicas: se entra por cualquiera de las tres apps', () => {
    const login = routes.find((route) => route.path === 'login');
    const register = routes.find((route) => route.path === 'register');

    expect(login?.canActivate).toBeUndefined();
    expect(register?.canActivate).toBeUndefined();
  });

  it('las pantallas de trabajo exigen sesion', () => {
    expect(routes.find((route) => route.path === 'servicios')?.canActivate?.length).toBe(1);
    expect(routes.find((route) => route.path === 'inspeccion/:orderId')?.canActivate?.length)
      .toBe(1);
  });

  it('la raiz lleva a los servicios', () => {
    expect(routes.find((route) => route.path === '')?.redirectTo).toBe('servicios');
  });

  it('no deja rutas duplicadas', () => {
    expect(new Set(pathsOf()).size).toBe(pathsOf().length);
  });
});
