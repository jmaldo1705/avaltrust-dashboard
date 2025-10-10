import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {AuthService} from '../auth/auth.service';

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
  creadoPor?: string;
  modificadoPor?: string;
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
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/portfolio`;

  /**
   * Crear un nuevo registro de cartera
   */
  createPortfolioRecord(portfolioData: PortfolioRequest): Observable<PortfolioResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Agregar el usuario logueado a los datos de auditoría
    const user = this.authService.user();
    const dataWithAudit: PortfolioRequest = {
      ...portfolioData,
      creadoPor: user?.username || 'sistema',
      modificadoPor: user?.username || 'sistema'
    };

    return this.http.post<PortfolioResponse>(
      `${this.baseUrl}/create`,
      dataWithAudit,
      { headers }
    );
  }

  /**
   * Carga masiva de archivos
   */
  uploadPortfolioFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Agregar el usuario logueado como parámetro
    const user = this.authService.user();
    if (user?.username) {
      formData.append('creadoPor', user.username);
      formData.append('modificadoPor', user.username);
    }

    return this.http.post<FileUploadResponse>(
      `${this.baseUrl}/upload`,
      formData
    );
  }

  /**
   * Descargar plantilla de Excel
   */
  downloadTemplate(): Observable<Blob> {
    // Incluir el usuario logueado en los parámetros de la plantilla
    const user = this.authService.user();
    const params: any = {};

    if (user?.username) {
      params.generadaPor = user.username;
    }

    // Forzar cabecera Accept para evitar negociaciones de contenido que causen errores en el backend
    const headers = new HttpHeaders({
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream'
    });

    return this.http.get(`${this.baseUrl}/template/download`, {
      responseType: 'blob',
      params: params,
      headers
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

  /**
   * Obtener suma total de valor de aval (cobertura) desde el backend
   */
  getSumValorAval(): Observable<{ sumValorAval: number }> {
    return this.http.get<{ sumValorAval: number }>(`${this.baseUrl}/sum-valor-aval`);
  }
}
