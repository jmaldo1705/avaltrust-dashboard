import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DashboardAfianzado } from './dashboard-afianzado.interface';

@Injectable({
  providedIn: 'root'
})
export class AfianzadoService {
  private apiUrl = `${environment.apiUrl}/api/afianzado`;

  constructor(private http: HttpClient) { }

  getDashboard(): Observable<DashboardAfianzado> {
    return this.http.get<DashboardAfianzado>(`${this.apiUrl}/dashboard`);
  }

  descargarCertificado(numeroObligacion: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/certificado/${numeroObligacion}`, {
      responseType: 'blob'
    });
  }
}

