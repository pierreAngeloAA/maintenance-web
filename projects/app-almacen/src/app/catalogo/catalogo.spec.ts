import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '@shared/environments/environment';
import { Catalogo } from './catalogo';

describe('Catalogo', () => {
  let fixture: ComponentFixture<Catalogo>;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/v1`;
  const productsUrl = `${base}/store/products`;
  const partTypesUrl = `${base}/part_types`;

  const product = {
    id: 1, name: 'Pastillas delanteras', brand: 'Bosch', sku: 'BP-1', description: null,
    unitPriceCents: 1_200_000, currency: 'COP', stockQuantity: 5, status: 'published',
    available: true, universal: true, partType: null, organizationId: 9, createdAt: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalogo],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Catalogo);
  });

  function render(products: unknown[] = []): void {
    fixture.detectChanges();
    httpMock.expectOne(productsUrl).flush(products);
    httpMock.expectOne(partTypesUrl).flush([{ id: 3, code: 'brake_pads', name: 'Pastillas', category: 'brakes' }]);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent;
  }

  function priceInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.tabla__editable');
  }

  it('muestra el estado de carga', () => {
    fixture.detectChanges();

    expect(text()).toContain('Cargando el catalogo');
    httpMock.expectOne(productsUrl).flush([]);
    httpMock.expectOne(partTypesUrl).flush([]);
  });

  // El primer dia el almacen no tiene nada: hay que decirle que hacer.
  it('explica como empezar en vez de dejar la pantalla vacia', () => {
    render();

    expect(text()).toContain('Todavia no tienes productos');
  });

  it('avisa cuando falla la carga', () => {
    fixture.detectChanges();
    httpMock.expectOne(productsUrl).flush('', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(partTypesUrl).flush([]);
    fixture.detectChanges();

    expect(text()).toContain('No pudimos cargar el catalogo');
  });

  it('lista los productos en una tabla', () => {
    render([product]);

    expect(text()).toContain('Pastillas delanteras');
    expect(text()).toContain('Bosch');
  });

  // Un producto sin compatibilidad sirve para todo: es una propiedad, no un
  // dato faltante.
  it('marca los universales como que sirven para todos', () => {
    render([product]);

    expect(text()).toContain('Sirve para todos');
  });

  // Cambiar un precio no deberia costar tres pantallas.
  it('guarda el precio desde la misma tabla', () => {
    render([product]);

    const input = priceInput();
    input.value = '15000';
    input.dispatchEvent(new Event('change'));

    const req = httpMock.expectOne(`${productsUrl}/1`);
    expect(req.request.body).toEqual({ product: { unitPriceCents: 1_500_000 } });
    req.flush({ ...product, unitPriceCents: 1_500_000 });
  });

  it('no manda nada si el precio queda vacio', () => {
    render([product]);

    const input = priceInput();
    input.value = '';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    httpMock.expectNone(`${productsUrl}/1`);
    expect(text()).toContain('No se guardo el cambio');
  });

  it('avisa si el cambio no se guarda', () => {
    render([product]);

    const input = priceInput();
    input.value = '15000';
    input.dispatchEvent(new Event('change'));
    httpMock.expectOne(`${productsUrl}/1`).flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain('No se guardo el cambio');
  });

  it('publica y despublica desde la tabla', () => {
    render([product]);

    const boton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b) => (b as HTMLElement).textContent?.trim() === 'Publicado') as HTMLElement;
    boton.click();

    const req = httpMock.expectOne(`${productsUrl}/1`);
    expect(req.request.body).toEqual({ product: { status: 'draft' } });
    req.flush({ ...product, status: 'draft' });
  });

  describe('alta de producto', () => {
    function fill(values: Record<string, string>): void {
      const el = fixture.nativeElement;
      el.querySelector('[aria-label="Nombre"]').value = values['name'] ?? '';
      el.querySelector('[aria-label="Marca"]').value = values['brand'] ?? '';
      el.querySelector('[aria-label="SKU"]').value = values['sku'] ?? '';
      el.querySelector('[aria-label="Precio"]').value = values['price'] ?? '';
      el.querySelector('[aria-label="Stock"]').value = values['stock'] ?? '';
      const agregar = Array.from(el.querySelectorAll('button') as NodeListOf<HTMLElement>)
        .find((b) => b.textContent?.trim() === 'Agregar');
      agregar!.click();
      fixture.detectChanges();
    }

    it('agrega un producto', () => {
      render();
      fill({ name: 'Filtro de aceite', brand: 'Mann', sku: 'F-1', price: '35000', stock: '12' });

      const req = httpMock.expectOne(productsUrl);
      expect(req.request.body).toEqual({
        product: { name: 'Filtro de aceite', brand: 'Mann', sku: 'F-1',
                   unitPriceCents: 3_500_000, stockQuantity: 12, partTypeId: null },
      });
      req.flush({ ...product, id: 2, name: 'Filtro de aceite' });
      fixture.detectChanges();

      expect(text()).toContain('Filtro de aceite');
    });

    it('dice que falta antes de mandar nada', () => {
      render();
      fill({ name: '', brand: '', price: 'abc' });

      httpMock.expectNone(productsUrl);
      expect(text()).toContain('Falta el nombre');
      expect(text()).toContain('Falta la marca');
      expect(text()).toContain('El precio tiene que ser un numero');
    });

    it('avisa si el API rechaza el producto', () => {
      render();
      fill({ name: 'X', brand: 'Y', price: '100' });
      httpMock.expectOne(productsUrl).flush('', { status: 422, statusText: 'Unprocessable' });
      fixture.detectChanges();

      expect(text()).toContain('No pudimos guardar el producto');
    });
  });
});
