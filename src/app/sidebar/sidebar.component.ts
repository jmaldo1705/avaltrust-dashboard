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

  // Método para verificar si una ruta está activa
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  navigateTo(route: string) {
    this.navigate.emit(route);
    this.closeSidebar();
  }

  closeSidebar() {
    this.sidebarClose.emit();
  }

  // Obtener imagen de perfil (por defecto un avatar genérico)
  getUserAvatar() {
    return 'https://via.placeholder.com/44x44/3b82f6/fff?text=U';
  }
}
