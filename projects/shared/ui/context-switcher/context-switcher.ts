import { Component, computed, inject } from '@angular/core';

import { AppNavigator } from '@shared/core/app-navigator';
import { ContextService } from '@shared/core/context.service';
import { ActorContext } from '@shared/core/context.model';

const KIND_LABELS: Record<string, string> = {
  client: 'Mis vehiculos',
  workshop: 'Taller',
  store: 'Almacen',
};

/**
 * Selector de contexto, al estilo del de Google.
 *
 * No aparece cuando solo hay uno: la mayoria de la gente nunca lo va a ver.
 * Cambiar de contexto es navegar a la otra app del mismo dominio, asi que la
 * sesion viaja sola en localStorage y no hay que volver a iniciar sesion.
 */
@Component({
  selector: 'app-context-switcher',
  templateUrl: './context-switcher.html',
  styleUrl: './context-switcher.scss',
})
export class ContextSwitcher {
  private readonly context = inject(ContextService);
  private readonly navigator = inject(AppNavigator);

  readonly contexts = this.context.contexts;
  readonly active = this.context.active;
  readonly visible = computed(() => this.contexts().length > 1);

  label(context: ActorContext): string {
    const kind = KIND_LABELS[context.kind] ?? context.kind;

    return context.name ? `${kind}: ${context.name}` : kind;
  }

  isActive(context: ActorContext): boolean {
    const active = this.active();

    return active?.kind === context.kind && active?.organizationId === context.organizationId;
  }

  switchTo(context: ActorContext): void {
    if (this.isActive(context)) {
      return;
    }

    this.context.select(context);
    // Cada contexto es otra app del mismo dominio: se sale del router.
    this.navigator.go(this.context.pathFor(context));
  }
}
