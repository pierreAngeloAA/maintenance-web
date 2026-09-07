import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_WORKSHOP } from '../core/api-routes';
import { Vehiculos } from './vehiculos';

describe('Vehiculos', () => {
  let fixture: ComponentFixture<Vehiculos>;
  let httpMock: HttpTestingController;

  const moto = {
    id: 11,
    vehicleType: 'motorcycle',
    make: 'AKT',
    model: 'NKD 125',
    modelYear: 2021,
    vin: null,
    plate: 'XYZ01A',
    usageValue: '18000.0',
    usageUnit: 'km',
    city: 'Bogota',
    soatExpiresOn: null,
    technicalInspectionExpiresOn: null,
    runtCheckedAt: null,
    createdAt: '2026-09-04T22:56:45.918Z',
    updatedAt: '2026-09-04T22:56:45.918Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehiculos],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Vehiculos);
  });

  afterEach(() => httpMock.verify());

  function render(vehicles: unknown[]): void {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/vehicles`).flush(vehicles);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  it('muestra el estado de carga', () => {
    fixture.detectChanges();

    expect(text()).toContain('Cargando');
    httpMock.expectOne(`${API_WORKSHOP}/vehicles`).flush([]);
  });

  it('lista los vehiculos que entraron al taller', () => {
    render([moto]);

    expect(fixture.nativeElement.querySelectorAll('.vehiculo').length).toBe(1);
    expect(text()).toContain('AKT NKD 125');
    expect(text()).toContain('XYZ01A');
  });

  it('muestra el uso con su unidad, que no siempre son kilometros', () => {
    render([moto]);

    expect(text()).toContain('18000');
    expect(text()).toContain('km');
  });

  // El taller ve solo lo que el dueno le presto. Un taller recien creado no
  // tiene nada, y eso no es un error: hay que decirlo sin alarmar.
  it('explica el vacio en vez de dejar la pantalla muda', () => {
    render([]);

    expect(text()).toContain('Todavia no ha entrado ningun vehiculo');
  });

  it('avisa cuando no se pudo cargar', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(`${API_WORKSHOP}/vehicles`)
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar');
  });

  it('cada vehiculo lleva a su detalle', () => {
    render([moto]);

    expect(fixture.nativeElement.querySelector('a[href="/vehiculos/11"]')).not.toBeNull();
  });
});
