import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { VehicleService } from '../../core/vehicle.service';
import { HealthReport } from '../../core/vehicle.model';

/**
 * El diagnostico mensual del vehiculo.
 *
 * El criterio que sostiene esta pantalla es el mismo del tablero de riesgo: **no
 * aparentar precision que no se tiene**. Una pieza que nunca se ha revisado no
 * es una pieza sana, y una medicion de hace cuatro meses no vale lo mismo que
 * una de la semana pasada: las dos cosas se dicen, no se disimulan.
 */
@Component({
  selector: 'app-health-report',
  templateUrl: './health-report.html',
  styleUrl: './health-report.scss',
})
export class HealthReportPanel {
  private readonly vehicles = inject(VehicleService);

  /** Cuantos dias antes del vencimiento se considera urgente. */
  private static readonly EXPIRY_WARNING_DAYS = 30;

  readonly vehicleId = input.required<number>();

  readonly report = signal<HealthReport | null>(null);
  readonly history = signal<HealthReport[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly showHistory = signal(false);
  // Bandera aparte y no `history().length`: un historial vacio es una
  // respuesta valida y no hay que volver a pedirlo cada vez que se abre.
  private readonly historyLoaded = signal(false);

  /** Lo unico con fecha dura y consecuencia legal: va primero. */
  readonly soatDays = computed(() => this.daysUntil(this.report()?.documents.soatExpiresOn));
  readonly inspectionDays = computed(() =>
    this.daysUntil(this.report()?.documents.technicalInspectionExpiresOn),
  );

  readonly neverInspected = computed(() => this.report()?.inspection.present === false);

  constructor() {
    // Con `effect` y no llamando a load() directo: el input requerido todavia
    // no tiene valor cuando corre el constructor. Es el mismo patron del
    // tablero de riesgo.
    effect(() => this.fetch(this.vehicleId()));
  }

  load(): void {
    this.fetch(this.vehicleId());
  }

  private fetch(vehicleId: number): void {
    this.loading.set(true);
    this.error.set(false);

    this.vehicles.healthReport(vehicleId).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleHistory(): void {
    const next = !this.showHistory();
    this.showHistory.set(next);

    if (next && !this.historyLoaded()) {
      this.vehicles.healthReports(this.vehicleId()).subscribe({
        next: (reports) => {
          this.history.set(reports);
          this.historyLoaded.set(true);
        },
        // Que falle el historial no puede tumbar el diagnostico del mes.
        error: () => undefined,
      });
    }
  }

  urgent(days: number | null): boolean {
    return days !== null && days <= HealthReportPanel.EXPIRY_WARNING_DAYS;
  }

  /** Una pieza sin historial no es una pieza sana: se distingue. */
  neverServiced(basis: string): boolean {
    return basis !== 'last_service';
  }

  private daysUntil(date: string | null | undefined): number | null {
    if (!date) {
      return null;
    }

    const diff = new Date(date).getTime() - Date.now();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
