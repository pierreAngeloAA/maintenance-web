import { environment } from '../../environments/environment';

/**
 * Prefijos del API en un solo lugar.
 *
 * El backend agrupa sus controllers por audiencia: lo que es propio del cliente
 * cuelga de `/client`, y lo que comparten las tres apps (identidad y decode de
 * VIN) se queda suelto en `/api/v1`. Tener los dos prefijos aca evita repetir la
 * decision en cada servicio.
 */
const V1 = `${environment.apiUrl}/api/v1`;

/** Registro, sesion y decode de VIN: los usan las tres apps. */
export const API_SHARED = V1;

/** Vehiculos del cliente y todo lo que cuelga de ellos. */
export const API_CLIENT = `${V1}/client`;
