import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AdminCursosService, CursoAdmin, SeccionAdmin, PuntoContenidoAdmin, EjemploAdmin } from './admin-cursos.service';

@Component({
  selector: 'app-curso-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './curso-form.component.html',
  styleUrls: ['./curso-form.component.css']
})
export class CursoFormComponent implements OnInit {
  private adminCursosService = inject(AdminCursosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  cursoId?: number;
  loading = false;
  saving = false;
  isSidebarOpen = false;
  isUserMenuOpen = false;

  curso: CursoAdmin = {
    titulo: '',
    descripcion: '',
    duracionEstimada: '',
    icono: '📚',
    introduccion: '',
    mensajeCierre: '',
    orden: 1,
    objetivos: [''],
    secciones: []
  };

  seccionExpandida: number | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.cursoId = +params['id'];
        this.cargarCurso();
      }
    });
  }

  cargarCurso(): void {
    if (!this.cursoId) return;
    
    this.loading = true;
    this.adminCursosService.obtenerCurso(this.cursoId).subscribe({
      next: (curso) => {
        this.curso = curso;
        if (!this.curso.objetivos || this.curso.objetivos.length === 0) {
          this.curso.objetivos = [''];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar curso:', error);
        this.loading = false;
        alert('Error al cargar el curso');
        this.router.navigate(['/admin/cursos']);
      }
    });
  }

  guardarCurso(): void {
    // Validaciones básicas
    if (!this.curso.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }
    if (!this.curso.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    // Limpiar objetivos vacíos
    this.curso.objetivos = this.curso.objetivos.filter(obj => obj.trim() !== '');

    this.saving = true;
    const request = this.isEditMode && this.cursoId
      ? this.adminCursosService.actualizarCurso(this.cursoId, this.curso)
      : this.adminCursosService.crearCurso(this.curso);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin/cursos']);
      },
      error: (error) => {
        console.error('Error al guardar curso:', error);
        this.saving = false;
        alert('Error al guardar el curso');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/cursos']);
  }

  // Gestión de objetivos
  trackByIndex(index: number): number {
    return index;
  }

  actualizarObjetivo(index: number, valor: string): void {
    this.curso.objetivos[index] = valor;
  }

  agregarObjetivo(): void {
    this.curso.objetivos.push('');
  }

  eliminarObjetivo(index: number): void {
    this.curso.objetivos.splice(index, 1);
  }

  // Gestión de secciones
  agregarSeccion(): void {
    const nuevaSeccion: SeccionAdmin = {
      titulo: '',
      orden: this.curso.secciones.length + 1,
      puntos: []
    };
    this.curso.secciones.push(nuevaSeccion);
    this.seccionExpandida = this.curso.secciones.length - 1;
  }

  eliminarSeccion(index: number): void {
    if (confirm('¿Eliminar esta sección?')) {
      this.curso.secciones.splice(index, 1);
      // Reordenar
      this.curso.secciones.forEach((sec, i) => sec.orden = i + 1);
    }
  }

  toggleSeccion(index: number): void {
    this.seccionExpandida = this.seccionExpandida === index ? null : index;
  }

  // Gestión de puntos de contenido
  agregarPunto(seccionIndex: number): void {
    const seccion = this.curso.secciones[seccionIndex];
    const nuevoPunto: PuntoContenidoAdmin = {
      titulo: '',
      contenido: '',
      orden: seccion.puntos.length + 1,
      ejemplos: []
    };
    seccion.puntos.push(nuevoPunto);
  }

  eliminarPunto(seccionIndex: number, puntoIndex: number): void {
    const seccion = this.curso.secciones[seccionIndex];
    seccion.puntos.splice(puntoIndex, 1);
    // Reordenar
    seccion.puntos.forEach((p, i) => p.orden = i + 1);
  }

  // Gestión de ejemplos (ahora pertenecen a puntos de contenido)
  agregarEjemplo(seccionIndex: number, puntoIndex: number): void {
    const punto = this.curso.secciones[seccionIndex].puntos[puntoIndex];
    const nuevoEjemplo: EjemploAdmin = {
      titulo: '',
      descripcion: '',
      orden: punto.ejemplos.length + 1
    };
    punto.ejemplos.push(nuevoEjemplo);
  }

  eliminarEjemplo(seccionIndex: number, puntoIndex: number, ejemploIndex: number): void {
    const punto = this.curso.secciones[seccionIndex].puntos[puntoIndex];
    punto.ejemplos.splice(ejemploIndex, 1);
    // Reordenar
    punto.ejemplos.forEach((e, i) => e.orden = i + 1);
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
    this.router.navigate(['/login']);
  }
}
