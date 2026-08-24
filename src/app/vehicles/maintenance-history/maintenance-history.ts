import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MaintenanceService } from '../../core/maintenance.service';
import { LifeUnit, MaintenanceRecord } from '../../core/vehicle.model';

@Component({
  selector: 'app-maintenance-history',
  imports: [RouterLink],
  templateUrl: './maintenance-history.html',
  styleUrl: './maintenance-history.scss',
})
export class MaintenanceHistory {
  private readonly maintenance = inject(MaintenanceService);

  readonly vehicleId = input.required<number>();
  readonly usageUnit = input.required<LifeUnit>();

  readonly records = signal<MaintenanceRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    effect(() => {
      const id = this.vehicleId();
      this.loading.set(true);
      this.error.set(false);

      this.maintenance.list(id).subscribe({
        next: (records) => {
          this.records.set(records);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }
}
