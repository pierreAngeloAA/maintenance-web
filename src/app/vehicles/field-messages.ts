/**
 * El API devuelve los errores de Rails en ingles y con el nombre del campo en
 * camelCase. El texto en espanol lo arma el frontend, que es donde vive el
 * idioma del producto.
 *
 * A futuro conviene que el API devuelva codigos de error en vez de mensajes,
 * para no depender de estos strings.
 */
export const FIELD_LABELS: Record<string, string> = {
  vehicleType: 'Tipo de vehiculo',
  make: 'Marca',
  model: 'Modelo',
  modelYear: 'Año',
  vin: 'VIN',
  plate: 'Placa',
  usageValue: 'Kilometraje',
  usageUnit: 'Unidad de uso',
  city: 'Ciudad',
};

const ERROR_MESSAGES: [RegExp, string][] = [
  [/can't be blank/, 'no puede quedar vacio'],
  [/has already been taken/, 'ya esta registrado'],
  [/is invalid/, 'no tiene un formato valido'],
  [/is not included in the list/, 'no es una opcion valida'],
  [/must be greater than or equal to/, 'esta por debajo del minimo permitido'],
  [/must be less than or equal to/, 'esta por encima del maximo permitido'],
];

export function translateError(message: string): string {
  const match = ERROR_MESSAGES.find(([pattern]) => pattern.test(message));

  return match ? match[1] : 'no es valido';
}
