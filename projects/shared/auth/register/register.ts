import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@shared/core/auth.service';
import { APP_IDENTITY } from '@shared/core/app-identity';
import { AppNavigator } from '@shared/core/app-navigator';
import { ContextService } from '@shared/core/context.service';
import { CONTEXT_PATHS } from '@shared/core/context.model';
import { controlErrorMessage } from '@shared/forms/form-errors';
import { FIELD_LABELS, translateError } from '@shared/forms/field-messages';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: '../auth-form.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly context = inject(ContextService);
  private readonly navigator = inject(AppNavigator);
  private readonly app = inject(APP_IDENTITY);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly serverErrors = signal<Record<string, string[]>>({});

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    // Mismo minimo que valida el backend: mejor enterarse antes de enviar.
    password: ['', [Validators.required, Validators.minLength(8)]],
    name: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.serverErrors.set({});

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.enter();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        const fieldErrors = error.error?.errors;
        this.serverErrors.set(fieldErrors ?? {});
        if (!fieldErrors) {
          this.errorMessage.set('No pudimos conectarnos con el servidor. Intenta de nuevo.');
        }
      },
    });
  }

  /**
   * A donde va la persona despues de entrar.
   *
   * Cada app tiene su propia casa, y entrar por una app significa actuar en su
   * contexto: quien entra por el taller viene a trabajar, no a mirar sus
   * vehiculos. Si no tiene ese rol no se le deja en una pantalla que el API le
   * va a negar: se le manda a la app de cliente, que todo el mundo tiene.
   */
  private enter(): void {
    this.context.load().subscribe({
      next: () => this.go(),
      // Que falle /me no puede dejar a la persona parada en el login.
      error: () => this.go(),
    });
  }

  private go(): void {
    if (this.context.adopt(this.app.kind)) {
      this.router.navigateByUrl(this.app.home);

      return;
    }

    this.navigator.go(CONTEXT_PATHS.client);
  }

  protected errorFor(field: string): string | null {
    return controlErrorMessage(field, this.form.get(field));
  }

  protected errorEntries(): { label: string; messages: string[] }[] {
    return Object.entries(this.serverErrors()).map(([field, messages]) => ({
      label: FIELD_LABELS[field] ?? field,
      messages: messages.map(translateError),
    }));
  }
}
