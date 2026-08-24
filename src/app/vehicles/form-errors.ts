import { AbstractControl } from '@angular/forms';

/**
 * Mensajes de validacion en espanol. Un formulario que deshabilita el boton sin
 * decir que falta no sirve: el usuario no tiene forma de saber que corregir.
 */
const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'Este dato es obligatorio',
  email: 'Escribe un correo valido',
  minlength: 'Es demasiado corto',
  pattern: 'El formato no es valido',
  min: 'El valor es muy bajo',
  max: 'El valor es muy alto',
};

/** Mensajes especificos cuando el generico no alcanza para corregir el dato. */
const FIELD_MESSAGES: Record<string, Record<string, string>> = {
  vin: { pattern: 'El VIN debe tener 17 caracteres, sin las letras I, O ni Q' },
  modelYear: { min: 'El ano es muy antiguo', max: 'Ese ano todavia no existe' },
  usageValue: { min: 'El kilometraje no puede ser negativo' },
  usageAtService: { max: 'No puede ser mayor al kilometraje actual del vehiculo' },
  performedOn: { max: 'La fecha no puede estar en el futuro' },
  password: { minlength: 'La contrasena debe tener al menos 8 caracteres' },
};

export function controlErrorMessage(field: string, control: AbstractControl | null): string | null {
  if (!control || control.valid || !control.touched) {
    return null;
  }

  // Un control invalido y tocado siempre trae al menos un error.
  const key = Object.keys(control.errors ?? {})[0];

  return FIELD_MESSAGES[field]?.[key] ?? DEFAULT_MESSAGES[key] ?? 'Revisa este dato';
}
