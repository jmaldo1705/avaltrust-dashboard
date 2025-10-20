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
  draggedCurso: CursoAdmin | null = null;
  draggedOverIndex: number | null = null;

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

  // Drag & Drop para reordenar
  onDragStart(event: DragEvent, curso: CursoAdmin, index: number): void {
    this.draggedCurso = curso;
    event.dataTransfer!.effectAllowed = 'move';
    // Agregar clase visual al elemento que se está arrastrando
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.draggedOverIndex = index;
  }

  onDragLeave(event: DragEvent): void {
    this.draggedOverIndex = null;
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    
    if (!this.draggedCurso) return;

    const draggedIndex = this.cursos.findIndex(c => c.id === this.draggedCurso!.id);
    
    if (draggedIndex === targetIndex) {
      this.draggedCurso = null;
      this.draggedOverIndex = null;
      return;
    }

    // Reordenar array localmente
    const cursosReordenados = [...this.cursos];
    const [cursoMovido] = cursosReordenados.splice(draggedIndex, 1);
    cursosReordenados.splice(targetIndex, 0, cursoMovido);

    // Actualizar orden numérico
    cursosReordenados.forEach((curso, index) => {
      curso.orden = index + 1;
    });

    this.cursos = cursosReordenados;

    // Guardar el nuevo orden en el backend
    this.guardarNuevoOrden(cursosReordenados);

    this.draggedCurso = null;
    this.draggedOverIndex = null;
  }

  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('dragging');
    this.draggedCurso = null;
    this.draggedOverIndex = null;
  }

  guardarNuevoOrden(cursos: CursoAdmin[]): void {
    // Actualizar cada curso con su nuevo orden
    const actualizaciones = cursos.map(curso => 
      this.adminCursosService.actualizarCurso(curso.id!, curso)
    );

    // Ejecutar todas las actualizaciones (podríamos hacerlo en paralelo con forkJoin)
    let completadas = 0;
    actualizaciones.forEach(obs => {
      obs.subscribe({
        next: () => {
          completadas++;
          if (completadas === actualizaciones.length) {
            console.log('✅ Orden actualizado correctamente');
          }
        },
        error: (error) => {
          console.error('Error al actualizar orden:', error);
          alert('Error al guardar el nuevo orden. Recargando...');
          this.cargarCursos();
        }
      });
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
