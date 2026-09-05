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

  it('el inicio exige sesion', () => {
    expect(routes.find((route) => route.path === 'inicio')?.canActivate?.length).toBe(1);
  });

  it('la raiz redirige al inicio', () => {
    expect(routes.find((route) => route.path === '')?.redirectTo).toBe('inicio');
  });

  it('no deja rutas duplicadas', () => {
    expect(new Set(pathsOf()).size).toBe(pathsOf().length);
  });
});
