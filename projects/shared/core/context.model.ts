/**
 * Un contexto es "en nombre de quien actuas". El de cliente lo tiene todo el
 * mundo y no depende de ninguna membresia: cualquiera puede registrar su
 * vehiculo. Los demas salen de las membresias aceptadas en el API.
 */
export type ContextKind = 'client' | 'workshop' | 'store';

export interface ActorContext {
  kind: ContextKind;
  organizationId?: number;
  name?: string;
  role?: string;
}

export interface MeResponse {
  user: { id: number; email: string; name: string | null; createdAt: string };
  contexts: ActorContext[];
  activeContext: ActorContext;
}

/** Donde vive cada app dentro del mismo dominio. */
export const CONTEXT_PATHS: Record<ContextKind, string> = {
  client: '/cliente',
  workshop: '/taller',
  store: '/almacen',
};
