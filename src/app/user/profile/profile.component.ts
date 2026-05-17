import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import {
  LucideBadgeCheck,
  LucideCalendarClock,
  LucideCircleUserRound,
  LucideKeyRound,
  LucideMail,
  LucideRefreshCw,
  LucideShieldCheck
} from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { UiStateService } from '../../ui-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    LucideBadgeCheck,
    LucideCalendarClock,
    LucideCircleUserRound,
    LucideKeyRound,
    LucideMail,
    LucideRefreshCw,
    LucideShieldCheck
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private uiState = inject(UiStateService);
  private destroy$ = new Subject<void>();

  userProfile = this.auth.userProfile;
  user = this.auth.user;
  userPermissions = this.auth.userPermissions;
  isLoading = false;
  profileError: string | null = null;

  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  get initials(): string {
    const username = this.userProfile()?.username || this.user()?.username || 'U';
    return username.slice(0, 2).toUpperCase();
  }

  get expiresAt(): Date | null {
    const expiresIn = this.user()?.expiresIn;
    return expiresIn ? new Date(expiresIn * 1000) : null;
  }

  get roleLabels(): string[] {
    const roles = this.userProfile()?.roles || this.user()?.roles || [];
    return roles.length ? roles.map(role => this.formatRoleName(role)) : ['Sin rol asignado'];
  }

  get primaryRole(): string {
    return this.roleLabels[0] || 'Usuario';
  }

  ngOnInit() {
    this.refreshProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshProfile() {
    this.isLoading = true;
    this.profileError = null;

    this.auth.getUserProfile()
      .pipe(
        catchError(() => {
          this.profileError = 'No fue posible cargar la informacion del perfil.';
          return of(null);
        }),
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.auth.getUserPermissions()
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  toggleSidebar() {
    this.uiState.toggleSidebar();
  }

  closeSidebar() {
    this.uiState.closeSidebar();
  }

  onSidebarClose() {
    this.uiState.closeSidebar();
  }

  toggleUserMenu() {
    this.uiState.toggleUserMenu();
  }

  closeUserMenu() {
    this.uiState.closeUserMenu();
  }

  onHeaderNavigate(route: string) {
    this.navigateTo(route);
  }

  navigateTo(route: string) {
    this.uiState.closeAllMenus();
    this.router.navigate([route]);
  }

  goToChangePassword() {
    this.navigateTo('/change-password');
  }

  logout() {
    this.uiState.closeAllMenus();
    this.auth.logout(true);
  }

  private formatRoleName(role: string): string {
    const cleanRole = role.replace('ROLE_', '');

    switch (cleanRole.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'user':
        return 'Usuario';
      case 'consulta':
        return 'Consulta';
      case 'afianzado':
        return 'Afianzado';
      case 'manager':
        return 'Gerente';
      case 'supervisor':
        return 'Supervisor';
      case 'analyst':
        return 'Analista';
      default:
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  }
}
