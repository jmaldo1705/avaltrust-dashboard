import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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
  isPasswordFormOpen = false;
  isPasswordSaving = false;
  passwordError: string | null = null;
  passwordSuccess: string | null = null;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

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

  get passwordMismatch(): boolean {
    return Boolean(this.confirmPassword) && this.newPassword !== this.confirmPassword;
  }

  get passwordTooShort(): boolean {
    return Boolean(this.newPassword) && this.newPassword.length < 6;
  }

  get passwordSameAsCurrent(): boolean {
    return Boolean(this.currentPassword && this.newPassword) && this.currentPassword === this.newPassword;
  }

  get canSubmitPasswordChange(): boolean {
    return Boolean(this.currentPassword && this.newPassword && this.confirmPassword)
      && !this.passwordMismatch
      && !this.passwordTooShort
      && !this.passwordSameAsCurrent
      && !this.isPasswordSaving;
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

  togglePasswordForm() {
    this.isPasswordFormOpen = !this.isPasswordFormOpen;
    this.passwordError = null;
    this.passwordSuccess = null;

    if (!this.isPasswordFormOpen) {
      this.resetPasswordForm();
    }
  }

  submitPasswordChange() {
    this.passwordError = null;
    this.passwordSuccess = null;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Completa todos los campos para actualizar la contrasena.';
      return;
    }

    if (this.passwordTooShort) {
      this.passwordError = 'La nueva contrasena debe tener al menos 6 caracteres.';
      return;
    }

    if (this.passwordSameAsCurrent) {
      this.passwordError = 'La nueva contrasena debe ser diferente a la actual.';
      return;
    }

    if (this.passwordMismatch) {
      this.passwordError = 'Las contrasenas no coinciden.';
      return;
    }

    this.isPasswordSaving = true;

    this.auth.changePassword(this.currentPassword, this.newPassword)
      .pipe(
        finalize(() => this.isPasswordSaving = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.passwordSuccess = 'Contrasena actualizada correctamente.';
          this.resetPasswordForm();
          this.isPasswordFormOpen = false;
          this.refreshProfile();
        },
        error: (error) => {
          this.passwordError = error?.message || 'No fue posible actualizar la contrasena.';
        }
      });
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

  private resetPasswordForm() {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
