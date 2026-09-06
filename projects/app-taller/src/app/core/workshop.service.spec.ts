import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { API_WORKSHOP } from './api-routes';
import { WorkshopService } from './workshop.service';

describe('WorkshopService', () => {
  let service: WorkshopService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkshopService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide las ofertas del taller', () => {
    service.offers().subscribe();

    httpMock.expectOne(`${API_WORKSHOP}/service_offers`).flush([]);
  });

  it('tomar un servicio va por PATCH', () => {
    service.takeOffer(7).subscribe();

    const req = httpMock.expectOne(`${API_WORKSHOP}/service_offers/7`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('pasar de largo va por DELETE', () => {
    service.dismissOffer(7).subscribe();

    const req = httpMock.expectOne(`${API_WORKSHOP}/service_offers/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('abre la visita con el kilometraje del odometro', () => {
    service.openInspection(3, 50000, 9).subscribe();

    const req = httpMock.expectOne(`${API_WORKSHOP}/inspections`);
    expect(req.request.body).toEqual({
      inspection: { vehicleId: 3, usageValue: 50000, serviceOrderId: 9 },
    });
    req.flush({});
  });

  // Cada medicion viaja apenas se toma: el progreso vive en el servidor.
  it('manda una medicion sola', () => {
    service.measure(5, { itemId: 11, numericValue: 4.5 }).subscribe();

    const req = httpMock.expectOne(`${API_WORKSHOP}/inspections/5/observations`);
    expect(req.request.body).toEqual({ observation: { itemId: 11, numericValue: 4.5 } });
    req.flush({});
  });

  it('cierra la visita con las fotos y la ubicacion en un formulario', () => {
    const photo = new File(['x'], 'llanta.jpg', { type: 'image/jpeg' });

    service.closeInspection(5, 4.65, -74.08, [photo]).subscribe();

    const req = httpMock.expectOne(`${API_WORKSHOP}/inspections/5`);
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('inspection[latitude]')).toBe('4.65');
    req.flush({});
  });

  it('sin ubicacion no manda coordenadas vacias', () => {
    service.closeInspection(5, null, null, []).subscribe();

    const req = httpMock.expectOne(`${API_WORKSHOP}/inspections/5`);
    expect((req.request.body as FormData).has('inspection[latitude]')).toBe(false);
    req.flush({});
  });
});
