import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RiskDashboard } from './risk-dashboard';
import { PartRisk } from '../../core/vehicle.model';
import { environment } from '../../../environments/environment';

describe('RiskDashboard', () => {
  let fixture: ComponentFixture<RiskDashboard>;
  let component: RiskDashboard;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/api/v1/vehicles/7/risks`;

  const risk = (overrides: Partial<PartRisk> = {}): PartRisk => ({
    partType: {
      id: 1,
      code: 'drive_chain',
      name: 'Cadena de transmision',
      category: 'transmission',
      applicableVehicleTypes: ['motorcycle'],
    },
    usageSinceService: 18000,
    basis: 'last_service',
    lifeUnit: 'km',
    failureProbability: 0.555,
    conditionalRisk: 0.173,
    horizon: 1000,
    estimate: true,
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RiskDashboard);
    fixture.componentRef.setInput('vehicleId', 7);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('muestra el estado de carga mientras espera', () => {
    expect(fixture.nativeElement.textContent).toContain('Calculando');

    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [] });
  });

  it('arma una fila por pieza', () => {
    httpMock.expectOne(url).flush({
      vehicleId: 7,
      risks: [risk(), risk({ partType: { ...risk().partType, id: 2, code: 'tires', name: 'Llantas' } })],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.risk-dashboard__row').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Cadena de transmision');
  });

  it('muestra el riesgo del proximo tramo como porcentaje, con su tramo', () => {
    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [risk()] });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('17.3%');
    expect(text).toContain('1000 km');
  });

  it('explica de donde salio el uso acumulado cuando hay historial', () => {
    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [risk({ basis: 'last_service' })] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('desde el ultimo cambio');
  });

  it('avisa cuando la pieza nunca se ha cambiado, porque el dato es peor', () => {
    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [risk({ basis: 'vehicle_total' })] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('nunca se ha registrado un cambio');
  });

  it('aclara cuando la fecha se estima desde el ano del modelo', () => {
    httpMock.expectOne(url).flush({
      vehicleId: 7,
      risks: [risk({ basis: 'model_year', lifeUnit: 'months' })],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ano del modelo');
  });

  it('dice que los parametros son estimaciones de ingenieria', () => {
    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [risk({ estimate: true })] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('estimacion');
  });

  it('no muestra la advertencia de estimacion cuando el dato ya viene de usuarios', () => {
    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [risk({ estimate: false })] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('estimacion');
  });

  it('clasifica el riesgo para poder resaltarlo', () => {
    expect(component.level(0.02)).toBe('bajo');
    expect(component.level(0.1)).toBe('medio');
    expect(component.level(0.3)).toBe('alto');

    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [] });
  });

  it('muestra un estado vacio cuando no hay piezas parametrizadas', () => {
    httpMock.expectOne(url).flush({ vehicleId: 7, risks: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todavia no podemos calcular');
  });

  it('muestra un error si falla el calculo', () => {
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos calcular');
  });
});
