import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionWarningComponent } from './auth/session-warning.component';
import { ToastContainerComponent } from './services/toast-container.component';
import { AuthService } from './auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SessionWarningComponent, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-session-warning 
      [show]="showSessionWarning" 
      [timeRemaining]="timeRemaining"
      (continue)="onContinueSession()"
      (logout)="onLogoutSession()"
    />
    <app-toast-container />
  `
})
export class App implements OnInit, OnDestroy {
  showSessionWarning = false;
  timeRemaining = 60;
  private warningSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Suscribirse a las advertencias de sesión
    this.warningSubscription = this.authService.sessionWarning$.subscribe(
      (secondsRemaining) => {
        this.showSessionWarning = true;
        this.timeRemaining = secondsRemaining;
      }
    );
  }

  ngOnDestroy() {
    this.warningSubscription?.unsubscribe();
  }

  onContinueSession() {
    this.showSessionWarning = false;
    this.authService.extendSession().subscribe({
      next: () => {
        console.log('Sesión extendida exitosamente');
      },
      error: (error) => {
        console.error('Error al extender sesión:', error);
        this.authService.logout(true);
      }
    });
  }

  onLogoutSession() {
    this.showSessionWarning = false;
    this.authService.logout(true).subscribe();
  }
}
