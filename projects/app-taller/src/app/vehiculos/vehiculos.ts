import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkshopService } from '../core/workshop.service';
import { WorkshopVehicle } from '../core/workshop.model';

/**
 * Los vehiculos que entraron a este taller.
 *
 * No es "todos los vehiculos": son los que tienen un permiso vigente del dueno,
 * y el permiso nace del servicio y muere con el. Que la lista se vacie con el
 * tiempo es el comportamiento correcto, no un error.
 */
@Component({
  selector: 'app-vehiculos',
  imports: [RouterLink],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.scss',
})
export class Vehiculos {
  private readonly workshop = inject(WorkshopService);

  readonly vehicles = signal<WorkshopVehicle[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.workshop.vehicles().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  label(vehicle: WorkshopVehicle): string {
    return `${vehicle.make} ${vehicle.model} ${vehicle.modelYear}`;
  }
}
