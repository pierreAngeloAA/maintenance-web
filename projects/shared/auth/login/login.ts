import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@shared/core/auth.service';
import { controlErrorMessage } from '@shared/forms/form-errors';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../auth-form.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/vehicles']);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        // El API no dice cual dato fallo, y la interfaz tampoco debe inventarlo.
        this.errorMessage.set(
          error.status === 401
            ? 'Correo o contrasena incorrectos.'
            : 'No pudimos conectarnos con el servidor. Intenta de nuevo.',
        );
      },
    });
  }

  protected errorFor(field: string): string | null {
    return controlErrorMessage(field, this.form.get(field));
  }
}
