import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  template: `
    <div class="admin-container">
      <h1>Panel de Administración</h1>

      <div class="user-info">
        <h3>Información del Usuario</h3>
        <p><strong>Usuario:</strong> {{ userProfile()?.username }}</p>
        <p><strong>Email:</strong> {{ userProfile()?.email }}</p>
        <p><strong>Roles:</strong> {{ userProfile()?.roles?.join(', ') }}</p>
        <p><strong>Es Admin:</strong> {{ userProfile()?.isAdmin ? 'Sí' : 'No' }}</p>
      </div>

      <div class="permissions-info">
        <h3>Permisos</h3>
        <div *ngIf="userPermissions() as permissions">
          <p><strong>Ver Panel Admin:</strong> {{ permissions.permissions.canViewAdminPanel ? 'Sí' : 'No' }}</p>
          <p><strong>Gestionar Usuarios:</strong> {{ permissions.permissions.canManageUsers ? 'Sí' : 'No' }}</p>
        </div>
      </div>

      <div class="admin-actions">
        <h3>Acciones de Administrador</h3>

        <button
          *appHasRole="'ROLE_ADMIN'"
          class="btn btn-primary"
          (click)="manageUsers()">
          Gestionar Usuarios
        </button>

        <button
          *appHasRole="'ROLE_ADMIN'"
          class="btn btn-secondary"
          (click)="viewReports()">
          Ver Reportes
        </button>
      </div>

      <div class="navigation">
        <button class="btn btn-outline" (click)="goToUserArea()">
          Ir al Área de Usuario
        </button>
        <button class="btn btn-danger" (click)="logout()">
          Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
    }

    .user-info, .permissions-info, .admin-actions {
      margin: 2rem 0;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .btn {
      margin: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-outline { background: transparent; border: 1px solid #007bff; color: #007bff; }
    .btn-danger { background: #dc3545; color: white; }
  `]
})
export class AdminComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.userProfile;
  userPermissions = this.authService.userPermissions;

  manageUsers() {
    // Lógica para gestionar usuarios
    alert('Funcionalidad de gestión de usuarios');
  }

  viewReports() {
    // Lógica para ver reportes
    alert('Funcionalidad de reportes');
  }

  goToUserArea() {
    this.router.navigate(['/user']);
  }

  logout() {
    this.authService.logout(true);
  }
}
