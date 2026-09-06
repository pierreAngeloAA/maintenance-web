import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '@shared/environments/environment';
import { Ventas } from './ventas';

describe('Ventas', () => {
  let fixture: ComponentFixture<Ventas>;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/api/v1/store/orders`;

  const order = {
    id: 7, status: 'pending', totalCents: 2_000_000, currency: 'COP',
    address: 'Calle 100 #15-20', placedAt: '2026-09-06T00:00:00Z',
    buyerType: 'User', buyerId: 3,
    items: [{ id: 1, productName: 'Pastillas', productBrand: 'Bosch', productSku: 'BP-1',
              quantity: 2, unitPriceCents: 1_000_000, totalCents: 2_000_000 }],
    payments: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ventas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Ventas);
  });

  function render(orders: unknown[] = []): void {
    fixture.detectChanges();
    httpMock.expectOne(url).flush(orders);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  function buttons(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.venta__acciones button'));
  }

  it('muestra el estado de carga', () => {
    fixture.detectChanges();

    expect(text()).toContain('Cargando las ventas');
    httpMock.expectOne(url).flush([]);
  });

  it('explica el vacio', () => {
    render();

    expect(text()).toContain('Todavia no tienes ventas');
  });

  it('avisa cuando falla', () => {
    fixture.detectChanges();
    httpMock.expectOne(url).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar las ventas');
  });

  it('muestra el comprador, los productos y el estado', () => {
    render([order]);

    expect(text()).toContain('Cliente');
    expect(text()).toContain('2 × Bosch Pastillas');
    expect(text()).toContain('Pendiente');
  });

  it('distingue cuando compra un taller', () => {
    render([{ ...order, buyerType: 'Identity::Organization' }]);

    expect(text()).toContain('Taller');
  });

  // Solo se ofrecen las transiciones que el API acepta.
  it('desde pendiente ofrece pagada y cancelada, no entregada', () => {
    render([order]);

    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Pagada', 'Cancelada']);
  });

  it('una entregada no ofrece nada', () => {
    render([{ ...order, status: 'delivered' }]);

    expect(buttons().length).toBe(0);
  });

  it('mueve la venta', () => {
    render([order]);

    buttons()[0].click();

    const req = httpMock.expectOne(`${url}/7`);
    expect(req.request.body).toEqual({ status: 'paid' });
    req.flush({ ...order, status: 'paid' });
    fixture.detectChanges();

    expect(text()).toContain('Pagada');
  });

  it('avisa si no se pudo mover', () => {
    render([order]);

    buttons()[0].click();
    httpMock.expectOne(`${url}/7`).flush('', { status: 422, statusText: 'Unprocessable' });
    fixture.detectChanges();

    expect(text()).toContain('No pudimos mover esta venta');
  });

  it('muestra la referencia del pago cuando la hay', () => {
    render([{ ...order, payments: [{ id: 1, gateway: 'wompi', gatewayRef: 'TX-9', status: 'approved' }] }]);

    expect(text()).toContain('wompi');
    expect(text()).toContain('TX-9');
  });
});
