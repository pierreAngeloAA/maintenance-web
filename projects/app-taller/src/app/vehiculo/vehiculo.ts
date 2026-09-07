import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WorkshopService } from '../core/workshop.service';
import { RecordSource, WorkshopMaintenanceRecord, WorkshopVehicle } from '../core/workshop.model';

/**
 * La ficha de un vehiculo que entro al taller: sus datos y todo lo que se le ha
 * hecho.
 *
 * El historial es el dato que el taller no puede conseguir de otra forma. Un
 * vehiculo sin historial no es un vehiculo sano: es uno del que no sabemos
 * nada, y la pantalla lo dice en vez de dejar un vacio que parezca buena
 * noticia. Es el mismo criterio del tablero de riesgo del cliente.
 */
@Component({
  selector: 'app-vehiculo',
  imports: [RouterLink],
  templateUrl: './vehiculo.html',
  styleUrl: './vehiculo.scss',
})
export class Vehiculo {
  private readonly workshop = inject(WorkshopService);

  readonly vehicleId = input.required<number>();

  readonly vehicle = signal<WorkshopVehicle | null>(null);
  readonly records = signal<WorkshopMaintenanceRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly historyFailed = signal(false);

  constructor() {
    effect(() => this.load(this.vehicleId()));
  }

  private load(vehicleId: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.historyFailed.set(false);

    this.workshop.vehicle(vehicleId).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    // Peticion aparte a proposito: si el historial falla, la ficha se sigue viendo.
    this.workshop.history(vehicleId).subscribe({
      next: (records) => this.records.set(records),
      error: () => this.historyFailed.set(true),
    });
  }

  label(vehicle: WorkshopVehicle): string {
    return `${vehicle.make} ${vehicle.model} ${vehicle.modelYear}`;
  }

  /**
   * Quien registro el trabajo. Importa para saber cuanto confiar: lo que
   * declaro el dueno de memoria no vale lo mismo que lo que midio un taller.
   */
  sourceLabel(recordedBy: RecordSource): string {
    if (recordedBy.source === 'owner') {
      return 'Registrado por el dueno';
    }

    return recordedBy.organizationName
      ? `Registrado por ${recordedBy.organizationName}`
      : 'Registrado por un taller';
  }

  cost(record: WorkshopMaintenanceRecord): string | null {
    if (record.costCents === null) {
      return null;
    }

    return `${(record.costCents / 100).toLocaleString('es-CO')} ${record.currency}`;
  }
}
