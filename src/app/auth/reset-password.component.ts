import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login-page" aria-label="Restablecer contraseña AvalTrust">
      <section class="auth-card" [class.is-loading]="loading()">
        <div class="brand">
          <img src="assets/images/logo.png" alt="AvalTrust" />
        </div>

        <header class="auth-header">
          <h1>Nueva contraseña</h1>
          <p>Completa el cambio para continuar.</p>
        </header>

        @if (error()) {
          <div class="alert alert-danger" role="alert">{{ error() }}</div>
        }

        @if (success()) {
          <div class="alert alert-success" role="status">{{ success() }}</div>
        }

        <form (ngSubmit)="onSubmit()" novalidate>
          <div class="field">
            <label for="newPassword">Nueva contraseña</label>
            <input
              id="newPassword"
              [(ngModel)]="newPassword"
              name="newPassword"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div class="field">
            <label for="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="Repite la contraseña"
            />
          </div>

          @if (passwordsMismatch()) {
            <div class="alert alert-danger" role="alert">
              Las contraseñas no coinciden.
            </div>
          }

          <button class="btn primary" type="submit" [disabled]="!canSubmit()">
            {{ loading() ? 'Actualizando...' : 'Actualizar contraseña' }}
          </button>
          <button class="btn secondary" type="button" (click)="goToLogin()" [disabled]="loading()">
            Volver
          </button>
        </form>
      </section>
    </main>
  `,
  styleUrls: ['../login/login.component.css']
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = signal('');
  loading = signal(false);
  error = signal('');
  success = signal('');

  newPassword = '';
  confirmPassword = '';

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(token);

    if (!token) {
      this.error.set('El enlace de recuperación no es válido o ya expiró.');
    }
  }

  passwordsMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  canSubmit(): boolean {
    return !this.loading()
      && !!this.token()
      && this.newPassword.length >= 6
      && this.confirmPassword.length >= 6
      && !this.passwordsMismatch();
  }

  onSubmit() {
    if (!this.canSubmit()) return;

    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    this.auth.resetPassword(this.token(), this.newPassword).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set(response.message || 'Contraseña actualizada exitosamente.');

        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
        }, 1600);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'No pudimos actualizar la contraseña.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
