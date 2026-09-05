import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VehicleService } from '../../core/vehicle.service';
import { Vehicle } from '../../core/vehicle.model';
import { VEHICLE_TYPE_LABELS } from '../vehicle-type-labels';

@Component({
  selector: 'app-vehicle-list',
  imports: [RouterLink],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.scss',
})
export class VehicleList {
  private readonly vehicles = inject(VehicleService);

  readonly items = signal<Vehicle[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  protected readonly typeLabels = VEHICLE_TYPE_LABELS;

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(false);

    this.vehicles.list().subscribe({
      next: (vehicles) => {
        this.items.set(vehicles);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
