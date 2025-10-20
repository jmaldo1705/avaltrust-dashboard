import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AdminCursosService, CursoAdmin } from './admin-cursos.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-admin-cursos',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './admin-cursos.component.html',
  styleUrls: ['./admin-cursos.component.css']
})
export class AdminCursosComponent implements OnInit {
  private adminCursosService = inject(AdminCursosService);
  private router = inject(Router);
  private authService = inject(AuthService);

  cursos: CursoAdmin[] = [];
  loading = false;
  isSidebarOpen = false;
  isUserMenuOpen = false;
  cursoEliminar: CursoAdmin | null = null;
  showDeleteModal = false;

  ngOnInit(): void {
    // Verificar que sea admin
    if (!this.authService.hasRole('ROLE_ADMIN')) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.loading = true;
    this.adminCursosService.listarCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos.sort((a, b) => a.orden - b.orden);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar cursos:', error);
        this.loading = false;
      }
    });
  }

  nuevoCurso(): void {
    this.router.navigate(['/admin/cursos/nuevo']);
  }

  editarCurso(id: number): void {
    this.router.navigate(['/admin/cursos/editar', id]);
  }

  editarEvaluacion(id: number): void {
    this.router.navigate(['/admin/cursos', id, 'evaluacion']);
  }

  confirmarEliminar(curso: CursoAdmin): void {
    this.cursoEliminar = curso;
    this.showDeleteModal = true;
  }

  cancelarEliminar(): void {
    this.cursoEliminar = null;
    this.showDeleteModal = false;
  }

  eliminarCurso(): void {
    if (!this.cursoEliminar?.id) return;
    
    this.adminCursosService.eliminarCurso(this.cursoEliminar.id).subscribe({
      next: () => {
        this.cargarCursos();
        this.cancelarEliminar();
      },
      error: (error) => {
        console.error('Error al eliminar curso:', error);
        alert('Error al eliminar el curso. Puede que tenga datos asociados.');
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  handleSidebarClose(): void {
    this.isSidebarOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  handleUserMenuClose(): void {
    this.isUserMenuOpen = false;
  }

  onHeaderNavigate(path: string): void {
    this.router.navigate([path]);
  }

  onSidebarNavigate(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
