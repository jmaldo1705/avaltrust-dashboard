import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AdminCursosService, PreguntaAdmin, OpcionAdmin } from './admin-cursos.service';

@Component({
  selector: 'app-evaluacion-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './evaluacion-form.component.html',
  styleUrls: ['./evaluacion-form.component.css']
})
export class EvaluacionFormComponent implements OnInit {
  private adminCursosService = inject(AdminCursosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  cursoId!: number;
  loading = false;
  saving = false;
  isSidebarOpen = false;
  isUserMenuOpen = false;
  
  preguntas: PreguntaAdmin[] = [];
  preguntaExpandida: number | null = null;

  // Método auxiliar para generar letras (A, B, C, D...)
  getLetraOpcion(index: number): string {
    return String.fromCharCode(65 + index);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.cursoId = +params['id'];
      this.cargarEvaluacion();
    });
  }

  cargarEvaluacion(): void {
    this.loading = true;
    this.adminCursosService.obtenerEvaluacion(this.cursoId).subscribe({
      next: (evaluacion) => {
        this.preguntas = evaluacion.preguntas || [];
        if (this.preguntas.length === 0) {
          this.agregarPregunta(); // Agregar una pregunta inicial si no hay ninguna
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar evaluación:', error);
        // Si no existe evaluación, crear una nueva
        this.preguntas = [];
        this.agregarPregunta();
        this.loading = false;
      }
    });
  }

  guardarEvaluacion(): void {
    // Validaciones
    if (this.preguntas.length === 0) {
      alert('Debes agregar al menos una pregunta');
      return;
    }

    for (const pregunta of this.preguntas) {
      if (!pregunta.textoPregunta.trim()) {
        alert('Todas las preguntas deben tener texto');
        return;
      }
      if (pregunta.opciones.length < 2) {
        alert('Cada pregunta debe tener al menos 2 opciones');
        return;
      }
      const correctas = pregunta.opciones.filter(op => op.esCorrecta).length;
      if (correctas === 0) {
        alert('Cada pregunta debe tener al menos una opción correcta');
        return;
      }
    }

    this.saving = true;
    const evaluacion = {
      cursoId: this.cursoId,
      preguntas: this.preguntas
    };

    this.adminCursosService.guardarEvaluacion(this.cursoId, evaluacion).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin/cursos']);
      },
      error: (error) => {
        console.error('Error al guardar evaluación:', error);
        this.saving = false;
        alert('Error al guardar la evaluación');
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/cursos']);
  }

  agregarPregunta(): void {
    const nuevaPregunta: PreguntaAdmin = {
      cursoId: this.cursoId,
      textoPregunta: '',
      orden: this.preguntas.length + 1,
      puntos: 10,
      opciones: [
        { textoOpcion: '', esCorrecta: true, explicacion: '', orden: 1 },
        { textoOpcion: '', esCorrecta: false, explicacion: '', orden: 2 }
      ]
    };
    this.preguntas.push(nuevaPregunta);
    this.preguntaExpandida = this.preguntas.length - 1;
  }

  eliminarPregunta(index: number): void {
    if (confirm('¿Eliminar esta pregunta?')) {
      this.preguntas.splice(index, 1);
      // Reordenar
      this.preguntas.forEach((p, i) => p.orden = i + 1);
    }
  }

  togglePregunta(index: number): void {
    this.preguntaExpandida = this.preguntaExpandida === index ? null : index;
  }

  agregarOpcion(preguntaIndex: number): void {
    const pregunta = this.preguntas[preguntaIndex];
    const nuevaOpcion: OpcionAdmin = {
      textoOpcion: '',
      esCorrecta: false,
      explicacion: '',
      orden: pregunta.opciones.length + 1
    };
    pregunta.opciones.push(nuevaOpcion);
  }

  eliminarOpcion(preguntaIndex: number, opcionIndex: number): void {
    const pregunta = this.preguntas[preguntaIndex];
    if (pregunta.opciones.length <= 2) {
      alert('Debe haber al menos 2 opciones');
      return;
    }
    pregunta.opciones.splice(opcionIndex, 1);
    // Reordenar
    pregunta.opciones.forEach((op, i) => op.orden = i + 1);
  }

  marcarCorrecta(preguntaIndex: number, opcionIndex: number): void {
    const pregunta = this.preguntas[preguntaIndex];
    // Desmarcar todas y marcar solo la seleccionada (opción única correcta)
    pregunta.opciones.forEach((op, i) => {
      op.esCorrecta = i === opcionIndex;
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
    this.router.navigate(['/login']);
  }
}
