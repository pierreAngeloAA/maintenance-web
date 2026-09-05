import { Injectable } from '@angular/core';

/**
 * Navegacion entre las tres apps.
 *
 * Cambiar de contexto no es una ruta del router sino otra aplicacion del mismo
 * dominio, asi que hay que salir del router. Va detras de un servicio para que
 * el componente no toque `window` y para poder sustituirlo en los tests.
 */
@Injectable({ providedIn: 'root' })
export class AppNavigator {
  go(path: string): void {
    window.location.assign(path);
  }
}
