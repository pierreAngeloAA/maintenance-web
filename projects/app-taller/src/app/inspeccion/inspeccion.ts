import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { WorkshopService } from '../core/workshop.service';
import {
  Inspection,
  InspectionItem,
  InspectionPhase,
  ObservationInput,
  PHASE_LABELS,
  PHASE_ORDER,
} from '../core/workshop.model';

/**
 * La visita de 30 minutos.
 *
 * Dos decisiones que mandan sobre todo lo demas:
 *
 * 1. **Una fase a la vez.** Son ~30 campos: un formulario largo con scroll
 *    infinito es inservible de pie junto al carro.
 * 2. **Cada medicion se manda apenas se toma.** El progreso vive en el servidor,
 *    no en memoria: si se cierra la app a mitad de la visita, al volver sigue
 *    ahi. Es el detalle que mas rabia da en la calle si falta.
 */
@Component({
  selector: 'app-inspeccion',
  templateUrl: './inspeccion.html',
  styleUrl: './inspeccion.scss',
})
export class Inspeccion {
  private readonly workshop = inject(WorkshopService);
  private readonly router = inject(Router);

  readonly orderId = input.required<number, string>({ transform: (v) => Number(v) });

  /** El vehiculo sale de la orden: el tecnico no lo elige. */
  readonly vehicleId = signal<number | null>(null);

  /**
   * Kilometraje leido del odometro al empezar. Es obligatorio y no se puede
   * adivinar: sin el, medir el labrado en milimetros no significa nada.
   */
  readonly usageValue = signal<number | null>(null);
  readonly started = signal(false);

  readonly inspection = signal<Inspection | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal<number | null>(null);
  readonly failed = signal<number | null>(null);
  readonly closing = signal(false);
  readonly closeErrors = signal<string[]>([]);
  readonly photos = signal<File[]>([]);

  readonly phaseIndex = signal(0);
  readonly phases = PHASE_ORDER;
  readonly phaseLabels = PHASE_LABELS;

  readonly currentPhase = computed<InspectionPhase>(() => this.phases[this.phaseIndex()]);

  readonly currentItems = computed<InspectionItem[]>(() =>
    (this.inspection()?.items ?? []).filter((item) => item.phase === this.currentPhase()),
  );

  /** Cuantos campos de esta fase ya tienen medicion: el tecnico ve su avance. */
  readonly phaseProgress = computed(() => {
    const measured = new Set((this.inspection()?.observations ?? []).map((o) => o.itemId));

    return this.currentItems().filter((item) => measured.has(item.id)).length;
  });

  readonly isLastPhase = computed(() => this.phaseIndex() === this.phases.length - 1);

  constructor() {
    this.loadOrder();
  }

  /** El vehiculo lo dice la orden, no el tecnico. */
  loadOrder(): void {
    this.loading.set(true);
    this.error.set(false);

    this.workshop.orders().subscribe({
      next: (orders) => {
        const order = orders.find((o) => o.id === this.orderId());

        if (order === undefined) {
          this.error.set(true);
        } else {
          this.vehicleId.set(order.vehicleId);
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  start(raw: string): void {
    // Ojo: Number('') es 0. Sin esta guarda, tocar "Empezar" sin escribir
    // abriria la visita con 0 km, que es justo el dato del que cuelga todo lo
    // demas.
    const usage = raw.trim() === '' ? NaN : Number(raw);

    if (!Number.isFinite(usage) || usage < 0) {
      this.closeErrors.set(['Escribe el kilometraje que marca el odometro.']);

      return;
    }

    this.usageValue.set(usage);
    this.started.set(true);
    this.open(usage);
  }

  open(usageValue: number): void {
    const vehicleId = this.vehicleId();

    if (vehicleId === null) {
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.workshop.openInspection(vehicleId, usageValue, this.orderId()).subscribe({
      next: (inspection) => {
        this.inspection.set(inspection);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  valueOf(item: InspectionItem): string | number | boolean | null {
    return this.inspection()?.observations.find((o) => o.itemId === item.id)?.value ?? null;
  }

  measured(item: InspectionItem): boolean {
    return this.valueOf(item) !== null;
  }

  save(item: InspectionItem, raw: string | number | boolean): void {
    const inspection = this.inspection();

    if (inspection === null) {
      return;
    }

    this.saving.set(item.id);
    this.failed.set(null);

    this.workshop.measure(inspection.id, this.inputFor(item, raw)).subscribe({
      next: (observation) => {
        this.saving.set(null);
        this.inspection.update((current) =>
          current === null
            ? current
            : {
                ...current,
                observations: [
                  ...current.observations.filter((o) => o.itemId !== item.id),
                  observation,
                ],
              },
        );
      },
      error: () => {
        this.saving.set(null);
        this.failed.set(item.id);
      },
    });
  }

  nextPhase(): void {
    if (!this.isLastPhase()) {
      this.phaseIndex.update((index) => index + 1);
    }
  }

  previousPhase(): void {
    if (this.phaseIndex() > 0) {
      this.phaseIndex.update((index) => index - 1);
    }
  }

  addPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.photos.set(Array.from(input.files ?? []));
  }

  close(): void {
    const inspection = this.inspection();

    if (inspection === null) {
      return;
    }

    // Se avisa antes de mandar nada: el API tambien lo exige, pero enterarse
    // despues de subir fotos por datos moviles es peor.
    if (this.photos().length === 0) {
      this.closeErrors.set(['Falta al menos una foto de la visita.']);

      return;
    }

    this.closing.set(true);
    this.closeErrors.set([]);

    navigator.geolocation.getCurrentPosition(
      (position) => this.send(inspection.id, position.coords.latitude, position.coords.longitude),
      () => this.send(inspection.id, null, null),
    );
  }

  private send(id: number, latitude: number | null, longitude: number | null): void {
    this.workshop.closeInspection(id, latitude, longitude, this.photos()).subscribe({
      next: () => this.router.navigate(['/servicios']),
      error: () => {
        this.closing.set(false);
        this.closeErrors.set(['No pudimos cerrar la visita. Revisa la conexion.']);
      },
    });
  }

  private inputFor(item: InspectionItem, raw: string | number | boolean): ObservationInput {
    switch (item.valueType) {
      case 'numeric':
        return { itemId: item.id, numericValue: Number(raw) };
      case 'scale':
        return { itemId: item.id, scaleValue: Number(raw) };
      case 'boolean':
        return { itemId: item.id, booleanValue: Boolean(raw) };
      default:
        return { itemId: item.id, dateValue: String(raw) };
    }
  }
}
