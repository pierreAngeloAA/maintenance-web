import { environment } from '@shared/environments/environment';

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

/**
 * Donde vive cada app.
 *
 * Sale del entorno y no de una constante fija porque en desarrollo las tres
 * corren en puertos distintos: una ruta suelta como `/cliente` se resolveria
 * contra el origen actual y mandaria al taller a `localhost:4201/cliente`, que
 * no existe. En produccion las tres salen del mismo dominio y el prefijo basta.
 */
export const CONTEXT_PATHS: Record<ContextKind, string> = environment.appUrls;
