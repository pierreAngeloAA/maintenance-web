import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { MaintenanceHistory } from './maintenance-history';
import { MaintenanceRecord } from '../../core/vehicle.model';
import { environment } from '../../../environments/environment';

describe('MaintenanceHistory', () => {
  let fixture: ComponentFixture<MaintenanceHistory>;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/api/v1/vehicles/7/maintenance_records`;

  const record = (overrides: Partial<MaintenanceRecord> = {}): MaintenanceRecord => ({
    id: 1,
    vehicleId: 7,
    partType: {
      id: 1,
      code: 'drive_chain',
      name: 'Cadena de transmision',
      category: 'transmission',
      applicableVehicleTypes: ['motorcycle'],
    },
    performedOn: '2026-07-15',
    usageAtService: '12000.0',
    partBrand: 'DID',
    costCents: 18000000,
    currency: 'COP',
    notes: null,
    createdAt: '2026-07-15T10:00:00.000Z',
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceHistory],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceHistory);
    fixture.componentRef.setInput('vehicleId', 7);
    fixture.componentRef.setInput('usageUnit', 'km');
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('muestra el estado de carga', () => {
    expect(fixture.nativeElement.textContent).toContain('Cargando');

    httpMock.expectOne(url).flush([]);
  });

  it('arma una fila por mantenimiento', () => {
    httpMock.expectOne(url).flush([record(), record({ id: 2 })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.maintenance-history__row').length).toBe(2);
  });

  it('muestra pieza, fecha, uso con su unidad y marca del repuesto', () => {
    httpMock.expectOne(url).flush([record()]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cadena de transmision');
    expect(text).toContain('2026-07-15');
    expect(text).toContain('12000');
    expect(text).toContain('km');
    expect(text).toContain('DID');
  });

  it('no muestra la marca cuando el usuario no la registro', () => {
    httpMock.expectOne(url).flush([record({ partBrand: null })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.maintenance-history__brand')).toBeNull();
  });

  it('el estado vacio explica para que sirve registrar el historial', () => {
    httpMock.expectOne(url).flush([]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Todavia no has registrado');
    expect(text).toContain('mas preciso');
  });

  it('muestra un error si falla la carga', () => {
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el historial');
  });
});
