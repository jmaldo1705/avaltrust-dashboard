import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CursoAdmin {
  id?: number;
  titulo: string;
  descripcion: string;
  duracionEstimada: string;
  icono: string;
  introduccion: string;
  mensajeCierre: string;
  orden: number;
  objetivos: string[];
  secciones: SeccionAdmin[];
}

export interface SeccionAdmin {
  id?: number;
  titulo: string;
  orden: number;
  puntos: PuntoContenidoAdmin[];
}

export interface PuntoContenidoAdmin {
  id?: number;
  titulo: string;
  contenido: string;
  orden: number;
  ejemplos: EjemploAdmin[];
}

export interface EjemploAdmin {
  id?: number;
  titulo: string;
  descripcion: string;
  orden: number;
}

export interface PreguntaAdmin {
  id?: number;
  cursoId?: number;
  textoPregunta: string;
  orden: number;
  puntos: number;
  opciones: OpcionAdmin[];
}

export interface OpcionAdmin {
  id?: number;
  textoOpcion: string;
  esCorrecta: boolean;
  explicacion: string;
  orden: number;
}

export interface EvaluacionAdmin {
  cursoId: number;
  preguntas: PreguntaAdmin[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminCursosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/admin/cursos`;

  // CRUD de Cursos
  listarCursos(): Observable<CursoAdmin[]> {
    return this.http.get<CursoAdmin[]>(this.apiUrl);
  }

  obtenerCurso(id: number): Observable<CursoAdmin> {
    return this.http.get<CursoAdmin>(`${this.apiUrl}/${id}`);
  }

  crearCurso(curso: CursoAdmin): Observable<CursoAdmin> {
    return this.http.post<CursoAdmin>(this.apiUrl, curso);
  }

  actualizarCurso(id: number, curso: CursoAdmin): Observable<CursoAdmin> {
    return this.http.put<CursoAdmin>(`${this.apiUrl}/${id}`, curso);
  }

  eliminarCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Gestión de Evaluaciones
  obtenerEvaluacion(cursoId: number): Observable<EvaluacionAdmin> {
    return this.http.get<EvaluacionAdmin>(`${this.apiUrl}/${cursoId}/evaluacion`);
  }

  guardarEvaluacion(cursoId: number, evaluacion: EvaluacionAdmin): Observable<EvaluacionAdmin> {
    return this.http.put<EvaluacionAdmin>(`${this.apiUrl}/${cursoId}/evaluacion`, evaluacion);
  }

  eliminarPregunta(cursoId: number, preguntaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cursoId}/evaluacion/preguntas/${preguntaId}`);
  }
}
