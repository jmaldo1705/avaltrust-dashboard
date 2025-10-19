import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EvaluacionCursoDTO,
  SubmitEvaluacionDTO,
  ResultadoEvaluacionDTO,
  HistorialEvaluacionDTO,
  EstadisticasUsuarioDTO
} from './evaluacion.interface';

/**
 * Servicio para gestionar las evaluaciones de cursos
 */
@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {
  private apiUrl = 'http://localhost:8080/api/evaluaciones';
  private certificadosUrl = 'http://localhost:8080/api/certificados';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las preguntas de evaluación de un curso
   */
  obtenerEvaluacionCurso(cursoId: number): Observable<EvaluacionCursoDTO> {
    return this.http.get<EvaluacionCursoDTO>(`${this.apiUrl}/curso/${cursoId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Envía las respuestas de una evaluación
   */
  submitEvaluacion(submitDTO: SubmitEvaluacionDTO): Observable<ResultadoEvaluacionDTO> {
    return this.http.post<ResultadoEvaluacionDTO>(`${this.apiUrl}/submit`, submitDTO, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene el historial de evaluaciones del usuario
   */
  obtenerHistorialUsuario(): Observable<HistorialEvaluacionDTO[]> {
    return this.http.get<HistorialEvaluacionDTO[]>(`${this.apiUrl}/historial`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene el resultado detallado de una evaluación
   */
  obtenerResultadoEvaluacion(evaluacionId: number): Observable<ResultadoEvaluacionDTO> {
    return this.http.get<ResultadoEvaluacionDTO>(`${this.apiUrl}/${evaluacionId}/resultado`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Verifica si el usuario ha aprobado un curso
   */
  haAprobadoCurso(cursoId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/curso/${cursoId}/aprobado`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene estadísticas de evaluaciones del usuario
   */
  obtenerEstadisticasUsuario(): Observable<EstadisticasUsuarioDTO> {
    return this.http.get<EstadisticasUsuarioDTO>(`${this.apiUrl}/estadisticas`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Descarga el certificado de un curso aprobado
   */
  descargarCertificado(cursoId: number): Observable<Blob> {
    return this.http.get(`${this.certificadosUrl}/curso/${cursoId}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
