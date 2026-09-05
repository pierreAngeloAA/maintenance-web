import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MaintenanceService } from './maintenance.service';
import { MaintenanceRecordInput } from './vehicle.model';
import { environment } from '../../environments/environment';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/api/v1/client/vehicles/7/maintenance_records`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MaintenanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide el historial del vehiculo', () => {
    service.list(7).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('envia el registro anidado bajo maintenanceRecord', () => {
    const input: MaintenanceRecordInput = {
      partTypeId: 3,
      performedOn: '2026-07-15',
      usageAtService: 12000,
      partBrand: 'DID',
    };

    service.create(7, input).subscribe();

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ maintenanceRecord: input });
    req.flush({}, { status: 201, statusText: 'Created' });
  });
});
