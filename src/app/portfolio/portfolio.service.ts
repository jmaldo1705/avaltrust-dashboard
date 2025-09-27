import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PortfolioRequest {
  obligacion: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  tipoCliente: 'NATURAL' | 'JURIDICA';
  fechaDesembolso: string;
  plazoInicial: number;
  valorDesembolso: number;
  valorAval: number;
  interes: number;
  tasaAval: number;
  otrosConceptos?: number;
  abonoAval?: number;
  abonoCapital?: number;
  totalDeuda: number;
  fechaVencimiento: string;
  diasMora?: number;
  fechaPago?: string;
  estadoCredito: 'VIGENTE' | 'VENCIDO' | 'CANCELADO' | 'CASTIGADO';
  periodicidad: string;
}

export interface PortfolioResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  processedRecords?: number;
  errors?: string[];
  validationErrors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/portfolio`;

  /**
   * Crear un nuevo registro de cartera
   */
  createPortfolioRecord(portfolioData: PortfolioRequest): Observable<PortfolioResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<PortfolioResponse>(
      `${this.baseUrl}/create`,
      portfolioData,
      { headers }
    );
  }

  /**
   * Carga masiva de archivos
   */
  uploadPortfolioFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(
      `${this.baseUrl}/upload`,
      formData
    );
  }

  /**
   * Descargar plantilla de Excel
   */
  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Obtener registros de cartera con paginación
   */
  getPortfolioRecords(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/records`, {
      params: {
        page: page.toString(),
        size: size.toString()
      }
    });
  }
}
