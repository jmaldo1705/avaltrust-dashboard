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
  private auth = inject(AuthService);
  private router = inject(Router);

  @Input() isSidebarOpen = false;
  @Output() sidebarClose = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();

  userProfile = this.auth.userProfile;

  // Elementos del menú para usuarios
  userMenuItems = [
    { label: 'Mis Solicitudes', icon: '📋', route: '/user/requests' },
    { label: 'Mis Documentos', icon: '📄', route: '/user/documents' },
    { label: 'Mi Perfil', icon: '👤', route: '/user/profile' },
    { label: 'Configuración', icon: '⚙️', route: '/user/settings' },
    { label: 'Contactar Soporte', icon: '📞', route: '/user/support' }
  ];

  // Elementos del menú para administradores
  adminMenuItems = [
    { label: 'Dashboard Admin', icon: '📊', route: '/admin/dashboard' },
    { label: 'Gestionar Usuarios', icon: '👥', route: '/admin/users' },
    { label: 'Reportes', icon: '📈', route: '/admin/reports' },
    { label: 'Configuración del Sistema', icon: '⚡', route: '/admin/settings' },
    { label: 'Auditoría', icon: '🔍', route: '/admin/audit' },
    { label: 'Respaldo y Restauración', icon: '💾', route: '/admin/backup' }
  ];

  navigateTo(route: string) {
    this.navigate.emit(route);
    this.closeSidebar();
  }

  closeSidebar() {
    this.sidebarClose.emit();
  }

  goToAdmin() {
    this.navigateTo('/admin');
  }

  goToUserArea() {
    this.navigateTo('/user');
  }

  // Obtener elementos del menú según el rol del usuario
  getMenuItems() {
    const profile = this.userProfile();
    if (!profile) return [];

    if (profile.isAdmin) {
      return [...this.adminMenuItems, ...this.userMenuItems];
    } else {
      return this.userMenuItems;
    }
  }

  // Obtener imagen de perfil (por defecto un avatar genérico)
  getUserAvatar() {
    return 'https://via.placeholder.com/40x40/007bff/fff?text=U';
  }
}
