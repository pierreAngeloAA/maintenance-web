import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { VehicleService } from './vehicle.service';
import { Vehicle, VehicleInput, VinLookup } from './vehicle.model';
import { environment } from '../../environments/environment';

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1`;

  const motorcycle: Vehicle = {
    id: 1,
    vehicleType: 'motorcycle',
    make: 'AKT',
    model: 'NKD 125',
    modelYear: 2021,
    vin: null,
    plate: 'ABC12D',
    usageValue: '12000.0',
    usageUnit: 'km',
    city: 'Medellin',
    specs: {},
    createdAt: '2026-08-24T19:56:42.968Z',
    updatedAt: '2026-08-24T19:56:42.968Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('list', () => {
    it('pide la lista de vehiculos al API', () => {
      let result: Vehicle[] | undefined;

      service.list().subscribe((vehicles) => (result = vehicles));

      const req = httpMock.expectOne(`${baseUrl}/vehicles`);
      expect(req.request.method).toBe('GET');
      req.flush([motorcycle]);

      expect(result).toEqual([motorcycle]);
    });
  });

  describe('get', () => {
    it('pide un vehiculo por id', () => {
      let result: Vehicle | undefined;

      service.get(1).subscribe((vehicle) => (result = vehicle));

      const req = httpMock.expectOne(`${baseUrl}/vehicles/1`);
      expect(req.request.method).toBe('GET');
      req.flush(motorcycle);

      expect(result?.id).toBe(1);
    });
  });

  describe('create', () => {
    it('envia el vehiculo anidado bajo la llave vehicle', () => {
      const input: VehicleInput = {
        vehicleType: 'motorcycle',
        make: 'AKT',
        model: 'NKD 125',
        modelYear: 2021,
        usageValue: 12000,
        usageUnit: 'km',
      };

      service.create(input).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/vehicles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ vehicle: input });
      req.flush(motorcycle, { status: 201, statusText: 'Created' });
    });
  });

  describe('lookupVin', () => {
    it('consulta el autocompletado por VIN', () => {
      const lookup: VinLookup = {
        vin: 'JH2PC35051M200020',
        found: true,
        make: 'HONDA',
        model: 'CBR600F',
        modelYear: 2001,
        vehicleType: 'motorcycle',
      };
      let result: VinLookup | undefined;

      service.lookupVin('JH2PC35051M200020').subscribe((value) => (result = value));

      const req = httpMock.expectOne(`${baseUrl}/vin_lookups/JH2PC35051M200020`);
      expect(req.request.method).toBe('GET');
      req.flush(lookup);

      expect(result?.vehicleType).toBe('motorcycle');
    });

    it('normaliza el VIN antes de consultar', () => {
      service.lookupVin(' jh2pc35051m200020 ').subscribe();

      httpMock.expectOne(`${baseUrl}/vin_lookups/JH2PC35051M200020`).flush({});
    });

    it('devuelve un resultado vacio si el API falla, sin romper el formulario', () => {
      let result: VinLookup | undefined;

      service.lookupVin('JH2PC35051M200020').subscribe((value) => (result = value));

      httpMock
        .expectOne(`${baseUrl}/vin_lookups/JH2PC35051M200020`)
        .flush('', { status: 500, statusText: 'Server Error' });

      expect(result?.found).toBeFalse();
      expect(result?.make).toBeNull();
    });
  });
});
