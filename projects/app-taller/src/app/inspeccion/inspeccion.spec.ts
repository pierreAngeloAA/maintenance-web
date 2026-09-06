import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { API_WORKSHOP } from '../core/api-routes';
import { Inspeccion } from './inspeccion';

describe('Inspeccion', () => {
  let fixture: ComponentFixture<Inspeccion>;
  let httpMock: HttpTestingController;

  const items = [
    { id: 1, code: 'engine_oil_level', label: 'Nivel de aceite', phase: 'engine_off',
      valueType: 'scale', unit: null, minimum: null, maximum: null, position: 0, partTypeId: null },
    { id: 2, code: 'tire_tread_fl', label: 'Labrado delantera izquierda', phase: 'engine_off',
      valueType: 'numeric', unit: 'mm', minimum: '0', maximum: '20', position: 1, partTypeId: null },
    { id: 3, code: 'dashboard_warnings', label: 'Testigos', phase: 'engine_idle',
      valueType: 'boolean', unit: null, minimum: null, maximum: null, position: 2, partTypeId: null },
    { id: 4, code: 'braking_behavior', label: 'Frenado', phase: 'driving',
      valueType: 'scale', unit: null, minimum: null, maximum: null, position: 3, partTypeId: null },
  ];

  const inspection = {
    id: 5, vehicleId: 3, status: 'in_progress', usageValue: '50000.0',
    startedAt: '2026-09-06T00:00:00Z', performedAt: null, durationSeconds: null,
    summary: null, photoCount: 0, observations: [], items,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inspeccion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Inspeccion);
    fixture.componentRef.setInput('orderId', '9');
  });

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  function loadOrder(): void {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/service_orders`)
      .flush([{ id: 9, status: 'assigned', requestId: 1, vehicleId: 3, technicianUserId: 1,
                startedAt: null, completedAt: null, totalCents: null }]);
    fixture.detectChanges();
  }

  function startVisit(): void {
    loadOrder();
    fixture.nativeElement.querySelector('#odometro').value = '50000';
    fixture.nativeElement.querySelector('button').click();
    httpMock.expectOne(`${API_WORKSHOP}/inspections`).flush(inspection);
    fixture.detectChanges();
  }

  // El kilometraje del odometro es obligatorio: sin el, medir en milimetros no
  // significa nada.
  it('pide el kilometraje antes de empezar', () => {
    loadOrder();

    expect(text()).toContain('Kilometraje que marca el odometro');
  });

  it('no empieza sin kilometraje', () => {
    loadOrder();
    fixture.nativeElement.querySelector('#odometro').value = '';
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(text()).toContain('Escribe el kilometraje');
  });

  // Son ~30 campos: un formulario largo con scroll infinito es inservible de
  // pie junto al carro.
  it('muestra una sola fase a la vez', () => {
    startVisit();

    expect(text()).toContain('Labrado delantera izquierda');
    expect(text()).not.toContain('Frenado');
  });

  it('avanza de fase', () => {
    startVisit();
    const siguiente = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLElement).textContent?.includes('Siguiente')) as HTMLElement;
    siguiente.click();
    fixture.detectChanges();

    expect(text()).toContain('Testigos');
    expect(text()).not.toContain('Labrado delantera izquierda');
  });

  it('los campos de medida muestran su unidad', () => {
    startVisit();

    expect(text()).toContain('(mm)');
  });

  // Cada medicion viaja apenas se toma: si se cierra la app, no se pierde.
  it('guarda la medicion apenas se toca la escala', () => {
    startVisit();

    const nivel = fixture.nativeElement.querySelector('.campo__nivel') as HTMLElement;
    nivel.click();

    const req = httpMock.expectOne(`${API_WORKSHOP}/inspections/5/observations`);
    expect(req.request.body).toEqual({ observation: { itemId: 1, scaleValue: 1 } });
    req.flush({ id: 1, itemId: 1, itemCode: 'engine_oil_level', partTypeId: null,
                value: 1, severity: null, notes: null });
  });

  it('avisa si una medicion no se pudo guardar', () => {
    startVisit();

    (fixture.nativeElement.querySelector('.campo__nivel') as HTMLElement).click();
    httpMock.expectOne(`${API_WORKSHOP}/inspections/5/observations`)
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('No se guardo');
  });

  it('muestra el avance de la fase', () => {
    startVisit();

    expect(text()).toContain('0 de 2 medidos');
  });

  it('avisa si la orden no existe', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API_WORKSHOP}/service_orders`).flush([]);
    fixture.detectChanges();

    expect(text()).toContain('No pudimos abrir la visita');
  });
});
