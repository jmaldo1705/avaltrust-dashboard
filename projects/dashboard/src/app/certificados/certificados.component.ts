import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AliadoService } from '../aliado/aliado.service';
import { AliadoEstrategico } from '../aliado/aliado.interface';
import { CertificadosService, CertificadoIngresosResponse } from './certificados.service';

@Component({
  selector: 'app-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.css']
})
export class CertificadosComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private uiState = inject(UiStateService);
  private aliadoService = inject(AliadoService);
  private certificadosService = inject(CertificadosService);

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  // Datos
  aliados: AliadoEstrategico[] = [];
  selectedAliadoId: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  
  // Estados
  isLoading = false;
  showPreview = false;
  previewData: CertificadoIngresosResponse | null = null;
  errorMessage = '';

  // Tipo de certificado seleccionado
  selectedCertificateType = '';
  
  certificateTypes = [
    { value: 'ingresos_terceros', label: 'Certificado de Ingresos para Terceros', icon: '📄' }
  ];

  ngOnInit() {
    this.loadAliados();
    this.setDefaultDates();
  }

  // Cargar aliados
  loadAliados() {
    this.aliadoService.getActivos().subscribe({
      next: (aliados) => {
        this.aliados = aliados;
      },
      error: (error) => {
        console.error('Error al cargar aliados:', error);
        this.errorMessage = 'Error al cargar aliados estratégicos';
      }
    });
  }

  // Establecer fechas por defecto (mes anterior)
  setDefaultDates() {
    const today = new Date();
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    this.fechaInicio = this.formatDate(firstDayLastMonth);
    this.fechaFin = this.formatDate(lastDayLastMonth);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Métodos de navegación del sidebar
  onSidebarNavigate(route: string) {
    this.navigateTo(route);
  }

  onSidebarClose() {
    this.uiState.closeSidebar();
  }

  onHeaderNavigate(route: string) {
    this.navigateTo(route);
  }

  toggleSidebar() {
    this.uiState.toggleSidebar();
  }

  closeSidebar() {
    this.uiState.closeSidebar();
  }

  toggleUserMenu() {
    this.uiState.toggleUserMenu();
  }

  closeUserMenu() {
    this.uiState.closeUserMenu();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.uiState.closeAllMenus();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // Seleccionar tipo de certificado
  onCertificateTypeChange(type: string) {
    this.selectedCertificateType = type;
    this.showPreview = false;
    this.previewData = null;
  }

  // Vista previa
  previewCertificate() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.certificadosService.previewCertificadoIngresos(
      this.selectedAliadoId!,
      this.fechaInicio,
      this.fechaFin
    ).pipe(
      catchError(error => {
        console.error('Error al generar vista previa:', error);
        this.errorMessage = 'Error al generar vista previa del certificado';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response) {
        this.previewData = response;
        this.showPreview = true;
      }
    });
  }

  // Descargar certificado
  downloadCertificate() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.certificadosService.downloadCertificadoIngresos(
      this.selectedAliadoId!,
      this.fechaInicio,
      this.fechaFin
    ).pipe(
      catchError(error => {
        console.error('Error al descargar certificado:', error);
        this.errorMessage = 'Error al descargar el certificado';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(blob => {
      if (blob) {
        const aliado = this.aliados.find(a => a.id === this.selectedAliadoId);
        const mesAnio = this.fechaFin.substring(5, 7) + this.fechaFin.substring(0, 4);
        const fileName = `Certificado_Ingresos_${aliado?.nombre.replace(/\s+/g, '_') || this.selectedAliadoId}_${mesAnio}.pdf`;
        this.certificadosService.downloadFile(blob, fileName);
      }
    });
  }

  // Validar formulario
  validateForm(): boolean {
    this.errorMessage = '';

    if (!this.selectedCertificateType) {
      this.errorMessage = 'Por favor seleccione un tipo de certificado';
      return false;
    }

    if (!this.selectedAliadoId) {
      this.errorMessage = 'Por favor seleccione un aliado estratégico';
      return false;
    }

    if (!this.fechaInicio || !this.fechaFin) {
      this.errorMessage = 'Por favor seleccione el periodo a certificar';
      return false;
    }

    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) {
      this.errorMessage = 'La fecha de inicio debe ser anterior a la fecha fin';
      return false;
    }

    return true;
  }

  // Cerrar preview
  closePreview() {
    this.showPreview = false;
    this.previewData = null;
  }

  // Formatear moneda
  formatCurrency(value: number): string {
    return this.certificadosService.formatCurrency(value);
  }

  // Obtener nombre del aliado seleccionado
  getSelectedAliadoName(): string {
    const aliado = this.aliados.find(a => a.id === this.selectedAliadoId);
    return aliado ? aliado.nombre : '';
  }
}
