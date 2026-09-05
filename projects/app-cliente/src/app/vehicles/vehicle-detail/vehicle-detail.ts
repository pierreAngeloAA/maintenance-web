import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { VehicleService } from '../../core/vehicle.service';
import { Recall, Vehicle } from '../../core/vehicle.model';
import { VEHICLE_TYPE_LABELS } from '../vehicle-type-labels';
import { RiskDashboard } from '../risk-dashboard/risk-dashboard';
import { MaintenanceHistory } from '../maintenance-history/maintenance-history';

@Component({
  selector: 'app-vehicle-detail',
  imports: [RouterLink, RiskDashboard, MaintenanceHistory],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.scss',
})
export class VehicleDetail {
  private readonly vehicles = inject(VehicleService);
  private readonly route = inject(ActivatedRoute);

  readonly vehicle = signal<Vehicle | null>(null);
  readonly recalls = signal<Recall[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly recallsFailed = signal(false);

  protected readonly typeLabels = VEHICLE_TYPE_LABELS;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.vehicles.get(id).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    // Los recalls van aparte a proposito: si NHTSA falla, el vehiculo se sigue viendo.
    this.vehicles.recalls(id).subscribe({
      next: (recalls) => this.recalls.set(recalls),
      error: () => this.recallsFailed.set(true),
    });
  }
}
