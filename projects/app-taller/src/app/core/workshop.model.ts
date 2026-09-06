/** Espejo de lo que responde el API. Nunca se recalcula nada aca. */

export interface OfferVehicle {
  vehicleType: string;
  make: string;
  model: string;
  modelYear: number;
}

export interface ServiceOffer {
  id: number;
  status: string;
  priceCents: number | null;
  expiresAt: string | null;
  request: {
    id: number;
    kind: string;
    scheduledFor: string | null;
    address: string | null;
    notes: string | null;
  };
  vehicle: OfferVehicle;
}

export type OrderStatus = 'assigned' | 'en_route' | 'in_progress' | 'completed' | 'canceled';

export interface ServiceOrder {
  id: number;
  status: OrderStatus;
  requestId: number;
  vehicleId: number;
  technicianUserId: number;
  startedAt: string | null;
  completedAt: string | null;
  totalCents: number | null;
}

export type InspectionPhase = 'engine_off' | 'engine_idle' | 'driving';
export type ValueType = 'numeric' | 'scale' | 'boolean' | 'date';

export interface InspectionItem {
  id: number;
  code: string;
  label: string;
  phase: InspectionPhase;
  valueType: ValueType;
  unit: string | null;
  minimum: string | null;
  maximum: string | null;
  position: number;
  partTypeId: number | null;
}

export interface Observation {
  id: number;
  itemId: number;
  itemCode: string;
  partTypeId: number | null;
  value: string | number | boolean | null;
  severity: string | null;
  notes: string | null;
}

export interface Inspection {
  id: number;
  vehicleId: number;
  status: 'in_progress' | 'completed';
  usageValue: string;
  startedAt: string;
  performedAt: string | null;
  durationSeconds: number | null;
  summary: string | null;
  photoCount: number;
  observations: Observation[];
  items?: InspectionItem[];
}

export interface ObservationInput {
  itemId: number;
  numericValue?: number | null;
  scaleValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  severity?: string | null;
  notes?: string | null;
}

/** El orden en que se recorre la visita. Lo marca el API, pero la app lo rotula. */
export const PHASE_LABELS: Record<InspectionPhase, string> = {
  engine_off: 'Motor apagado',
  engine_idle: 'Encendido quieto',
  driving: 'Andando',
};

export const PHASE_ORDER: InspectionPhase[] = ['engine_off', 'engine_idle', 'driving'];
