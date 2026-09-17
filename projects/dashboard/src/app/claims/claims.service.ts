import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ClaimRequest {
  obligacion: string;
  fechaSolicitud: string;
  valorCapital: number;
  intereses: number;
  otrosConceptos: number;
  aval: string;
  direccion: string;
  codigoDepartamento: string;
  codigoCiudad: string;
  email: string;
  celular: string;
  convenioNit: string;
  nitEmpresa: string;
  creadoPor?: string;
  modificadoPor?: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface UploadClaimsResponse {
  success: boolean;
  message: string;
  processedRecords?: number;
  errors?: string[];
  validationErrors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ClaimsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/claims`;

  /**
   * Crear un nuevo registro de siniestro
   */
  createClaim(claim: ClaimRequest): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${this.apiUrl}`, claim);
  }

  /**
   * Subir archivo masivo de siniestros
   */
  uploadClaimsFile(file: File): Observable<UploadClaimsResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadClaimsResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Descargar plantilla de Excel para carga masiva
   */
  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template`, {
      responseType: 'blob'
    });
  }

  /**
   * Obtener todos los siniestros
   */
  getAllClaims(): Observable<ClaimResponse> {
    return this.http.get<ClaimResponse>(`${this.apiUrl}`);
  }

  /**
   * Obtener un siniestro por ID
   */
  getClaimById(id: number): Observable<ClaimResponse> {
    return this.http.get<ClaimResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar un siniestro
   */
  updateClaim(id: number, claim: ClaimRequest): Observable<ClaimResponse> {
    return this.http.put<ClaimResponse>(`${this.apiUrl}/${id}`, claim);
  }

  /**
   * Eliminar un siniestro
   */
  deleteClaim(id: number): Observable<ClaimResponse> {
    return this.http.delete<ClaimResponse>(`${this.apiUrl}/${id}`);
  }
}
