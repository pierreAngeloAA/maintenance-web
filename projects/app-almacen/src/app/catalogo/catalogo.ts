import { Component, inject, signal } from '@angular/core';

import { StoreService } from '../core/store.service';
import { PartType, Product } from '../core/store.model';

/**
 * El catalogo del almacen.
 *
 * Al reves que la app del taller: aca la persona esta sentada frente a un
 * escritorio cargando decenas o cientos de productos. Eso invierte las
 * prioridades — tabla densa en vez de tarjetas grandes, y edicion en linea:
 * cambiar un precio o un stock no deberia costar tres pantallas.
 */
@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  private readonly store = inject(StoreService);

  readonly products = signal<Product[]>([]);
  readonly partTypes = signal<PartType[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal<number | null>(null);
  readonly failed = signal<number | null>(null);
  readonly formErrors = signal<string[]>([]);
  readonly creating = signal(false);

  constructor() {
    this.load();
    this.store.partTypes().subscribe({
      next: (types) => this.partTypes.set(types),
      error: () => undefined,
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.store.products().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Se guarda al salir del campo, sin abrir otra pantalla. */
  savePrice(product: Product, raw: string): void {
    const pesos = Number(raw);

    if (raw.trim() === '' || !Number.isFinite(pesos) || pesos < 0) {
      this.failed.set(product.id);

      return;
    }

    this.patch(product, { unitPriceCents: Math.round(pesos * 100) });
  }

  saveStock(product: Product, raw: string): void {
    const stock = Number(raw);

    if (raw.trim() === '' || !Number.isInteger(stock) || stock < 0) {
      this.failed.set(product.id);

      return;
    }

    this.patch(product, { stockQuantity: stock });
  }

  publish(product: Product): void {
    this.patch(product, { status: product.status === 'published' ? 'draft' : 'published' });
  }

  create(form: { name: string; brand: string; sku: string; price: string; stock: string; partTypeId: string }): void {
    const pesos = Number(form.price);
    const stock = Number(form.stock);
    const problems: string[] = [];

    if (!form.name.trim()) {
      problems.push('Falta el nombre del producto.');
    }

    if (!form.brand.trim()) {
      problems.push('Falta la marca.');
    }

    if (form.price.trim() === '' || !Number.isFinite(pesos) || pesos < 0) {
      problems.push('El precio tiene que ser un numero.');
    }

    if (problems.length) {
      this.formErrors.set(problems);

      return;
    }

    this.formErrors.set([]);
    this.creating.set(true);

    this.store
      .createProduct({
        name: form.name.trim(),
        brand: form.brand.trim(),
        sku: form.sku.trim() || null,
        unitPriceCents: Math.round(pesos * 100),
        stockQuantity: Number.isInteger(stock) && stock >= 0 ? stock : 0,
        partTypeId: form.partTypeId ? Number(form.partTypeId) : null,
      })
      .subscribe({
        next: (product) => {
          this.creating.set(false);
          this.products.update((current) => [product, ...current]);
        },
        error: () => {
          this.creating.set(false);
          this.formErrors.set(['No pudimos guardar el producto.']);
        },
      });
  }

  pesos(cents: number): number {
    return cents / 100;
  }

  private patch(product: Product, changes: Record<string, unknown>): void {
    this.saving.set(product.id);
    this.failed.set(null);

    this.store.updateProduct(product.id, changes).subscribe({
      next: (updated) => {
        this.saving.set(null);
        this.products.update((current) =>
          current.map((p) => (p.id === updated.id ? updated : p)),
        );
      },
      error: () => {
        this.saving.set(null);
        this.failed.set(product.id);
      },
    });
  }
}
