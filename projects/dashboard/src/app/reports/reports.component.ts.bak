import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ReportsService } from './reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private uiState = inject(UiStateService);
  private reportsService = inject(ReportsService);

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  // Propiedades del componente
  reportsForm!: FormGroup;
  isLoading = false;
  selectedReportType = '';

  // Opciones para los reportes
  reportTypes = [
    { value: 'portfolio_summary', label: 'Resumen de Cartera' },
    { value: 'client_analysis', label: 'Análisis por Cliente' },
    { value: 'overdue_report', label: 'Reporte de Vencidos' },
    { value: 'payment_history', label: 'Historial de Pagos' },
    { value: 'guarantees_report', label: 'Reporte de Avales' }
  ];

  documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'TI', label: 'Tarjeta de Identidad' }
  ];

  clientTypes = [
    { value: 'NATURAL', label: 'Persona Natural' },
    { value: 'JURIDICA', label: 'Persona Jurídica' }
  ];

  creditStates = [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'VENCIDO', label: 'Vencido' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'CASTIGADO', label: 'Castigado' }
  ];

  timeRanges = [
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' },
    { value: 'last_6_months', label: 'Últimos 6 meses' },
    { value: 'last_year', label: 'Último año' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  ngOnInit() {
    this.initializeForm();
  }

  // Métodos de navegación del sidebar
  onSidebarNavigate(route: string) {
    this.navigateTo(route);
  }

  onSidebarClose() {
    this.uiState.closeSidebar();
  }

  // Métodos de navegación del header
  onHeaderNavigate(route: string) {
    this.navigateTo(route);
  }

  // Métodos para controlar el sidebar
  toggleSidebar() {
    this.uiState.toggleSidebar();
  }

  closeSidebar() {
    this.uiState.closeSidebar();
  }

  // Métodos para controlar el menú de usuario
  toggleUserMenu() {
    this.uiState.toggleUserMenu();
  }

  closeUserMenu() {
    this.uiState.closeUserMenu();
  }

  // Navegación principal
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.uiState.closeAllMenus();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Métodos específicos del componente
  initializeForm() {
    this.reportsForm = this.fb.group({
      reportType: [''],
      timeRange: ['last_30_days'],
      startDate: [''],
      endDate: [''],
      documentType: [''],
      clientType: [''],
      creditState: [''],
      minAmount: [''],
      maxAmount: [''],
      specificClient: [''],
      includeCharts: [true],
      includeDetails: [true],
      includeMetrics: [true]
    });

    // Suscribirse a cambios en timeRange para mostrar/ocultar campos de fecha
    this.reportsForm.get('timeRange')?.valueChanges.subscribe(value => {
      const startDateControl = this.reportsForm.get('startDate');
      const endDateControl = this.reportsForm.get('endDate');

      if (value === 'custom') {
        startDateControl?.enable();
        endDateControl?.enable();
      } else {
        startDateControl?.disable();
        endDateControl?.disable();
      }
    });
  }

  onReportTypeChange(reportType: string) {
    this.selectedReportType = reportType;
    this.reportsForm.patchValue({ reportType });
  }

  generateReport() {
    if (this.reportsForm.valid && this.selectedReportType) {
      this.isLoading = true;

      const reportParams = {
        ...this.reportsForm.value,
        userId: this.auth.user()?.username || 'sistema'
      };

      console.log('Generando reporte con parámetros:', reportParams);

      this.reportsService.generateReport(reportParams)
        .pipe(
          catchError(error => {
            console.error('Error al generar reporte:', error);
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe(response => {
          if (response) {
            this.downloadPDF(response);
          }
        });
    }
  }

  private downloadPDF(reportData: any) {
    const fileName = `${this.getReportName()}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Aquí se implementaría la generación del PDF
    this.reportsService.generatePDF(reportData, this.selectedReportType)
      .then(pdfBlob => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log(`Reporte descargado: ${fileName}`);
      })
      .catch(error => {
        console.error('Error al generar PDF:', error);
      });
  }

  private getReportName(): string {
    const reportType = this.reportTypes.find(rt => rt.value === this.selectedReportType);
    return reportType ? reportType.label.replace(/\s+/g, '_') : 'Reporte_Personalizado';
  }

  previewReport() {
    // Implementar vista previa del reporte
    console.log('Vista previa del reporte:', this.reportsForm.value);
  }

  resetForm() {
    this.reportsForm.reset();
    this.selectedReportType = '';
    this.reportsForm.patchValue({
      timeRange: 'last_30_days',
      includeCharts: true,
      includeDetails: true,
      includeMetrics: true
    });
  }
}
