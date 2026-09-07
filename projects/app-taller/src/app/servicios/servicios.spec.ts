import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';

import { API_WORKSHOP } from '../core/api-routes';
import { Servicios } from './servicios';

describe('Servicios', () => {
  let fixture: ComponentFixture<Servicios>;
  let httpMock: HttpTestingController;
  let router: Router;

  const offer = {
    id: 7,
    status: 'offered',
    priceCents: null,
    expiresAt: null,
    request: { id: 1, kind: 'monthly_inspection', scheduledFor: null, address: 'Calle 100', notes: null },
    vehicle: { vehicleType: 'car', make: 'Renault', model: 'Logan', modelYear: 2019 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Servicios],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Servicios);
  });

  function render(offers: unknown[] = [], orders: unknown[] = []): void {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/service_offers`).flush(offers);
    httpMock.expectOne(`${API_WORKSHOP}/service_orders`).flush(orders);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  it('muestra el estado de carga', () => {
    fixture.detectChanges();

    expect(text()).toContain('Cargando servicios');
    httpMock.expectOne(`${API_WORKSHOP}/service_offers`).flush([]);
    httpMock.expectOne(`${API_WORKSHOP}/service_orders`).flush([]);
  });

  it('explica el vacio en vez de dejar la pantalla en blanco', () => {
    render();

    expect(text()).toContain('No hay servicios disponibles');
    expect(text()).toContain('No tienes trabajos abiertos');
  });

  it('muestra el vehiculo de cada oferta', () => {
    render([offer]);

    expect(text()).toContain('Renault Logan 2019');
    expect(text()).toContain('Calle 100');
  });

  it('avisa cuando falla la carga', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/service_offers`)
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar los servicios');
  });

  it('al tomar el servicio lleva a la inspeccion', () => {
    const navigate = spyOn(router, 'navigate');
    render([offer]);

    fixture.nativeElement.querySelectorAll('button')[0].click();
    httpMock.expectOne(`${API_WORKSHOP}/service_offers/7`).flush({ id: 42, status: 'assigned' });

    expect(navigate).toHaveBeenCalledWith(['/inspeccion', 42]);
  });

  // Si otro tecnico gano la carrera, se recarga en vez de dejar en pantalla
  // algo que ya no existe.
  it('si tomar falla, recarga la lista', () => {
    render([offer]);

    fixture.nativeElement.querySelectorAll('button')[0].click();
    httpMock.expectOne(`${API_WORKSHOP}/service_offers/7`)
      .flush({ error: 'already_taken' }, { status: 422, statusText: 'Unprocessable' });

    httpMock.expectOne(`${API_WORKSHOP}/service_offers`).flush([]);
    httpMock.expectOne(`${API_WORKSHOP}/service_orders`).flush([]);
    fixture.detectChanges();

    expect(text()).toContain('No hay servicios disponibles');
  });

  it('pasar de largo quita la oferta de la lista', () => {
    render([offer]);

    fixture.nativeElement.querySelectorAll('button')[1].click();
    httpMock.expectOne(`${API_WORKSHOP}/service_offers/7`).flush(null);
    fixture.detectChanges();

    expect(text()).toContain('No hay servicios disponibles');
  });

  describe('lenguaje de la interfaz', () => {
    const order = {
      id: 3,
      status: 'assigned',
      requestId: 1,
      vehicleId: 9,
      technicianUserId: 5,
      startedAt: null,
      completedAt: null,
      totalCents: null,
    };

    it('traduce el estado del trabajo en vez de mostrar el enum del API', () => {
      render([], [order]);

      expect(text()).toContain('Asignado');
      expect(text()).not.toContain('assigned');
    });

    it('traduce todos los estados que el tecnico puede llegar a ver', () => {
      const esperado: Record<string, string> = {
        assigned: 'Asignado',
        en_route: 'En camino',
        in_progress: 'En proceso',
        canceled: 'Cancelado',
      };

      Object.entries(esperado).forEach(([status, etiqueta]) => {
        expect(fixture.componentInstance.orderStatusLabel(status)).toBe(etiqueta);
      });

      render();
    });

    it('no inventa una traduccion para un estado que no conoce', () => {
      expect(fixture.componentInstance.orderStatusLabel('lo_que_sea')).toBe('lo_que_sea');

      render();
    });

    it('dice que clase de servicio pidio el cliente, no solo la direccion', () => {
      render([{ ...offer, request: { ...offer.request, kind: 'monthly_inspection' } }]);

      expect(text()).toContain('Revision mensual');
    });

    it('traduce tambien una reparacion y una cotizacion', () => {
      expect(fixture.componentInstance.requestKindLabel('repair')).toBe('Reparacion');
      expect(fixture.componentInstance.requestKindLabel('quote')).toBe('Cotizacion');

      render();
    });
  });
});
