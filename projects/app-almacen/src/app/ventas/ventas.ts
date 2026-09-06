import { Component, inject, signal } from '@angular/core';

import { StoreService } from '../core/store.service';
import { NEXT_STATUSES, Order, OrderStatus, STATUS_LABELS } from '../core/store.model';

/** Las ventas del almacen: quien compro, que y en que va cada una. */
@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.html',
  styleUrl: './ventas.scss',
})
export class Ventas {
  private readonly store = inject(StoreService);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly moving = signal<number | null>(null);
  readonly failed = signal<number | null>(null);

  protected readonly labels = STATUS_LABELS;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.store.orders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Solo se ofrecen las transiciones que el API acepta. */
  nextStatuses(order: Order): OrderStatus[] {
    return NEXT_STATUSES[order.status] ?? [];
  }

  buyerLabel(order: Order): string {
    return order.buyerType.endsWith('Organization') ? 'Taller' : 'Cliente';
  }

  pesos(cents: number): number {
    return cents / 100;
  }

  move(order: Order, status: OrderStatus): void {
    this.moving.set(order.id);
    this.failed.set(null);

    this.store.moveOrder(order.id, status).subscribe({
      next: (updated) => {
        this.moving.set(null);
        this.orders.update((current) =>
          current.map((o) => (o.id === updated.id ? updated : o)),
        );
      },
      error: () => {
        this.moving.set(null);
        this.failed.set(order.id);
      },
    });
  }
}
