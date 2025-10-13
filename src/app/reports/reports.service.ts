import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ReportParams {
  reportType: string;
  timeRange: string;
  startDate?: string;
  endDate?: string;
  documentType?: string;
  clientType?: string;
  creditState?: string;
  minAmount?: number;
  maxAmount?: number;
  specificClient?: string;
  includeCharts: boolean;
  includeDetails: boolean;
  includeMetrics: boolean;
  userId: string;
  outputFormat?: string;
  groupBy?: string;
  orderBy?: string;
  orderDirection?: string;
}

export interface ReportSummary {
  totalRecords: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount?: number;
  minAmount?: number;
  uniqueClients?: number;
  dateRange?: string;
}

export interface ReportData {
  reportId: string;
  reportType: string;
  title: string;
  generatedAt: string;
  generatedBy: string;
  summary: ReportSummary;
  data: any[];
  metrics?: any;
  chartData?: any;
  appliedFilters?: any;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  contentType?: string;
}

export interface ReportHistoryItem {
  id: number;
  reportId: string;
  reportType: string;
  reportTitle: string;
  fileName: string;
  outputFormat: string;
  fileSize: number;
  status: string;
  generatedAt: string;
  generatedBy: string;
  downloadUrl?: string;
  downloadCount: number;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/reports`;

  generateReport(params: ReportParams): Observable<ReportData> {
    return this.http.post<ReportData>(`${this.apiUrl}/generate`, params);
  }

  downloadPDF(params: ReportParams): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/pdf`, params, {
      responseType: 'blob'
    });
  }

  downloadExcel(params: ReportParams): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/excel`, params, {
      responseType: 'blob'
    });
  }

  downloadCSV(params: ReportParams): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/csv`, params, {
      responseType: 'blob'
    });
  }

  getReportHistory(userId: string): Observable<ReportHistoryItem[]> {
    return this.http.get<ReportHistoryItem[]>(`${this.apiUrl}/history`, {
      params: { userId }
    });
  }

  getReportById(reportId: string): Observable<ReportHistoryItem> {
    return this.http.get<ReportHistoryItem>(`${this.apiUrl}/${reportId}`);
  }

  cleanExpiredReports(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clean-expired`);
  }

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

  getReportTypeName(reportType: string): string {
    const names: { [key: string]: string } = {
      'portfolio_summary': 'Resumen de Cartera',
      'client_analysis': 'Análisis por Cliente',
      'overdue_report': 'Reporte de Vencidos',
      'payment_history': 'Historial de Pagos',
      'guarantees_report': 'Reporte de Avales'
    };
    return names[reportType] || 'Reporte Personalizado';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'GENERATING': 'Generando',
      'COMPLETED': 'Completado',
      'FAILED': 'Fallido'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'GENERATING': 'status-generating',
      'COMPLETED': 'status-completed',
      'FAILED': 'status-failed'
    };
    return classes[status] || '';
  }
}
