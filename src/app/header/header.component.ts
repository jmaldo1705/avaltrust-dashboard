import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @Input() isUserMenuOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleUserMenu = new EventEmitter<void>();
  @Output() closeUserMenu = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  get userProfile() {
    return this.auth.userProfile;
  }

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
    this.onCloseUserMenu();
  }

  onLogout() {
    this.logout.emit();
  }

  getUserAvatar() {
    return 'https://via.placeholder.com/40x40/007bff/fff?text=U';
  }
}
