import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MaintenanceService } from '../../core/maintenance.service';
import { VehicleService } from '../../core/vehicle.service';
import { MaintenanceRecordInput, Vehicle } from '../../core/vehicle.model';
import { FIELD_LABELS, translateError } from '../field-messages';

@Component({
  selector: 'app-maintenance-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './maintenance-form.html',
  styleUrl: './maintenance-form.scss',
})
export class MaintenanceForm {
  private readonly maintenance = inject(MaintenanceService);
  private readonly vehicles = inject(VehicleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private readonly vehicleId = Number(this.route.snapshot.paramMap.get('id'));

  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly serverErrors = signal<Record<string, string[]>>({});

  /** Solo las piezas que lleva este vehiculo: no se le cambia la cadena a un auto. */
  readonly partTypes = computed(() => this.vehicle()?.partTypes ?? []);

  readonly today = new Date().toISOString().slice(0, 10);

  readonly form = this.fb.group({
    partTypeId: [null as number | null, Validators.required],
    performedOn: ['', [Validators.required, Validators.max(0)]],
    usageAtService: [null as number | null, [Validators.required, Validators.min(0)]],
    partBrand: [''],
    costCents: [null as number | null],
    notes: [''],
  });

  constructor() {
    this.form.controls.performedOn.setValidators([Validators.required, maxDate(this.today)]);

    this.vehicles.get(this.vehicleId).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.loading.set(false);
        // El uso actual del vehiculo es el valor mas probable, pero editable:
        // el mantenimiento pudo ser hace 2.000 km.
        this.form.controls.usageAtService.setValue(Number(vehicle.usageValue));
        this.form.controls.usageAtService.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(Number(vehicle.usageValue)),
        ]);
        this.form.controls.usageAtService.updateValueAndValidity();
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.serverErrors.set({});

    this.maintenance.create(this.vehicleId, this.buildInput()).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/vehicles', this.vehicleId]);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.serverErrors.set(error.error?.errors ?? {});
      },
    });
  }

  protected errorEntries(): { label: string; messages: string[] }[] {
    return Object.entries(this.serverErrors()).map(([field, messages]) => ({
      label: FIELD_LABELS[field] ?? field,
      messages: messages.map(translateError),
    }));
  }

  private buildInput(): MaintenanceRecordInput {
    const value = this.form.getRawValue();

    return {
      partTypeId: value.partTypeId!,
      performedOn: value.performedOn!,
      usageAtService: value.usageAtService!,
      partBrand: value.partBrand || null,
      costCents: value.costCents ?? null,
      notes: value.notes || null,
    };
  }
}

/** Un mantenimiento no puede ser en el futuro. */
function maxDate(max: string) {
  return (control: { value: string | null }) =>
    control.value && control.value > max ? { max: true } : null;
}
