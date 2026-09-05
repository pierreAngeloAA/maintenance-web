import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_SHARED } from './api-routes';
import { ActorContext, CONTEXT_PATHS, MeResponse } from './context.model';

const STORAGE_KEY = 'maintenance.context';

/**
 * En que contexto esta actuando la persona.
 *
 * El token no lleva el rol: cambiar de contexto es mandar otro
 * X-Organization-Id, no volver a autenticarse. Por eso el contexto activo es
 * estado del cliente y el backend lo valida en cada peticion.
 *
 * Las tres apps viven en el mismo dominio con rutas distintas, asi que
 * comparten localStorage y la sesion sobrevive al cambio.
 */
@Injectable({ providedIn: 'root' })
export class ContextService {
  private readonly http = inject(HttpClient);

  readonly contexts = signal<ActorContext[]>([]);
  readonly active = signal<ActorContext | null>(readStored());

  /** Con un solo contexto la app entra directo; con dos o mas hay que elegir. */
  readonly mustChoose = computed(() => this.contexts().length > 1 && this.active() === null);

  /** La organizacion que viaja en el header. Null cuando actua como cliente. */
  organizationId(): number | null {
    return this.active()?.organizationId ?? null;
  }

  load(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${API_SHARED}/me`).pipe(
      tap((me) => {
        this.contexts.set(me.contexts);

        // Un solo contexto no se pregunta. Y si el guardado ya no existe (le
        // revocaron la membresia), se descarta en vez de mandar un header muerto.
        if (me.contexts.length === 1) {
          this.select(me.contexts[0]);
        } else if (!this.isStillAvailable(this.active(), me.contexts)) {
          this.clear();
        }
      }),
    );
  }

  select(context: ActorContext): void {
    this.active.set(context);
    safeWrite(context);
  }

  clear(): void {
    this.active.set(null);
    safeRemove();
  }

  pathFor(context: ActorContext): string {
    return CONTEXT_PATHS[context.kind];
  }

  private isStillAvailable(active: ActorContext | null, contexts: ActorContext[]): boolean {
    if (active === null) {
      return false;
    }

    return contexts.some(
      (context) =>
        context.kind === active.kind && context.organizationId === active.organizationId,
    );
  }
}

function readStored(): ActorContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as ActorContext) : null;
  } catch {
    return null;
  }
}

function safeWrite(context: ActorContext): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Sin almacenamiento el contexto dura lo que dure la pestana.
  }
}

function safeRemove(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar.
  }
}
