import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  recoveryEmail = '';
  acceptTerms = false;

  loading = signal(false);
  recoveryLoading = signal(false);
  error = signal('');
  notice = signal('');
  recoveryError = signal('');
  recoveryMessage = signal('');
  showRecovery = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (this.route.snapshot.queryParamMap.get('reset') === 'success') {
      this.notice.set('Contraseña actualizada. Ya puedes iniciar sesión.');
    }
  }

  onSubmit() {
    if (this.loading()) return;

    this.error.set('');
    this.notice.set('');

    if (!this.username.trim() || !this.password) {
      this.error.set('Ingresa tu usuario y contraseña.');
      return;
    }

    if (!this.acceptTerms) {
      this.error.set('Debes aceptar los términos y la política de privacidad.');
      return;
    }

    this.loading.set(true);

    this.auth.login(this.username.trim(), this.password)
      .subscribe({
        next: () => {
          this.loading.set(false);

          const user = this.auth.user();
          if (user && (user as any).mustChangePassword) {
            this.router.navigate(['/change-password']);
            return;
          }

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

          if (returnUrl && returnUrl !== '/admin' && returnUrl !== '/user') {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.error.set(err?.message || 'No se pudo iniciar sesión');
          this.loading.set(false);
        }
      });
  }

  openRecovery() {
    this.showRecovery.set(true);
    this.recoveryError.set('');
    this.recoveryMessage.set('');

    if (!this.recoveryEmail && this.username.includes('@')) {
      this.recoveryEmail = this.username.trim();
    }
  }

  closeRecovery() {
    this.showRecovery.set(false);
    this.recoveryError.set('');
    this.recoveryMessage.set('');
  }

  requestPasswordReset() {
    if (this.recoveryLoading()) return;

    const email = this.recoveryEmail.trim();
    this.recoveryError.set('');
    this.recoveryMessage.set('');

    if (!email) {
      this.recoveryError.set('Ingresa el correo registrado en AvalTrust.');
      return;
    }

    this.recoveryLoading.set(true);

    this.auth.requestPasswordReset(email).subscribe({
      next: (response) => {
        this.recoveryLoading.set(false);
        this.recoveryMessage.set(response.message || 'Si el correo está registrado, enviaremos un enlace de recuperación.');
      },
      error: (err) => {
        this.recoveryLoading.set(false);
        this.recoveryError.set(err?.message || 'No pudimos enviar el correo de recuperación.');
      }
    });
  }
}
