import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HasRoleDirective } from '../auth/has-role.directive';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  template: `
    <div class="user-container">
      <h1>Área de Usuario</h1>

      <div class="user-info">
        <h3>Mi Perfil</h3>
        <p><strong>Usuario:</strong> {{ userProfile()?.username }}</p>
        <p><strong>Email:</strong> {{ userProfile()?.email }}</p>
        <p><strong>Roles:</strong> {{ userProfile()?.roles?.join(', ') }}</p>
      </div>

      <div class="user-actions">
        <h3>Mis Acciones</h3>

        <button class="btn btn-primary" (click)="viewMyData()">
          Ver Mis Datos
        </button>

        <button class="btn btn-secondary" (click)="editProfile()">
          Editar Perfil
        </button>

        <!-- Solo mostrar si es admin -->
        <button
          *appHasRole="'ROLE_ADMIN'"
          class="btn btn-info"
          (click)="goToAdmin()">
          Ir al Panel de Admin
        </button>
      </div>

      <div class="navigation">
        <button class="btn btn-outline" (click)="goToDashboard()">
          Ir al Dashboard
        </button>
        <button class="btn btn-danger" (click)="logout()">
          Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
    }

    .user-info, .user-actions {
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
    .btn-info { background: #17a2b8; color: white; }
    .btn-outline { background: transparent; border: 1px solid #007bff; color: #007bff; }
    .btn-danger { background: #dc3545; color: white; }
  `]
})
export class UserComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.userProfile;

  viewMyData() {
    alert('Ver mis datos');
  }

  editProfile() {
    alert('Editar perfil');
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout(true);
  }
}
