import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '@shared/core/auth.service';
import { ContextService } from '@shared/core/context.service';
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
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();
  protected readonly user = this.auth.user;
  protected readonly isLoggedIn = this.auth.isLoggedIn;

  constructor() {
    // Los contextos se piden una vez por carga: son los que alimentan el selector.
    if (this.auth.isLoggedIn()) {
      this.context.load().subscribe({ error: () => undefined });
    }
  }

  logout(): void {
    this.context.clear();
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
