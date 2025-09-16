import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private readonly router = inject(Router);

  userProfile = this.auth.userProfile;
  isSidebarOpen = false;
  isUserMenuOpen = false;

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

  ngOnInit() {
    // Cargar datos del usuario si no están disponibles
    if (!this.userProfile()) {
      this.auth.getUserProfile().subscribe();
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeSidebar();
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
    this.closeSidebar();
  }

  goToUserArea() {
    this.router.navigate(['/user']);
    this.closeSidebar();
  }

  logout() {
    this.auth.logout(true);
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
