import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@shared/core/auth.service';
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
        this.router.navigate(['/vehicles']);
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
