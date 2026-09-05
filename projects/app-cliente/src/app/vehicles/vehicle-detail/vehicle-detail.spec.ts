import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { VehicleDetail } from './vehicle-detail';
import { Recall, Vehicle } from '../../core/vehicle.model';
import { environment } from '@shared/environments/environment';

describe('VehicleDetail', () => {
  let fixture: ComponentFixture<VehicleDetail>;
  let component: VehicleDetail;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/client`;

  const vehicle: Vehicle = {
    id: 7,
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
    partTypes: [
      { id: 1, code: 'drive_chain', name: 'Cadena de transmision', category: 'transmission', applicableVehicleTypes: ['motorcycle'] },
      { id: 2, code: 'engine_oil', name: 'Aceite de motor', category: 'fluids', applicableVehicleTypes: ['car', 'motorcycle'] },
    ],
  };

  const recall: Recall = {
    campaignNumber: '20V771000',
    manufacturer: 'Honda',
    component: 'ELECTRICAL SYSTEM',
    summary: 'Resumen del recall',
    consequence: 'Consecuencia',
    remedy: 'Solucion',
    reportedOn: '2020-10-12',
    parkIt: false,
    parkOutside: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '7']]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleDetail);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function flushVehicle(overrides: Partial<Vehicle> = {}) {
    httpMock.expectOne(`${baseUrl}/vehicles/7`).flush({ ...vehicle, ...overrides });
  }

  function flushRecalls(recalls: Recall[]) {
    httpMock.expectOne(`${baseUrl}/vehicles/7/recalls`).flush({ vehicleId: 7, recalls });
  }

  /** El tablero de riesgo y el historial son hijos y hacen sus propias peticiones. */
  function flushRisks() {
    httpMock.expectOne(`${baseUrl}/vehicles/7/risks`).flush({ vehicleId: 7, risks: [] });
    httpMock.expectOne(`${baseUrl}/vehicles/7/maintenance_records`).flush([]);
  }

  it('muestra los datos del vehiculo', () => {
    flushVehicle();
    flushRecalls([]);
    fixture.detectChanges();
    flushRisks();

    expect(fixture.nativeElement.textContent).toContain('AKT');
    expect(fixture.nativeElement.textContent).toContain('NKD 125');
    expect(fixture.nativeElement.textContent).toContain('12000');
  });

  it('le pasa la ciudad al tablero de riesgo, que la necesita para explicar el ajuste', () => {
    flushVehicle();
    flushRecalls([]);
    fixture.detectChanges();

    httpMock.expectOne(`${baseUrl}/vehicles/7/risks`).flush({
      vehicleId: 7,
      risks: [
        {
          partType: vehicle.partTypes![0],
          usageSinceService: 12000,
          basis: 'vehicle_total',
          lifeUnit: 'km',
          failureProbability: 0.4,
          conditionalRisk: 0.15,
          horizon: 1000,
          estimate: true,
          contextFactor: 0.9,
        },
      ],
    });
    httpMock.expectOne(`${baseUrl}/vehicles/7/maintenance_records`).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.risk-dashboard__context')?.textContent)
      .toContain('Medellin');
  });

  it('lista las piezas que aplican a este vehiculo', () => {
    flushVehicle();
    flushRecalls([]);
    fixture.detectChanges();
    flushRisks();

    const parts = fixture.nativeElement.querySelectorAll('.vehicle-detail__part');
    expect(parts.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Cadena de transmision');
  });

  it('muestra los recalls activos', () => {
    flushVehicle();
    flushRecalls([recall]);
    fixture.detectChanges();
    flushRisks();

    expect(fixture.nativeElement.querySelectorAll('.vehicle-detail__recall').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('ELECTRICAL SYSTEM');
  });

  it('destaca un recall grave que obliga a no manejar el vehiculo', () => {
    flushVehicle();
    flushRecalls([{ ...recall, parkIt: true }]);
    fixture.detectChanges();
    flushRisks();

    expect(fixture.nativeElement.querySelector('.vehicle-detail__recall--urgent')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No manejes');
  });

  it('dice explicitamente que NHTSA no reporta recalls, sin afirmar que el vehiculo este sano', () => {
    flushVehicle();
    flushRecalls([]);
    fixture.detectChanges();
    flushRisks();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('NHTSA no reporta recalls');
    expect(text).toContain('solo cubre vehiculos');
  });

  it('muestra un error si no se puede cargar el vehiculo', () => {
    httpMock.expectOne(`${baseUrl}/vehicles/7`).flush('', { status: 404, statusText: 'Not Found' });
    httpMock.expectOne(`${baseUrl}/vehicles/7/recalls`).flush({ vehicleId: 7, recalls: [] });
    fixture.detectChanges();

    expect(component.error()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar');
  });

  it('sigue mostrando el vehiculo aunque fallen los recalls', () => {
    flushVehicle();
    httpMock.expectOne(`${baseUrl}/vehicles/7/recalls`).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    flushRisks();

    expect(fixture.nativeElement.textContent).toContain('AKT');
    expect(fixture.nativeElement.textContent).toContain('No pudimos consultar los recalls');
  });
});
