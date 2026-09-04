import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { VehicleService } from '../../core/vehicle.service';
import { VehicleInput, VehicleType } from '../../core/vehicle.model';
import { FIELD_LABELS, translateError } from '../field-messages';
import { controlErrorMessage } from '../form-errors';

/** Mismo formato que valida el backend: ISO 3779 excluye I, O y Q. */
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.scss',
})
export class VehicleForm {
  private readonly vehicles = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly fieldLabels = FIELD_LABELS;
  readonly saving = signal(false);
  readonly lookupMessage = signal('');
  readonly serverErrors = signal<Record<string, string[]>>({});
  /** Fallo que no es de validacion: servidor caido, red, 500. */
  readonly saveFailed = signal(false);

  readonly form = this.fb.group({
    vehicleType: this.fb.nonNullable.control<VehicleType>('car', Validators.required),
    make: ['', Validators.required],
    model: ['', Validators.required],
    modelYear: [
      null as number | null,
      [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)],
    ],
    // Opcional a proposito: NHTSA no cubre las motos que se venden en Colombia.
    vin: this.fb.nonNullable.control('', Validators.pattern(VIN_PATTERN)),
    plate: [''],
    usageValue: [null as number | null, [Validators.required, Validators.min(0)]],
    city: [''],
  });

  /**
   * Autocompletado al salir del campo de VIN. Nunca bloquea: si NHTSA no conoce
   * el vehiculo, el usuario sigue llenando los datos a mano.
   */
  onVinBlur(): void {
    const vin = this.form.controls.vin.value.replace(/\s+/g, '').toUpperCase();
    this.form.controls.vin.setValue(vin);

    if (!VIN_PATTERN.test(vin)) {
      return;
    }

    this.vehicles.lookupVin(vin).subscribe((lookup) => {
      if (!lookup.found) {
        this.lookupMessage.set('No pudimos autocompletar este VIN. Puedes llenar los datos a mano.');
        return;
      }

      this.lookupMessage.set('');
      // Solo se llena lo que el API sí conoce: nunca se borra lo que el usuario escribio.
      this.form.patchValue({
        make: lookup.make ?? this.form.controls.make.value,
        model: lookup.model ?? this.form.controls.model.value,
        modelYear: lookup.modelYear ?? this.form.controls.modelYear.value,
        vehicleType: lookup.vehicleType ?? this.form.controls.vehicleType.value,
      });
    });
  }

  submit(): void {
    // El boton ya no se deshabilita: si el formulario esta incompleto marcamos
    // todo como tocado para que se vea que falta, en vez de no hacer nada.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveFailed.set(false);
    this.serverErrors.set({});

    this.vehicles.create(this.buildInput()).subscribe({
      next: (vehicle) => {
        this.saving.set(false);
        this.router.navigate(['/vehicles', vehicle.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        const fieldErrors = error.error?.errors;
        this.serverErrors.set(fieldErrors ?? {});
        // Sin esto el guardado fallaba en silencio y el usuario no se enteraba.
        this.saveFailed.set(!fieldErrors);
      },
    });
  }

  protected errorFor(field: string): string | null {
    return controlErrorMessage(field, this.form.get(field));
  }

  protected errorEntries(): { label: string; messages: string[] }[] {
    return Object.entries(this.serverErrors()).map(([field, messages]) => ({
      label: FIELD_LABELS[field] ?? field,
      messages: messages.map(translateError),
    }));
  }

  private buildInput(): VehicleInput {
    const value = this.form.getRawValue();

    return {
      vehicleType: value.vehicleType,
      make: value.make!,
      model: value.model!,
      modelYear: value.modelYear!,
      vin: value.vin || null,
      plate: value.plate || null,
      // Autos y motos se miden en kilometros; otras clases de vehiculo usaran horas.
      usageValue: value.usageValue!,
      usageUnit: 'km',
      city: value.city || null,
    };
  }
}
