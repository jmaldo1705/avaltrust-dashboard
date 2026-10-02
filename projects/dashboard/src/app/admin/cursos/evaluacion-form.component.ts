import { Component, Injector, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { focusFieldAfterRender } from '../../ui/focus-field';
import { AdminCursosService, PreguntaAdmin, OpcionAdmin } from './admin-cursos.service';

/**
 * Regla que incumple una pregunta al guardar (la primera, en el orden de
 * siempre): sin texto, menos de 2 opciones o sin opcion correcta. El mensaje
 * de cada una esta en la plantilla, junto a la pregunta.
 */
export type PreguntaError = 'texto' | 'opciones' | 'correcta';

@Component({
  selector: 'app-evaluacion-form',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './evaluacion-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./evaluacion-form.component.css']
})
export class EvaluacionFormComponent implements OnInit {
  private adminCursosService = inject(AdminCursosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private injector = inject(Injector);

  cursoId!: number;
  loading = false;
  saving = false;
  isSidebarOpen = false;
  isUserMenuOpen = false;

  preguntas: PreguntaAdmin[] = [];
  preguntaExpandida: number | null = null;

  /** Se intento guardar sin preguntas. */
  sinPreguntas = false;
  /** Error de cada pregunta en el ultimo intento de guardar. */
  private erroresPregunta = new Map<PreguntaAdmin, PreguntaError>();

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
    // Validaciones: cada error se muestra junto a su pregunta y el foco va al
    // primero (el campo o el boton que lo corrige).
    this.sinPreguntas = this.preguntas.length === 0;
    if (this.sinPreguntas) {
      this.erroresPregunta = new Map();
      focusFieldAfterRender(this.injector, 'evaluacion-agregar-pregunta');
      return;
    }

    const errores = new Map<PreguntaAdmin, PreguntaError>();
    for (const pregunta of this.preguntas) {
      const error = this.validarPregunta(pregunta);
      if (error) errores.set(pregunta, error);
    }
    this.erroresPregunta = errores;

    const primera = this.preguntas.findIndex(pregunta => errores.has(pregunta));
    if (primera >= 0) {
      const error = errores.get(this.preguntas[primera])!;
      // Las opciones solo se ven con la pregunta desplegada.
      if (error !== 'texto') this.preguntaExpandida = primera;
      focusFieldAfterRender(this.injector, this.idDelCampo(primera, error));
      return;
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
        this.toastService.error('Error al guardar la evaluación');
      }
    });
  }

  /** Error de la pregunta en el ultimo intento de guardar, o null. */
  errorDe(pregunta: PreguntaAdmin): PreguntaError | null {
    return this.erroresPregunta.get(pregunta) ?? null;
  }

  /** Id del campo o boton que corrige el error (destino del foco y de aria-describedby). */
  idDelCampo(index: number, error: PreguntaError): string {
    if (error === 'texto') return `pregunta-${index}-texto`;
    if (error === 'opciones') return `pregunta-${index}-agregar-opcion`;
    return `pregunta-${index}-correcta-0`;
  }

  /** Quita el error de texto en cuanto la pregunta tiene texto. */
  revisarTexto(pregunta: PreguntaAdmin, texto: string): void {
    if (this.errorDe(pregunta) === 'texto' && (texto ?? '').trim()) {
      this.erroresPregunta.delete(pregunta);
    }
  }

  private validarPregunta(pregunta: PreguntaAdmin): PreguntaError | null {
    if (!pregunta.textoPregunta.trim()) return 'texto';
    if (pregunta.opciones.length < 2) return 'opciones';
    if (!pregunta.opciones.some(op => op.esCorrecta)) return 'correcta';
    return null;
  }

  /** Quita el error de una pregunta si la regla que incumplia ya se cumple. */
  private revisarPregunta(pregunta: PreguntaAdmin): void {
    const error = this.errorDe(pregunta);
    if (error && error !== 'texto' && this.validarPregunta(pregunta) !== error) {
      this.erroresPregunta.delete(pregunta);
    }
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
    this.sinPreguntas = false;
  }

  eliminarPregunta(index: number): void {
    if (confirm('¿Eliminar esta pregunta?')) {
      this.erroresPregunta.delete(this.preguntas[index]);
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
    this.revisarPregunta(pregunta);
  }

  eliminarOpcion(preguntaIndex: number, opcionIndex: number): void {
    const pregunta = this.preguntas[preguntaIndex];
    if (pregunta.opciones.length <= 2) {
      this.toastService.warning('Debe haber al menos 2 opciones');
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
    this.revisarPregunta(pregunta);
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
    this.authService.logout(true);
  }
}
