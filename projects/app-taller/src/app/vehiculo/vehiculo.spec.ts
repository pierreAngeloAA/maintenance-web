import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_WORKSHOP } from '../core/api-routes';
import { Vehiculo } from './vehiculo';

describe('Vehiculo', () => {
  let fixture: ComponentFixture<Vehiculo>;
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
    createdAt: '',
    updatedAt: '',
  };

  const registro = {
    id: 5,
    vehicleId: 11,
    partType: { id: 17, code: 'drive_chain', name: 'Cadena de transmision', category: 'transmission' },
    performedOn: '2026-06-15',
    usageAtService: '12000.0',
    partBrand: 'DID',
    costCents: 18000000,
    currency: 'COP',
    notes: 'Cambio con kit completo',
    recordedBy: { source: 'owner', userName: null, organizationName: null },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehiculo],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Vehiculo);
    fixture.componentRef.setInput('vehicleId', 11);
  });

  afterEach(() => httpMock.verify());

  function render(vehicle: object = moto, records: object[] = []): void {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/vehicles/11`).flush(vehicle);
    httpMock.expectOne(`${API_WORKSHOP}/vehicles/11/maintenance_records`).flush(records);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  it('muestra los datos del vehiculo', () => {
    render();

    expect(text()).toContain('AKT NKD 125');
    expect(text()).toContain('XYZ01A');
    expect(text()).toContain('18000');
  });

  it('muestra el historial de lo que se le ha hecho', () => {
    render(moto, [registro]);

    expect(fixture.nativeElement.querySelectorAll('.registro').length).toBe(1);
    expect(text()).toContain('Cadena de transmision');
    expect(text()).toContain('DID');
  });

  it('dice a que kilometraje se hizo cada trabajo, que es lo que da sentido a la medicion', () => {
    render(moto, [registro]);

    expect(text()).toContain('12000');
  });

  it('distingue lo que registro el dueno de lo que registro un taller', () => {
    render(moto, [
      registro,
      {
        ...registro,
        id: 6,
        recordedBy: { source: 'workshop', userName: 'Andres', organizationName: 'Taller La 80' },
      },
    ]);

    expect(text()).toContain('Registrado por el dueno');
    expect(text()).toContain('Taller La 80');
  });

  // Un vehiculo sin historial no es un vehiculo sano: es un vehiculo del que no
  // sabemos nada. Es el mismo criterio del tablero de riesgo del cliente.
  it('explica un historial vacio sin hacerlo pasar por buena noticia', () => {
    render(moto, []);

    expect(text()).toContain('No hay mantenimientos registrados');
  });

  it('avisa si no se pudo cargar el vehiculo', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/vehicles/11`).flush('', { status: 404, statusText: 'Not Found' });
    httpMock.expectOne(`${API_WORKSHOP}/vehicles/11/maintenance_records`).flush([]);
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar este vehiculo');
  });

  // Que falle el historial no puede tumbar la ficha del vehiculo: son dos
  // peticiones distintas y el tecnico necesita al menos los datos basicos.
  it('si falla el historial, la ficha del vehiculo sigue en pie', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/vehicles/11`).flush(moto);
    httpMock
      .expectOne(`${API_WORKSHOP}/vehicles/11/maintenance_records`)
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('AKT NKD 125');
    expect(text()).toContain('No pudimos cargar el historial');
  });
});
