import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@shared/core/auth.service';
import { ContextService } from '@shared/core/context.service';
import { APP_IDENTITY } from '@shared/core/app-identity';
import { ContextSwitcher } from '@shared/ui/context-switcher/context-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ContextSwitcher],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly context = inject(ContextService);
  private readonly app = inject(APP_IDENTITY);
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();
  protected readonly user = this.auth.user;
  protected readonly isLoggedIn = this.auth.isLoggedIn;

  constructor() {
    // Los contextos se piden una vez por carga: son los que alimentan el selector.
    if (this.auth.isLoggedIn()) {
      // Dentro de una app el contexto activo es siempre el de la app: cambiar
      // de contexto es irse a otra. Sin esto, quien llega con la sesion abierta
      // en otro contexto pide datos que el API le niega y ve un error de carga.
      this.context.load().subscribe({
        next: () => this.context.adopt(this.app.kind),
        error: () => undefined,
      });
    }
  }

  logout(): void {
    this.context.clear();
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
