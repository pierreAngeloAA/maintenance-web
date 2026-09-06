import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { WorkshopService } from '../core/workshop.service';
import { ServiceOffer, ServiceOrder } from '../core/workshop.model';

/**
 * Lo primero que ve el tecnico: que hay para tomar y que ya tomo.
 *
 * Pensado para el celular, de pie junto al carro: pocos botones y grandes.
 */
@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss',
})
export class Servicios {
  private readonly workshop = inject(WorkshopService);
  private readonly router = inject(Router);

  readonly offers = signal<ServiceOffer[]>([]);
  readonly orders = signal<ServiceOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly working = signal<number | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.workshop.offers().subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.loadOrders();
      },
      error: () => this.fail(),
    });
  }

  take(offer: ServiceOffer): void {
    this.working.set(offer.id);

    this.workshop.takeOffer(offer.id).subscribe({
      next: (order) => this.router.navigate(['/inspeccion', order.id]),
      error: () => {
        // Otro tecnico gano la carrera, o la oferta vencio: se recarga en vez
        // de dejar en pantalla algo que ya no existe.
        this.working.set(null);
        this.load();
      },
    });
  }

  dismiss(offer: ServiceOffer): void {
    this.working.set(offer.id);

    this.workshop.dismissOffer(offer.id).subscribe({
      next: () => {
        this.working.set(null);
        this.offers.update((offers) => offers.filter((o) => o.id !== offer.id));
      },
      error: () => this.working.set(null),
    });
  }

  openOrder(order: ServiceOrder): void {
    this.router.navigate(['/inspeccion', order.id]);
  }

  vehicleLabel(offer: ServiceOffer): string {
    const { make, model, modelYear } = offer.vehicle;

    return `${make} ${model} ${modelYear}`;
  }

  private loadOrders(): void {
    this.workshop.orders().subscribe({
      next: (orders) => {
        this.orders.set(orders.filter((order) => order.status !== 'completed'));
        this.loading.set(false);
      },
      error: () => this.fail(),
    });
  }

  private fail(): void {
    this.error.set(true);
    this.loading.set(false);
  }
}
