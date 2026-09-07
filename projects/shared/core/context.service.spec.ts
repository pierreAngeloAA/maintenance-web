import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { API_SHARED } from './api-routes';
import { ActorContext } from './context.model';
import { ContextService } from './context.service';

describe('ContextService', () => {
  let service: ContextService;
  let httpMock: HttpTestingController;

  const workshop: ActorContext = {
    kind: 'workshop',
    organizationId: 12,
    name: 'Taller El Rayo',
    role: 'owner',
  };
  const client: ActorContext = { kind: 'client' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContextService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function loadWith(contexts: ActorContext[]): void {
    service.load().subscribe();
    httpMock
      .expectOne(`${API_SHARED}/me`)
      .flush({ user: {}, contexts, activeContext: contexts[0] });
  }

  it('sin contexto activo actua como cliente y no manda organizacion', () => {
    expect(service.organizationId()).toBeNull();
  });

  it('con un solo contexto entra directo, sin preguntar', () => {
    loadWith([client]);

    expect(service.active()).toEqual(client);
    expect(service.mustChoose()).toBe(false);
  });

  it('con dos o mas hay que elegir', () => {
    loadWith([client, workshop]);

    expect(service.mustChoose()).toBe(true);
  });

  it('recuerda el contexto elegido', () => {
    service.select(workshop);

    expect(service.organizationId()).toBe(12);
    expect(TestBed.inject(ContextService).active()).toEqual(workshop);
  });

  // Si le revocaron la membresia, seguir mandando ese header daria 403 en cada
  // peticion: es mejor volver al contexto de cliente.
  it('descarta el contexto guardado si ya no esta disponible', () => {
    service.select(workshop);

    loadWith([client, { kind: 'store', organizationId: 30 }]);

    expect(service.active()).toBeNull();
  });

  it('conserva el contexto guardado si sigue disponible', () => {
    service.select(workshop);

    loadWith([client, workshop]);

    expect(service.active()).toEqual(workshop);
  });

  it('sabe a que ruta lleva cada contexto', () => {
    expect(service.pathFor(workshop)).toBe('/taller');
    expect(service.pathFor(client)).toBe('/cliente');
    expect(service.pathFor({ kind: 'store' })).toBe('/almacen');
  });

  it('limpia el contexto al cerrar sesion', () => {
    service.select(workshop);

    service.clear();

    expect(service.active()).toBeNull();
    expect(service.organizationId()).toBeNull();
  });

  describe('adopt', () => {
    it('activa el contexto de la app cuando la persona lo tiene', () => {
      service.contexts.set([{ kind: 'client' }, workshop]);

      expect(service.adopt('workshop')).toBeTrue();
      expect(service.active()).toEqual(workshop);
    });

    it('no activa nada cuando la persona no tiene ese rol', () => {
      service.contexts.set([{ kind: 'client' }]);

      expect(service.adopt('workshop')).toBeFalse();
      expect(service.active()).toBeNull();
    });

    it('deja el contexto guardado para que sobreviva a la recarga', () => {
      service.contexts.set([workshop]);
      service.adopt('workshop');

      expect(localStorage.getItem('maintenance.context')).toContain('workshop');
    });
  });
});
