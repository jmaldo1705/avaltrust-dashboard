import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EvaluacionService } from './evaluacion.service';
import {
  EvaluacionCursoDTO,
  PreguntaDTO,
  SubmitEvaluacionDTO,
  ResultadoEvaluacionDTO
} from './evaluacion.interface';

/**
 * Componente para mostrar y responder evaluaciones de cursos
 */
@Component({
  selector: 'app-evaluacion-curso',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="evaluacion-container">
      <!-- Loading -->
      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando evaluación...</p>
        </div>
      }
    
      <!-- Error -->
      @if (error) {
        <div class="error-message">
          <p>{{ error }}</p>
          <button (click)="volver()" class="btn-secondary">Volver</button>
        </div>
      }
    
      <!-- Formulario de Evaluación -->
      @if (!loading && !error && !mostrarResultado && evaluacion) {
        <div class="evaluacion-form">
          <div class="header-evaluacion">
            <h2>📝 Evaluación: {{ evaluacion.cursoTitulo }}</h2>
            <div class="info-evaluacion">
              <span class="badge">{{ evaluacion.totalPreguntas }} preguntas</span>
              <span class="badge">{{ evaluacion.puntajeTotal }} puntos totales</span>
              <span class="timer">⏱️ {{ formatearTiempo(tiempoTranscurrido) }}</span>
            </div>
          </div>
          <div class="progreso-bar">
            <div class="progreso-fill" [style.width.%]="progreso"></div>
            <span class="progreso-text">{{ respuestasCompletas }} / {{ evaluacion.totalPreguntas }}</span>
          </div>
          @for (pregunta of evaluacion.preguntas; track pregunta) {
            <div class="pregunta-container">
              <div class="pregunta-card">
                <div class="pregunta-header">
                  <span class="pregunta-numero">Pregunta {{ pregunta.orden }}</span>
                  <span class="pregunta-puntos">{{ pregunta.puntos }} puntos</span>
                </div>
                <h3 class="pregunta-texto">{{ pregunta.pregunta }}</h3>
                <div class="opciones-lista">
                  @for (opcion of pregunta.opciones; track opcion) {
                    <div
                      class="opcion-item"
                      [class.selected]="respuestas.get(pregunta.id) === opcion.id"
                      (click)="seleccionarOpcion(pregunta.id, opcion.id)">
                      <div class="radio-custom">
                        @if (respuestas.get(pregunta.id) === opcion.id) {
                          <div class="radio-inner"></div>
                        }
                      </div>
                      <span class="opcion-texto">{{ opcion.textoOpcion }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          <div class="actions-footer">
            <button (click)="volver()" class="btn-secondary">Cancelar</button>
            <button
              (click)="enviarEvaluacion()"
              class="btn-primary"
              [disabled]="!evaluacionCompleta()">
              Enviar Evaluación
            </button>
          </div>
        </div>
      }
    
      <!-- Resultado de Evaluación -->
      @if (mostrarResultado && resultado) {
        <div class="resultado-container">
          <div class="resultado-header" [class.aprobado]="resultado.aprobado" [class.no-aprobado]="!resultado.aprobado">
            <div class="resultado-icon">
              {{ resultado.aprobado ? '🎉' : '📚' }}
            </div>
            <h2>{{ resultado.aprobado ? '¡Felicitaciones!' : '¡Sigue Intentando!' }}</h2>
            <p class="resultado-subtitulo">{{ resultado.cursoTitulo }}</p>
          </div>
          <div class="resultado-stats">
            <div class="stat-card">
              <div class="stat-value">{{ resultado.puntajeObtenido }}</div>
              <div class="stat-label">de {{ resultado.puntajeTotal }} puntos</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ resultado.porcentaje }}%</div>
              <div class="stat-label">Porcentaje</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ resultado.respuestasCorrectas }}</div>
              <div class="stat-label">de {{ resultado.totalPreguntas }} correctas</div>
            </div>
          </div>
          <div class="resultado-estado">
            @if (resultado.aprobado) {
              <div class="aprobado-badge">
                ✅ APROBADO
              </div>
            }
            @if (!resultado.aprobado) {
              <div class="no-aprobado-badge">
                ⚠️ NO APROBADO (Mínimo requerido: 70%)
              </div>
            }
          </div>
          @if (resultado.mensajeCierre) {
            <div class="mensaje-cierre">
              <p>{{ resultado.mensajeCierre }}</p>
            </div>
          }
          <div class="detalle-respuestas">
            <h3>📋 Detalle de Respuestas</h3>
            @for (detalle of resultado.detalleRespuestas; track detalle) {
              <div class="detalle-item">
                <div class="detalle-pregunta">
                  <span class="detalle-icon">{{ detalle.esCorrecta ? '✅' : '❌' }}</span>
                  <span class="detalle-texto">{{ detalle.pregunta }}</span>
                </div>
                <div class="detalle-respuesta">
                  <p class="tu-respuesta">
                    <strong>Tu respuesta:</strong> {{ detalle.opcionSeleccionadaTexto }}
                  </p>
                  @if (!detalle.esCorrecta) {
                    <p class="respuesta-correcta">
                      <strong>Correcta:</strong> {{ detalle.opcionCorrectaTexto }}
                    </p>
                  }
                  <p class="puntos">{{ detalle.puntosObtenidos }} / {{ detalle.puntosPosibles }} puntos</p>
                </div>
              </div>
            }
          </div>
          <div class="actions-footer">
            <button (click)="volverAlCurso()" class="btn-secondary">Volver al Curso</button>
            @if (resultado.aprobado) {
              <button (click)="descargarCertificado()" class="btn-primary">
                📄 Descargar Certificado
              </button>
            }
            @if (!resultado.aprobado) {
              <button (click)="reintentar()" class="btn-primary">
                🔄 Intentar Nuevamente
              </button>
            }
          </div>
        </div>
      }
    </div>
    `,
  styleUrls: ['./evaluacion-curso.component.css']
})
export class EvaluacionCursoComponent implements OnInit, OnDestroy {
  cursoId!: number;
  evaluacion: EvaluacionCursoDTO | null = null;
  respuestas = new Map<number, number>(); // preguntaId -> opcionId
  loading = false;
  error = '';
  mostrarResultado = false;
  resultado: ResultadoEvaluacionDTO | null = null;
  
  // Timer
  tiempoInicio!: Date;
  tiempoTranscurrido = 0;
  timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionService: EvaluacionService
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    this.cargarEvaluacion();
    this.iniciarTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  cargarEvaluacion(): void {
    this.loading = true;
    this.evaluacionService.obtenerEvaluacionCurso(this.cursoId).subscribe({
      next: (data) => {
        this.evaluacion = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar la evaluación. Por favor, intente nuevamente.';
        this.loading = false;
        console.error('Error al cargar evaluación:', err);
      }
    });
  }

  iniciarTimer(): void {
    this.tiempoInicio = new Date();
    this.timerInterval = setInterval(() => {
      const ahora = new Date();
      this.tiempoTranscurrido = Math.floor((ahora.getTime() - this.tiempoInicio.getTime()) / 1000);
    }, 1000);
  }

  seleccionarOpcion(preguntaId: number, opcionId: number): void {
    this.respuestas.set(preguntaId, opcionId);
  }

  evaluacionCompleta(): boolean {
    if (!this.evaluacion) return false;
    return this.respuestas.size === this.evaluacion.totalPreguntas;
  }

  get respuestasCompletas(): number {
    return this.respuestas.size;
  }

  get progreso(): number {
    if (!this.evaluacion) return 0;
    return (this.respuestas.size / this.evaluacion.totalPreguntas) * 100;
  }

  enviarEvaluacion(): void {
    if (!this.evaluacionCompleta()) {
      alert('Por favor, responde todas las preguntas antes de enviar.');
      return;
    }

    const respuestasArray = Array.from(this.respuestas.entries()).map(([preguntaId, opcionId]) => ({
      preguntaId,
      opcionSeleccionadaId: opcionId
    }));

    const submitDTO: SubmitEvaluacionDTO = {
      cursoId: this.cursoId,
      respuestas: respuestasArray,
      tiempoCompletadoSegundos: this.tiempoTranscurrido
    };

    this.loading = true;
    this.evaluacionService.submitEvaluacion(submitDTO).subscribe({
      next: (resultado) => {
        this.resultado = resultado;
        this.mostrarResultado = true;
        this.loading = false;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
      },
      error: (err) => {
        this.error = 'Error al enviar la evaluación. Por favor, intente nuevamente.';
        this.loading = false;
        console.error('Error al enviar evaluación:', err);
      }
    });
  }

  formatearTiempo(segundos: number): string {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  volver(): void {
    this.router.navigate(['/escuela-financiera']);
  }

  volverAlCurso(): void {
    this.router.navigate(['/escuela-financiera', this.cursoId]);
  }

  reintentar(): void {
    this.respuestas.clear();
    this.mostrarResultado = false;
    this.resultado = null;
    this.tiempoTranscurrido = 0;
    this.iniciarTimer();
    window.scrollTo(0, 0);
  }

  descargarCertificado(): void {
    this.evaluacionService.descargarCertificado(this.cursoId).subscribe({
      next: (blob) => {
        // Crear URL temporal del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace temporal y disparar descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-curso-${this.cursoId}.pdf`;
        link.click();
        
        // Liberar memoria
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar certificado:', err);
        alert('No se pudo descargar el certificado. Por favor, intente nuevamente.');
      }
    });
  }
}
