import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { VehicleList } from './vehicle-list';
import { Vehicle } from '../../core/vehicle.model';
import { environment } from '../../../environments/environment';

describe('VehicleList', () => {
  let fixture: ComponentFixture<VehicleList>;
  let component: VehicleList;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/api/v1/client/vehicles`;

  const vehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
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
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleList);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('muestra el estado de carga mientras espera al API', () => {
    expect(component.loading()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Cargando');

    httpMock.expectOne(url).flush([]);
  });

  it('lista los vehiculos que devuelve el API', () => {
    httpMock.expectOne(url).flush([vehicle(), vehicle({ id: 2, vehicleType: 'car', make: 'Renault', model: 'Logan' })]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.vehicle-list__item');
    expect(items.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('AKT');
    expect(fixture.nativeElement.textContent).toContain('Renault');
  });

  it('distingue autos de motos con una etiqueta en espanol', () => {
    httpMock.expectOne(url).flush([vehicle(), vehicle({ id: 2, vehicleType: 'car' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Motocicleta');
    expect(fixture.nativeElement.textContent).toContain('Automovil');
  });

  it('muestra el kilometraje con su unidad', () => {
    httpMock.expectOne(url).flush([vehicle()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('12000');
    expect(fixture.nativeElement.textContent).toContain('km');
  });

  it('muestra un estado vacio cuando el usuario no tiene vehiculos', () => {
    httpMock.expectOne(url).flush([]);
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Todavia no tienes vehiculos');
  });

  it('muestra un mensaje de error cuando el API falla', () => {
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar');
  });

  it('permite reintentar despues de un error', () => {
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    component.reload();

    expect(component.error()).toBeFalse();
    httpMock.expectOne(url).flush([vehicle()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.vehicle-list__item').length).toBe(1);
  });
});
