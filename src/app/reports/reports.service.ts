import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
}

export interface ReportData {
  title: string;
  summary: any;
  data: any[];
  charts?: any;
  metrics?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  generateReport(params: ReportParams): Observable<ReportData | null> {
    console.log('Generando reporte con parámetros:', params);

    // Por ahora, simularemos datos para el desarrollo
    const mockData: ReportData = {
      title: this.getReportTitle(params.reportType),
      summary: {
        totalRecords: 150,
        totalAmount: 2500000,
        averageAmount: 16666.67,
        processed: new Date().toISOString()
      },
      data: this.generateMockData(params),
      charts: params.includeCharts ? this.generateChartData() : null,
      metrics: params.includeMetrics ? this.generateMetrics() : null
    };

    return of(mockData);

    // Implementación real con el backend:
    /*
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ReportData>(`${this.apiUrl}/generate`, { params: httpParams });
    */
  }

  async generatePDF(reportData: ReportData, reportType: string): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Configuración de fuentes
    pdf.setFont('helvetica');

    // Título del reporte
    pdf.setFontSize(20);
    pdf.setTextColor(51, 51, 51);
    pdf.text(reportData.title, margin, margin + 10);

    // Fecha de generación
    pdf.setFontSize(10);
    pdf.setTextColor(102, 102, 102);
    const generationDate = `Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`;
    pdf.text(generationDate, margin, margin + 20);

    let currentY = margin + 35;

    // Resumen ejecutivo
    if (reportData.summary) {
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Resumen Ejecutivo', margin, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      pdf.text(`Total de registros: ${reportData.summary.totalRecords}`, margin, currentY);
      currentY += 5;
      pdf.text(`Monto total: $${reportData.summary.totalAmount.toLocaleString('es-ES')}`, margin, currentY);
      currentY += 5;
      pdf.text(`Promedio: $${reportData.summary.averageAmount.toLocaleString('es-ES')}`, margin, currentY);
      currentY += 15;
    }

    // Métricas
    if (reportData.metrics) {
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Métricas Principales', margin, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      Object.entries(reportData.metrics).forEach(([key, value]) => {
        pdf.text(`${key}: ${value}`, margin, currentY);
        currentY += 5;
      });
      currentY += 10;
    }

    // Tabla de datos
    if (reportData.data && reportData.data.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Datos Detallados', margin, currentY);
      currentY += 10;

      // Headers de la tabla
      const headers = Object.keys(reportData.data[0]);
      const colWidth = contentWidth / headers.length;

      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      // Dibujar headers
      headers.forEach((header, index) => {
        pdf.rect(margin + (index * colWidth), currentY, colWidth, 8);
        pdf.text(header, margin + (index * colWidth) + 2, currentY + 5);
      });
      currentY += 8;

      // Dibujar filas de datos (máximo 20 para no sobrecargar)
      const maxRows = Math.min(20, reportData.data.length);
      for (let i = 0; i < maxRows; i++) {
        const row = reportData.data[i];
        headers.forEach((header, colIndex) => {
          pdf.rect(margin + (colIndex * colWidth), currentY, colWidth, 6);
          const cellValue = String(row[header] || '').substring(0, 15);
          pdf.text(cellValue, margin + (colIndex * colWidth) + 2, currentY + 4);
        });
        currentY += 6;

        // Nueva página si es necesario
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }
      }

      if (reportData.data.length > 20) {
        currentY += 5;
        pdf.text(`... y ${reportData.data.length - 20} registros más`, margin, currentY);
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text('Generado por AvalTrust Dashboard', margin, pageHeight - 10);

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  private getReportTitle(reportType: string): string {
    const titles: { [key: string]: string } = {
      'portfolio_summary': 'Resumen de Cartera',
      'client_analysis': 'Análisis por Cliente',
      'overdue_report': 'Reporte de Vencidos',
      'payment_history': 'Historial de Pagos',
      'guarantees_report': 'Reporte de Avales'
    };
    return titles[reportType] || 'Reporte Personalizado';
  }

  private generateMockData(params: ReportParams): any[] {
    const mockData = [];
    for (let i = 0; i < 10; i++) {
      mockData.push({
        obligacion: `OBL-${1000 + i}`,
        cliente: `Cliente ${i + 1}`,
        documento: `123456789${i}`,
        monto: Math.floor(Math.random() * 100000) + 10000,
        estado: ['VIGENTE', 'VENCIDO', 'CANCELADO'][Math.floor(Math.random() * 3)],
        fechaDesembolso: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      });
    }
    return mockData;
  }

  private generateChartData(): any {
    return {
      pieChart: {
        labels: ['Vigente', 'Vencido', 'Cancelado'],
        data: [60, 25, 15]
      },
      barChart: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
        data: [12, 19, 3, 5, 2]
      }
    };
  }

  private generateMetrics(): any {
    return {
      'Tasa de Morosidad': '15.8%',
      'Cobertura de Avales': '85.2%',
      'Recuperación Promedio': '72.3%',
      'Tiempo Promedio de Pago': '45 días'
    };
  }
}
