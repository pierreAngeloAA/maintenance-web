import { InjectionToken } from '@angular/core';

import { ContextKind } from './context.model';

/**
 * Que app es esta.
 *
 * Las tres comparten login, registro y selector de contexto, pero cada una
 * tiene su propia casa y actua en nombre de un contexto distinto. Sin esto el
 * codigo compartido tendria que adivinar donde esta, y hasta ahora adivinaba
 * mal: mandaba a todo el mundo a `/vehicles`, que solo existe en la del
 * cliente, asi que entrar por el taller o el almacen dejaba a la persona
 * parada en el login.
 *
 * Dentro de una app el contexto activo SIEMPRE es el de la app: cambiar de
 * contexto es irse a otra app del mismo dominio, no quedarse en esta.
 */
export interface AppIdentity {
  /** En nombre de quien se actua mientras se este en esta app. */
  kind: ContextKind;
  /** La primera pantalla util despues de entrar. */
  home: string;
}

export const APP_IDENTITY = new InjectionToken<AppIdentity>('APP_IDENTITY');
