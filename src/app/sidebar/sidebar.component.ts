import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  @Input() isSidebarOpen = false;
  @Input() isOpen = false;
  @Output() sidebarClose = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  userProfile = this.auth.userProfile;

  get isMenuOpen(): boolean {
    return this.isSidebarOpen || this.isOpen;
  }

  ngOnInit() {
    console.log('SidebarComponent initialized');
    console.log('UserProfile:', this.userProfile());
    console.log('IsAdmin:', this.auth.isAdmin());
    console.log('Roles:', this.userProfile()?.roles);
  }

  /**
   * Obtiene el texto a mostrar basado en el rol del usuario
   */
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

    if (this.auth.hasRole('ROLE_AFIANZADO')) {
      return 'Afianzado';
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

  /**
   * Formatea el nombre del rol para mostrarlo de manera amigable
   */
  private formatRoleName(role: string): string {
    // Remover prefijo ROLE_ si existe
    const cleanRole = role.replace('ROLE_', '');

    // Convertir a formato legible
    switch (cleanRole.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'supervisor': return 'Supervisor';
      case 'analyst': return 'Analista';
      case 'afianzado': return 'Afianzado';
      case 'user': return 'Usuario';
      case 'guest': return 'Invitado';
      default:
        // Capitalizar primera letra y reemplazar guiones bajos con espacios
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  navigateTo(route: string) {
    this.navigate.emit(route);
    this.closeSidebar();
  }

  closeSidebar() {
    this.sidebarClose.emit();
    this.close.emit(); // Emitir ambos eventos para compatibilidad
  }

  // Obtener imagen de perfil (por defecto un avatar genérico)
  getUserAvatar() {
    return 'https://via.placeholder.com/44x44/3b82f6/fff?text=U';
  }
}
