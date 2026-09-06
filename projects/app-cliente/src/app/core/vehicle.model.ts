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

export type LifeUnit = 'km' | 'hours' | 'months';

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  partType: PartType;
  performedOn: string;
  /** Decimal como string, igual que usageValue. */
  usageAtService: string;
  partBrand: string | null;
  costCents: number | null;
  currency: string;
  notes: string | null;
  createdAt: string;
}

export interface MaintenanceRecordInput {
  partTypeId: number;
  performedOn: string;
  usageAtService: number;
  partBrand?: string | null;
  costCents?: number | null;
  notes?: string | null;
}

/** De donde salio el uso acumulado con el que se calculo el riesgo. */
export type RiskBasis = 'last_service' | 'vehicle_total' | 'model_year';

export interface PartRisk {
  partType: PartType;
  usageSinceService: number;
  basis: RiskBasis;
  lifeUnit: LifeUnit;
  /** 1 - R(t): que tan probable es que la pieza ya haya cumplido su vida. */
  failureProbability: number;
  /** 1 - R(t+dt)/R(t): riesgo en el proximo tramo. Es el numero util. */
  conditionalRisk: number;
  horizon: number;
  /** True mientras los parametros sean estimaciones y no datos de usuarios. */
  estimate: boolean;
  /**
   * Ajuste por el clima y el terreno de la ciudad del vehiculo: la vida
   * caracteristica de la pieza se multiplica por este factor. 1 es sin ajuste,
   * y menos de 1 significa que en ese contexto la pieza dura menos.
   */
  contextFactor: number;
}

export interface RisksResponse {
  vehicleId: number;
  risks: PartRisk[];
}

/** Lo que midio el tecnico en la ultima visita. */
export interface ReportObservation {
  id: number;
  itemId: number;
  itemCode: string;
  partTypeId: number | null;
  value: string | number | boolean | null;
  severity: string | null;
  notes: string | null;
}

/**
 * `present: false` no es lo mismo que "esta bien": es "nadie lo ha mirado". El
 * API lo dice explicitamente en vez de omitir el campo, y la interfaz tiene que
 * sostener esa distincion.
 */
export interface ReportInspection {
  present: boolean;
  id?: number;
  performedAt?: string;
  usageValue?: number;
  observations?: ReportObservation[];
}

export interface ReportDocuments {
  soatExpiresOn: string | null;
  technicalInspectionExpiresOn: string | null;
  runtCheckedAt: string | null;
}

export interface HealthReport {
  id: number;
  vehicleId: number;
  period: string;
  generatedAt: string;
  usageValue: number;
  usageUnit: string;
  risks: PartRisk[];
  inspection: ReportInspection;
  documents: ReportDocuments;
}
