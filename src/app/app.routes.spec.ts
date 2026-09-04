import { routes } from './app.routes';

describe('rutas de la app', () => {
  const paths = routes.map((route) => route.path);

  it('lleva la raiz al listado de vehiculos', () => {
    expect(routes[0]).toEqual(jasmine.objectContaining({ path: '', redirectTo: 'vehicles' }));
  });

  it('define listado, registro y detalle', () => {
    expect(paths).toContain('vehicles');
    expect(paths).toContain('vehicles/new');
    expect(paths).toContain('vehicles/:id');
  });

  it('deja publicas las rutas de login y registro', () => {
    const publicas = routes.filter((route) => ['login', 'register'].includes(route.path ?? ''));

    expect(publicas.length).toBe(2);
    expect(publicas.every((route) => route.canActivate === undefined)).toBeTrue();
  });

  it('protege todas las rutas de vehiculos con el guard', () => {
    const protegidas = routes.filter((route) => route.path?.startsWith('vehicles'));

    expect(protegidas.length).toBeGreaterThan(0);
    expect(protegidas.every((route) => route.canActivate?.length)).toBeTrue();
  });

  it('define la ruta para registrar un mantenimiento', () => {
    expect(paths).toContain('vehicles/:id/maintenance/new');
  });

  it('declara vehicles/new antes que vehicles/:id, si no el formulario nunca se abre', () => {
    expect(paths.indexOf('vehicles/new')).toBeLessThan(paths.indexOf('vehicles/:id'));
  });
});
