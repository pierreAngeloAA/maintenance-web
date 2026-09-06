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

  it('el catalogo y las ventas exigen sesion', () => {
    expect(routes.find((route) => route.path === 'catalogo')?.canActivate?.length).toBe(1);
    expect(routes.find((route) => route.path === 'ventas')?.canActivate?.length).toBe(1);
  });

  it('la raiz lleva al catalogo', () => {
    expect(routes.find((route) => route.path === '')?.redirectTo).toBe('catalogo');
  });

  it('no deja rutas duplicadas', () => {
    expect(new Set(pathsOf()).size).toBe(pathsOf().length);
  });
});
