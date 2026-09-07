import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '@shared/environments/environment';
import { HealthReportPanel } from './health-report';

describe('HealthReportPanel', () => {
  let fixture: ComponentFixture<HealthReportPanel>;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/api/v1/client/vehicles/7/health_report`;
  const historyUrl = `${url}s`;

  const report = {
    id: 1,
    vehicleId: 7,
    period: '2026-09-01',
    generatedAt: '2026-09-06T00:00:00Z',
    usageValue: 18000,
    usageUnit: 'km',
    risks: [
      { partType: { id: 1, code: 'drive_chain', name: 'Cadena', category: 'transmission' },
        usageSinceService: 18000, basis: 'vehicle_total', lifeUnit: 'km',
        failureProbability: 0.4, conditionalRisk: 0.08, horizon: 1000,
        estimate: true, contextFactor: 0.9 },
    ],
    inspection: { present: false },
    documents: { soatExpiresOn: null, technicalInspectionExpiresOn: null, runtCheckedAt: null },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthReportPanel],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HealthReportPanel);
    fixture.componentRef.setInput('vehicleId', 7);
  });

  function render(overrides: Record<string, unknown> = {}): void {
    fixture.detectChanges();
    httpMock.expectOne(url).flush({ ...report, ...overrides });
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  it('muestra el estado de carga', () => {
    fixture.detectChanges();

    expect(text()).toContain('Preparando el diagnostico');
    httpMock.expectOne(url).flush(report);
  });

  it('avisa cuando falla', () => {
    fixture.detectChanges();
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar el diagnostico');
  });

  // "Nadie lo ha mirado" no es lo mismo que "esta bien".
  it('dice cuando ningun tecnico ha revisado el vehiculo', () => {
    render();

    expect(text()).toContain('Ningun tecnico ha revisado este vehiculo');
  });

  it('muestra lo medido y de cuando es', () => {
    render({
      inspection: {
        present: true, id: 3, performedAt: '2026-09-01', usageValue: 17800,
        observations: [{ id: 1, itemId: 2, itemCode: 'tire_tread_front', partTypeId: null,
                         value: 4.5, severity: 'watch', notes: null }],
      },
    });

    expect(text()).toContain('Revisado el 2026-09-01');
    expect(text()).toContain('tire_tread_front');
    expect(text()).toContain('4.5');
  });

  // Una pieza sin historial no es una pieza sana.
  it('distingue las piezas que nunca se han cambiado', () => {
    render();

    expect(text()).toContain('Nunca se ha registrado un cambio de esta pieza');
  });

  it('marca los parametros que todavia son estimaciones', () => {
    render();

    expect(text()).toContain('Parametros estimados');
  });

  describe('documentos', () => {
    it('destaca un SOAT proximo a vencer', () => {
      const enDiezDias = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
      render({ documents: { soatExpiresOn: enDiezDias, technicalInspectionExpiresOn: null,
                            runtCheckedAt: null } });

      const soat = fixture.nativeElement.querySelector('.documento--urgente');
      expect(soat.textContent).toContain('SOAT');
    });

    it('no destaca uno lejano', () => {
      const enUnAno = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
      render({ documents: { soatExpiresOn: enUnAno, technicalInspectionExpiresOn: null,
                            runtCheckedAt: null } });

      expect(fixture.nativeElement.querySelector('.documento--urgente')).toBeNull();
    });

    it('explica cuando no sabemos la fecha en vez de callar', () => {
      render();

      expect(text()).toContain('Todavia no sabemos cuando vence el SOAT');
    });
  });

  describe('historial', () => {
    it('lo pide solo cuando se abre', () => {
      render();

      httpMock.expectNone(historyUrl);

      fixture.nativeElement.querySelector('.historial__boton').click();
      httpMock.expectOne(historyUrl).flush([{ ...report, id: 2, period: '2026-08-01' }]);
      fixture.detectChanges();

      expect(text()).toContain('2026-08-01');
    });

    it('explica si es el primer diagnostico', () => {
      render();

      fixture.nativeElement.querySelector('.historial__boton').click();
      httpMock.expectOne(historyUrl).flush([]);
      fixture.detectChanges();

      expect(text()).toContain('Este es el primer diagnostico');
    });
  });

  it('reintentar vuelve a pedir el diagnostico', () => {
    fixture.detectChanges();
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();
    httpMock.expectOne(url).flush(report);
    fixture.detectChanges();

    expect(text()).toContain('Piezas');
  });

  it('muestra la tecnomecanica cuando la hay', () => {
    const enDiezDias = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    render({ documents: { soatExpiresOn: null, technicalInspectionExpiresOn: enDiezDias,
                          runtCheckedAt: null } });

    expect(text()).toContain('Tecnomecanica vence el');
  });

  // Que falle el historial no puede tumbar la pantalla principal.
  it('si el historial falla, el diagnostico sigue en pie', () => {
    render();

    fixture.nativeElement.querySelector('.historial__boton').click();
    httpMock.expectOne(historyUrl).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('Piezas');
  });

  it('cerrar el historial no lo vuelve a pedir', () => {
    render();
    const boton = fixture.nativeElement.querySelector('.historial__boton');

    boton.click();
    httpMock.expectOne(historyUrl).flush([]);
    fixture.detectChanges();
    boton.click();
    fixture.detectChanges();
    boton.click();
    fixture.detectChanges();

    httpMock.expectNone(historyUrl);
  });

  it('explica el vacio si no hay piezas parametrizadas', () => {
    render({ risks: [] });

    expect(text()).toContain('Todavia no hay piezas parametrizadas');
  });

  describe('formato del riesgo', () => {
    it('muestra el riesgo como porcentaje y no como probabilidad cruda', () => {
      render();

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('8.0%');
      expect(texto).not.toContain('0.08');
    });

    it('redondea igual que el tablero de riesgo, a un decimal', () => {
      const panel = fixture.componentInstance;

      expect(panel.percent(0.991388266366329)).toBe('99.1%');
      expect(panel.percent(1)).toBe('100.0%');
      expect(panel.percent(0)).toBe('0.0%');
    });
  });
});
