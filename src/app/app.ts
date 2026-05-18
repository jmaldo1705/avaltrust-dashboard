import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SessionWarningComponent } from './auth/session-warning.component';
import { ToastContainerComponent } from './services/toast-container.component';
import { AuthService } from './auth/auth.service';
import { Subscription, filter } from 'rxjs';
import { AuditoriaService } from './admin/auditoria/auditoria.service';

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
  private navigationAuditSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private auditoriaService: AuditoriaService,
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribirse a las advertencias de sesión
    this.warningSubscription = this.authService.sessionWarning$.subscribe(
      (secondsRemaining) => {
        this.showSessionWarning = true;
        this.timeRemaining = secondsRemaining;
      }
    );

    this.navigationAuditSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        if (!this.authService.isAuthenticated()) return;
        this.auditoriaService.trackRoute(event.urlAfterRedirects).subscribe();
      });
  }

  ngOnDestroy() {
    this.warningSubscription?.unsubscribe();
    this.navigationAuditSubscription?.unsubscribe();
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
