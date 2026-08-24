export type VehicleType = 'car' | 'motorcycle';
export type UsageUnit = 'km' | 'hours';

export interface PartType {
  id: number;
  code: string;
  name: string;
  category: string;
  applicableVehicleTypes: VehicleType[];
}

export interface Vehicle {
  id: number;
  vehicleType: VehicleType;
  make: string;
  model: string;
  modelYear: number;
  vin: string | null;
  plate: string | null;
  /** El API manda los decimales como string para no perder precision. */
  usageValue: string;
  usageUnit: UsageUnit;
  city: string | null;
  specs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** Solo viene en el detalle: las piezas que aplican a esta clase de vehiculo. */
  partTypes?: PartType[];
}

export interface VehicleInput {
  vehicleType: VehicleType;
  make: string;
  model: string;
  modelYear: number;
  vin?: string | null;
  plate?: string | null;
  usageValue: number;
  usageUnit: UsageUnit;
  city?: string | null;
}

/**
 * Resultado del autocompletado por VIN. `found: false` no es un error: NHTSA
 * solo cubre vehiculos homologados en EE.UU.
 */
export interface VinLookup {
  vin: string;
  found: boolean;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  vehicleType: VehicleType | null;
}

/** Errores de validacion del API, por campo. */
export interface ValidationErrors {
  errors: Record<string, string[]>;
}

export interface Recall {
  campaignNumber: string;
  manufacturer: string | null;
  component: string | null;
  summary: string | null;
  consequence: string | null;
  remedy: string | null;
  reportedOn: string | null;
  /** NHTSA marca asi los recalls graves: no manejar el vehiculo. */
  parkIt: boolean;
  /** No parquear bajo techo: riesgo de incendio. */
  parkOutside: boolean;
}

export interface RecallsResponse {
  vehicleId: number;
  recalls: Recall[];
}
