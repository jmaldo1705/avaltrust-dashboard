import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="change-password-container">
      <div class="change-password-card">
        <div class="card-header">
          <h2>Cambio de Contraseña Requerido</h2>
          <p class="subtitle">Por seguridad, debes cambiar tu contraseña antes de continuar</p>
        </div>

        <div class="card-body">
          @if (error()) {
            <div class="alert alert-danger" role="alert">
              {{ error() }}
            </div>
          }

          @if (success()) {
            <div class="alert alert-success" role="alert">
              {{ success() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" #passwordForm="ngForm">
            <div class="form-group">
              <label for="currentPassword">Contraseña Actual</label>
              <input
                type="password"
                id="currentPassword"
                class="form-control"
                [(ngModel)]="currentPassword"
                name="currentPassword"
                required
                [disabled]="loading()"
                placeholder="Tu contraseña actual (número de documento)"
              />
              <small class="form-text text-muted">
                Tu contraseña actual es tu número de documento
              </small>
            </div>

            <div class="form-group">
              <label for="newPassword">Nueva Contraseña</label>
              <input
                type="password"
                id="newPassword"
                class="form-control"
                [(ngModel)]="newPassword"
                name="newPassword"
                required
                minlength="6"
                [disabled]="loading()"
                placeholder="Mínimo 6 caracteres"
              />
              <small class="form-text text-muted">
                Debe tener al menos 6 caracteres
              </small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                class="form-control"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                required
                [disabled]="loading()"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            @if (passwordMismatch()) {
              <div class="alert alert-warning">
                Las contraseñas no coinciden
              </div>
            }

            <div class="password-requirements">
              <p class="requirements-title">Requisitos de la contraseña:</p>
              <ul>
                <li [class.valid]="newPassword.length >= 6">Mínimo 6 caracteres</li>
                <li [class.valid]="newPassword !== currentPassword && newPassword.length > 0">
                  Diferente a la contraseña actual
                </li>
                <li [class.valid]="newPassword === confirmPassword && newPassword.length > 0">
                  Las contraseñas coinciden
                </li>
              </ul>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="loading() || !passwordForm.valid || passwordMismatch()"
            >
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
                Cambiando...
              } @else {
                Cambiar Contraseña
              }
            </button>
          </form>
        </div>

        <div class="card-footer">
          <p class="info-text">
            <i class="fas fa-info-circle"></i>
            Esta contraseña la usarás para futuros inicios de sesión
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .change-password-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }

    .card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }

    .card-header h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .card-body {
      padding: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-control:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .form-text {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }

    .alert {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .alert-danger {
      background-color: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .alert-success {
      background-color: #efe;
      color: #3c3;
      border: 1px solid #cfc;
    }

    .alert-warning {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .password-requirements {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .requirements-title {
      margin: 0 0 10px 0;
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }

    .password-requirements ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .password-requirements li {
      padding: 5px 0;
      color: #666;
      font-size: 13px;
    }

    .password-requirements li:before {
      content: "✗ ";
      color: #dc3545;
      font-weight: bold;
      margin-right: 8px;
    }

    .password-requirements li.valid:before {
      content: "✓ ";
      color: #28a745;
    }

    .password-requirements li.valid {
      color: #28a745;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-block {
      width: 100%;
    }

    .spinner-border {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
    }

    @keyframes spinner-border {
      to { transform: rotate(360deg); }
    }

    .spinner-border-sm {
      width: 0.875rem;
      height: 0.875rem;
      border-width: 0.2em;
    }

    .me-2 {
      margin-right: 0.5rem;
    }

    .card-footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }

    .info-text {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .info-text i {
      margin-right: 8px;
      color: #667eea;
    }
  `]
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  passwordMismatch = signal(false);

  constructor() {
    // Verificar que el usuario debe cambiar contraseña
    const user = this.auth.user();
    if (!user || !(user as any).mustChangePassword) {
      // Si no necesita cambiar contraseña, redirigir al dashboard
      this.auth.redirectToAppropriateRoute();
    }
  }

  onSubmit() {
    this.error.set('');
    this.success.set('');

    // Validar que las contraseñas coincidan
    if (this.newPassword !== this.confirmPassword) {
      this.passwordMismatch.set(true);
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.passwordMismatch.set(false);

    // Validar longitud mínima
    if (this.newPassword.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que sea diferente a la actual
    if (this.newPassword === this.currentPassword) {
      this.error.set('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    this.loading.set(true);

    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.success.set('Contraseña actualizada exitosamente');
        
        // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          this.auth.redirectToAppropriateRoute();
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Error al cambiar la contraseña');
      }
    });
  }
}
