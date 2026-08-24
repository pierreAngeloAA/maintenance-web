import { Component, effect, inject, input, signal } from '@angular/core';

import { VehicleService } from '../../core/vehicle.service';
import { PartRisk, RiskBasis } from '../../core/vehicle.model';

/**
 * Como se explica de donde salio el uso acumulado. El objetivo es no aparentar
 * precision: un riesgo calculado sobre el uso total del vehiculo vale menos que
 * uno calculado sobre historial real.
 */
const BASIS_LABELS: Record<RiskBasis, string> = {
  last_service: 'desde el ultimo cambio registrado',
  vehicle_total: 'uso total del vehiculo, porque nunca se ha registrado un cambio de esta pieza',
  model_year: 'estimado desde el ano del modelo, porque no hay un cambio registrado',
};

@Component({
  selector: 'app-risk-dashboard',
  templateUrl: './risk-dashboard.html',
  styleUrl: './risk-dashboard.scss',
})
export class RiskDashboard {
  private readonly vehicles = inject(VehicleService);

  readonly vehicleId = input.required<number>();

  readonly risks = signal<PartRisk[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  protected readonly basisLabels = BASIS_LABELS;

  constructor() {
    effect(() => {
      const id = this.vehicleId();
      this.loading.set(true);
      this.error.set(false);

      this.vehicles.risks(id).subscribe({
        next: (risks) => {
          this.risks.set(risks);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  /** Umbrales conservadores: sirven para resaltar, no para decidir por el usuario. */
  level(risk: number): 'bajo' | 'medio' | 'alto' {
    if (risk >= 0.2) {
      return 'alto';
    }

    return risk >= 0.05 ? 'medio' : 'bajo';
  }

  percent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}
