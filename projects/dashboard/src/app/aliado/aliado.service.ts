import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AliadoEstrategico, AliadoEstrategicoRequest } from './aliado.interface';

/**
 * Servicio para gestión de Aliados Estratégicos
 */
@Injectable({
  providedIn: 'root'
})
export class AliadoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080'}/api/aliados-estrategicos`;

  /**
   * Obtener todos los aliados estratégicos (solo ADMIN)
   */
  getAll(): Observable<AliadoEstrategico[]> {
    return this.http.get<AliadoEstrategico[]>(this.apiUrl, { withCredentials: true })
      .pipe(
        map(aliados => aliados.map(a => this.parseAliadoDates(a))),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener solo aliados activos
   */
  getActivos(): Observable<AliadoEstrategico[]> {
    return this.http.get<AliadoEstrategico[]>(`${this.apiUrl}/activos`, { withCredentials: true })
      .pipe(
        map(aliados => aliados.map(a => this.parseAliadoDates(a))),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener aliado por ID
   */
  getById(id: number): Observable<AliadoEstrategico> {
    return this.http.get<AliadoEstrategico>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(
        map(a => this.parseAliadoDates(a)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener aliado por NIT
   */
  getByNit(nit: string): Observable<AliadoEstrategico> {
    return this.http.get<AliadoEstrategico>(`${this.apiUrl}/nit/${nit}`, { withCredentials: true })
      .pipe(
        map(a => this.parseAliadoDates(a)),
        catchError(this.handleError)
      );
  }

  /**
   * Crear nuevo aliado estratégico (solo ADMIN)
   */
  create(request: AliadoEstrategicoRequest): Observable<AliadoEstrategico> {
    return this.http.post<AliadoEstrategico>(this.apiUrl, request, { withCredentials: true })
      .pipe(
        map(a => this.parseAliadoDates(a)),
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar aliado estratégico (solo ADMIN)
   */
  update(id: number, request: AliadoEstrategicoRequest): Observable<AliadoEstrategico> {
    return this.http.put<AliadoEstrategico>(`${this.apiUrl}/${id}`, request, { withCredentials: true })
      .pipe(
        map(a => this.parseAliadoDates(a)),
        catchError(this.handleError)
      );
  }

  /**
   * Desactivar aliado estratégico (solo ADMIN)
   */
  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      withCredentials: true, 
      responseType: 'text' 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Activar aliado estratégico (solo ADMIN)
   */
  activate(id: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/${id}/activate`, {}, { 
      withCredentials: true, 
      responseType: 'text' 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Parsear fechas del formato ISO string a Date
   */
  private parseAliadoDates(aliado: any): AliadoEstrategico {
    return {
      ...aliado,
      fechaCreacion: aliado.fechaCreacion ? new Date(aliado.fechaCreacion) : undefined,
      fechaModificacion: aliado.fechaModificacion ? new Date(aliado.fechaModificacion) : undefined
    };
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 404) {
        errorMessage = 'Aliado estratégico no encontrado';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 400) {
        errorMessage = error.error || 'Datos inválidos';
      } else if (error.status === 409) {
        errorMessage = 'Ya existe un aliado con ese NIT';
      } else {
        errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('AliadoService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
