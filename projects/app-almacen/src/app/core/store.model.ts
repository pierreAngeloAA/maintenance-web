/** Espejo de lo que responde el API. Aca no se recalcula nada. */

export interface PartType {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  sku: string | null;
  description: string | null;
  unitPriceCents: number;
  currency: string;
  stockQuantity: number;
  status: 'draft' | 'published' | 'archived';
  available: boolean;
  /** Sin compatibilidad declarada sirve para todo: es una propiedad, no un dato faltante. */
  universal: boolean;
  partType: PartType | null;
  organizationId: number;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  brand: string;
  sku?: string | null;
  unitPriceCents: number;
  stockQuantity: number;
  status?: string;
  partTypeId?: number | null;
}

export interface Fitment {
  id: number;
  productId: number;
  vehicleType: string;
  /** Nulo significa "cualquiera": toda la marca, o toda la linea. */
  make: string | null;
  model: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

export interface FitmentInput {
  vehicleType: string;
  make?: string | null;
  model?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
}

export interface OrderItem {
  id: number;
  productName: string;
  productBrand: string;
  productSku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled';

export interface Order {
  id: number;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  address: string | null;
  placedAt: string;
  buyerType: string;
  buyerId: number;
  items: OrderItem[];
  payments: { id: number; gateway: string; gatewayRef: string | null; status: string }[];
}

/** Hacia donde puede avanzar cada venta. Espejo de lo que valida el API. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'canceled'],
  paid: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: [],
  canceled: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  shipped: 'Despachada',
  delivered: 'Entregada',
  canceled: 'Cancelada',
};
