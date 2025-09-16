import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HasRoleDirective, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private readonly router = inject(Router);

  userProfile = this.auth.userProfile;
  isSidebarOpen = false;
  isUserMenuOpen = false;

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

  onSidebarNavigate(route: string) {
    this.navigateTo(route);
  }

  onSidebarClose() {
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

  // Obtener imagen de perfil (por defecto un avatar genérico)
  getUserAvatar() {
    return 'https://via.placeholder.com/40x40/007bff/fff?text=U';
  }
}
