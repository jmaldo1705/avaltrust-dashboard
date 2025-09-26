import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private uiState = inject(UiStateService);

  @Input() isSidebarOpen = false;
  @Input() isUserMenuOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleUserMenu = new EventEmitter<void>();
  @Output() closeUserMenu = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  userProfile = this.auth.userProfile;

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onToggleUserMenu() {
    this.toggleUserMenu.emit();
  }

  onCloseUserMenu() {
    this.closeUserMenu.emit();
  }

  onNavigate(route: string) {
    this.navigate.emit(route);
  }

  onLogout() {
    this.logout.emit();
  }

  // Método getUserAvatar corregido - sin referencia a avatar
  getUserAvatar(): string {
    const profile = this.userProfile();

    // Si tiene username, usar la inicial
    if (profile?.username) {
      const initial = profile.username.charAt(0).toUpperCase();
      return `https://via.placeholder.com/44x44/3b82f6/fff?text=${initial}`;
    }

    // Avatar por defecto
    return 'https://via.placeholder.com/44x44/3b82f6/fff?text=U';
  }

  // Métodos adicionales útiles para el header
  getUserDisplayName(): string {
    const profile = this.userProfile();
    return profile?.username || 'Usuario';
  }

  getUserRoleDisplay(): string {
    const profile = this.userProfile();

    if (!profile) {
      return 'Usuario';
    }

    // Verificar roles específicos
    if (this.auth.hasRole('ROLE_ADMIN') || profile.isAdmin) {
      return 'Administrador';
    }

    if (this.auth.hasRole('ROLE_MANAGER')) {
      return 'Gerente';
    }

    if (this.auth.hasRole('ROLE_SUPERVISOR')) {
      return 'Supervisor';
    }

    if (this.auth.hasRole('ROLE_ANALYST')) {
      return 'Analista';
    }

    if (this.auth.hasRole('ROLE_USER')) {
      return 'Usuario';
    }

    // Fallback: usar el primer rol disponible y formatearlo
    if (profile.roles && profile.roles.length > 0) {
      const primaryRole = profile.roles[0];
      return this.formatRoleName(primaryRole);
    }

    return 'Usuario';
  }

  private formatRoleName(role: string): string {
    // Remover prefijo ROLE_ si existe
    const cleanRole = role.replace('ROLE_', '');

    // Convertir a formato legible
    switch (cleanRole.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'supervisor': return 'Supervisor';
      case 'analyst': return 'Analista';
      case 'user': return 'Usuario';
      case 'guest': return 'Invitado';
      default:
        // Capitalizar primera letra y reemplazar guiones bajos con espacios
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  }
}
