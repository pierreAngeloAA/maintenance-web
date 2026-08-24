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

  it('declara vehicles/new antes que vehicles/:id, si no el formulario nunca se abre', () => {
    expect(paths.indexOf('vehicles/new')).toBeLessThan(paths.indexOf('vehicles/:id'));
  });
});
