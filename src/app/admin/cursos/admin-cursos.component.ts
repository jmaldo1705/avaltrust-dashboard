import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  LucideBookOpen,
  LucideChevronLeft,
  LucideChevronRight,
  LucideClipboardCheck,
  LucideFileText,
  LucideGripVertical,
  LucideInfo,
  LucideListFilter,
  LucideLoaderCircle,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideTrash2,
  LucideX
} from '@lucide/angular';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AdminCursosService, CursoAdmin } from './admin-cursos.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-admin-cursos',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    LucideBookOpen,
    LucideChevronLeft,
    LucideChevronRight,
    LucideClipboardCheck,
    LucideFileText,
    LucideGripVertical,
    LucideInfo,
    LucideListFilter,
    LucideLoaderCircle,
    LucidePencil,
    LucidePlus,
    LucideRefreshCw,
    LucideShieldCheck,
    LucideTrash2,
    LucideX
  ],
  templateUrl: './admin-cursos.component.html',
  styleUrls: ['./admin-cursos.component.css']
})
export class AdminCursosComponent implements OnInit {
  private adminCursosService = inject(AdminCursosService);
  private router = inject(Router);
  private authService = inject(AuthService);

  cursos: CursoAdmin[] = [];
  loading = false;
  isReordering = false;
  errorMessage = '';
  isSidebarOpen = false;
  isUserMenuOpen = false;
  cursoEliminar: CursoAdmin | null = null;
  showDeleteModal = false;
  draggedCurso: CursoAdmin | null = null;
  draggedOverIndex: number | null = null;

  currentPage = 0;
  pageSize = 10;
  totalCursos = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50];

  ngOnInit(): void {
    if (!this.authService.hasRole('ROLE_ADMIN')) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.cargarCursos();
  }

  get rangeStart(): number {
    return this.totalCursos === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalCursos);
  }

  get pageNumbers(): number[] {
    if (this.totalPages <= 1) return [];

    const windowSize = 5;
    let start = Math.max(0, this.currentPage - Math.floor(windowSize / 2));
    let end = Math.min(this.totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);

    const pages: number[] = [];
    for (let page = start; page <= end; page++) {
      pages.push(page);
    }
    return pages;
  }

  cargarCursos(page = this.currentPage): void {
    const targetPage = Math.max(page, 0);
    this.loading = true;
    this.errorMessage = '';

    this.adminCursosService.listarCursosPaginados(targetPage, this.pageSize).subscribe({
      next: (response) => {
        this.cursos = [...(response.content || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        this.currentPage = response.number ?? targetPage;
        this.pageSize = response.size ?? this.pageSize;
        this.totalCursos = response.totalElements ?? this.cursos.length;
        this.totalPages = response.totalPages ?? Math.ceil(this.totalCursos / this.pageSize);
        this.loading = false;

        if (this.totalPages > 0 && this.currentPage >= this.totalPages) {
          this.cargarCursos(this.totalPages - 1);
        }
      },
      error: (error) => {
        console.error('Error al cargar cursos:', error);
        this.errorMessage = 'No fue posible cargar los cursos. Intenta nuevamente.';
        this.cursos = [];
        this.loading = false;
      }
    });
  }

  refrescarCursos(): void {
    this.cargarCursos(this.currentPage);
  }

  cambiarTamanoPagina(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize = Number.isFinite(value) && value > 0 ? value : 10;
    this.cargarCursos(0);
  }

  irAPagina(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage || this.loading) return;
    this.cargarCursos(page);
  }

  paginaAnterior(): void {
    this.irAPagina(this.currentPage - 1);
  }

  paginaSiguiente(): void {
    this.irAPagina(this.currentPage + 1);
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

    const nextPage = this.cursos.length === 1 && this.currentPage > 0
      ? this.currentPage - 1
      : this.currentPage;

    this.adminCursosService.eliminarCurso(this.cursoEliminar.id).subscribe({
      next: () => {
        this.cancelarEliminar();
        this.cargarCursos(nextPage);
      },
      error: (error) => {
        console.error('Error al eliminar curso:', error);
        alert('Error al eliminar el curso. Puede que tenga datos asociados.');
      }
    });
  }

  onDragStart(event: DragEvent, curso: CursoAdmin): void {
    this.draggedCurso = curso;
    event.dataTransfer!.effectAllowed = 'move';
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.draggedOverIndex = index;
  }

  onDragLeave(): void {
    this.draggedOverIndex = null;
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();

    if (!this.draggedCurso) return;

    const draggedIndex = this.cursos.findIndex(c => c.id === this.draggedCurso!.id);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      this.draggedCurso = null;
      this.draggedOverIndex = null;
      return;
    }

    const cursosReordenados = [...this.cursos];
    const [cursoMovido] = cursosReordenados.splice(draggedIndex, 1);
    cursosReordenados.splice(targetIndex, 0, cursoMovido);

    const ordenesPagina = this.cursos
      .map((curso, index) => curso.orden || this.currentPage * this.pageSize + index + 1)
      .sort((a, b) => a - b);

    cursosReordenados.forEach((curso, index) => {
      curso.orden = ordenesPagina[index];
    });

    this.cursos = cursosReordenados;
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
    if (!cursos.length) return;

    this.isReordering = true;
    const actualizaciones = cursos.map(curso =>
      this.adminCursosService.actualizarCurso(curso.id!, curso)
    );

    forkJoin(actualizaciones).subscribe({
      next: () => {
        this.isReordering = false;
        this.cargarCursos(this.currentPage);
      },
      error: (error) => {
        console.error('Error al actualizar orden:', error);
        this.isReordering = false;
        alert('Error al guardar el nuevo orden. Recargando...');
        this.cargarCursos(this.currentPage);
      }
    });
  }

  visualIndex(index: number): number {
    return this.currentPage * this.pageSize + index + 1;
  }

  trackByCursoId(index: number, curso: CursoAdmin): number {
    return curso.id || index;
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
