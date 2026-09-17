import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CertificadoIngresosRequest {
  aliadoId: number;
  fechaInicio: string; // formato ISO: YYYY-MM-DD
  fechaFin: string;
  nombreContador?: string;
  tarjetaProfesional?: string;
}

export interface CertificadoIngresosResponse {
  aliadoId: number;
  nombreAliado: string;
  nitAliado: string;
  periodoTexto: string;
  fechaCertificado: string;
  cantidadCreditos: number;
  valorComisionExento: number;
  ivaExento: number;
  valorTotalExento: number;
  valorComisionGravado: number;
  ivaGravado: number;
  valorTotalGravado: number;
  totalValorComision: number;
  totalIva: number;
  granTotal: number;
  nombreContador: string;
  tarjetaProfesional: string;
  nombreRepresentanteLegal: string;
}

@Injectable({
  providedIn: 'root'
})
export class CertificadosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/certificados`;

  /**
   * Obtener vista previa de los datos del certificado de ingresos
   */
  previewCertificadoIngresos(aliadoId: number, fechaInicio: string, fechaFin: string): Observable<CertificadoIngresosResponse> {
    const params = new HttpParams()
      .set('aliadoId', aliadoId.toString())
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<CertificadoIngresosResponse>(`${this.apiUrl}/ingresos/preview`, { params });
  }

  /**
   * Descargar el PDF del certificado de ingresos
   */
  downloadCertificadoIngresos(aliadoId: number, fechaInicio: string, fechaFin: string): Observable<Blob> {
    const params = new HttpParams()
      .set('aliadoId', aliadoId.toString())
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get(`${this.apiUrl}/ingresos/download`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Generar certificado vía POST (para datos adicionales)
   */
  generateCertificadoIngresos(request: CertificadoIngresosRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/ingresos/generate`, request, {
      responseType: 'blob'
    });
  }

  /**
   * Descargar archivo blob
   */
  downloadFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formatear moneda colombiana
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
