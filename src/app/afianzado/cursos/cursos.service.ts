import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modulo } from './curso.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/cursos`;

  getAllModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.apiUrl);
  }

  getModuloById(id: number): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.apiUrl}/${id}`);
  }

  /**
   * Descarga el certificado de un curso completado
   * @param cursoId ID del curso
   */
  descargarCertificado(cursoId: number): void {
    const certificadoUrl = `${environment.apiUrl}/api/certificados/descargar/${cursoId}`;
    
    // Usar HttpClient para incluir el token de autenticación
    this.http.get(certificadoUrl, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        // Crear blob URL del PDF
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          
          // Crear link temporal para descargar
          const link = document.createElement('a');
          link.href = url;
          link.download = `certificado-curso-${cursoId}.pdf`;
          
          // Simular click para iniciar descarga
          document.body.appendChild(link);
          link.click();
          
          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error al descargar certificado:', error);
        alert('No se pudo descargar el certificado. Por favor, intente nuevamente.');
      }
    });
  }
}
