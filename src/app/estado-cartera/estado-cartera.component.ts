import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PortfolioService } from '../portfolio/portfolio.service';
import { AliadoService } from '../aliado/aliado.service';
import { AliadoEstrategico } from '../aliado/aliado.interface';
import { ActualizacionPagoModalComponent } from './actualizacion-pago-modal.component';
import { ToastService } from '../services/toast.service';

interface PortfolioItem {
  id: number;
  obligacion: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  tipoCliente: string;
  fechaDesembolso: string;
  plazoInicial: number;
  valorDesembolso: number;
  valorAval: number;
  interes: number;
  tasaAval: number;
  otrosConceptos: number;
  abonoAval: number;
  abonoCapital: number;
  totalDeuda: number;
  fechaVencimiento: string;
  diasMora: number;
  fechaPago?: string;
  estadoCredito: string;
  periodicidad: string;
  aliadoEstrategicoNombre?: string;
}

@Component({
  selector: 'app-estado-cartera',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, ActualizacionPagoModalComponent],
  templateUrl: './estado-cartera.component.html',
  styleUrls: ['./estado-cartera.component.css']
})
export class EstadoCarteraComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private uiState = inject(UiStateService);
  private portfolioService = inject(PortfolioService);
  private aliadoService = inject(AliadoService);
  private toastService = inject(ToastService);

  @ViewChild(ActualizacionPagoModalComponent) modalComponent!: ActualizacionPagoModalComponent;

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  // Propiedades del componente
  portfolios: PortfolioItem[] = [];
  filteredPortfolios: PortfolioItem[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Aliados estratégicos (para ADMIN)
  aliados: AliadoEstrategico[] = [];
  selectedAliadoId: number | null = null;
  isAdmin = false;
  isConsulta = false;
  
  // Filtros
  searchTerm = '';
  estadoFilter = '';
  tipoClienteFilter = '';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 0;
  
  // Estadísticas
  totalRegistros = 0;
  sumaValorAval = 0;
  sumaTotalDeuda = 0;
  
  // Para usar en el template
  Math = Math;
  
  // Modal de actualización de pago
  isModalOpen = false;
  selectedPortfolio: PortfolioItem | null = null;
  
  // Modal de carga masiva
  isUploadModalOpen = false;
  uploadedFile: File | null = null;
  isUploading = false;
  isDragging = false;
  uploadResult: any = null;

  // Modal de eliminación por rango de fechas
  isDeleteModalOpen = false;
  isDeleting = false;
  deleteFechaInicio = '';
  deleteFechaFin = '';
  deleteAliadoId: number | null = null;
  registrosAEliminar = 0;
  isCountingRecords = false;

  // Modal de exportación Excel
  isExportModalOpen = false;
  isExporting = false;
  exportFechaInicio = '';
  exportFechaFin = '';
  exportAliadoId: number | null = null;

  ngOnInit() {
    this.checkUserRole();
    if (this.isAdmin) {
      this.loadAliados();
    }
    this.loadPortfolioData();
  }

  checkUserRole() {
    const currentUser = this.auth.user();
    this.isAdmin = currentUser?.roles?.includes('ROLE_ADMIN') || false;
    this.isConsulta = currentUser?.roles?.includes('ROLE_CONSULTA') || false;
  }

  loadAliados() {
    this.aliadoService.getActivos().subscribe({
      next: (aliados) => {
        this.aliados = aliados;
      },
      error: (error) => {
        console.error('Error al cargar aliados:', error);
      }
    });
  }

  onAliadoChange() {
    // Cuando el ADMIN cambia el aliado seleccionado, recargar los datos
    this.loadPortfolioData();
  }

  loadPortfolioData() {
    this.isLoading = true;
    this.errorMessage = '';

    // Para ADMIN: si selectedAliadoId es null, ve todos
    // Para Usuario Regular: el backend filtra automáticamente por su aliado
    const params: any = {};
    if (this.isAdmin && this.selectedAliadoId !== null) {
      params.aliadoId = this.selectedAliadoId;
    }

    console.log('Cargando cartera con parámetros:', params);

    // Obtener todos los portfolios del aliado estratégico del usuario
    this.portfolioService.getAllPortfolios(params).subscribe({
      next: (data: any[]) => {
        console.log('Datos recibidos:', data.length, 'registros');
        this.portfolios = data;
        this.filteredPortfolios = data;
        this.calculateStatistics();
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar cartera:', error);
        this.errorMessage = 'Error al cargar los datos de la cartera';
        this.isLoading = false;
      }
    });
  }

  calculateStatistics() {
    this.totalRegistros = this.filteredPortfolios.length;
    this.sumaValorAval = this.filteredPortfolios.reduce((sum, p) => sum + (p.valorAval || 0), 0);
    this.sumaTotalDeuda = this.filteredPortfolios.reduce((sum, p) => sum + (p.totalDeuda || 0), 0);
  }

  applyFilters() {
    let filtered = this.portfolios;

    // Filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.obligacion.toLowerCase().includes(term) ||
        p.numeroDocumento.toLowerCase().includes(term) ||
        p.nombres.toLowerCase().includes(term) ||
        p.apellidos.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.estadoFilter) {
      filtered = filtered.filter(p => p.estadoCredito === this.estadoFilter);
    }

    // Filtro por tipo de cliente
    if (this.tipoClienteFilter) {
      filtered = filtered.filter(p => p.tipoCliente === this.tipoClienteFilter);
    }

    this.filteredPortfolios = filtered;
    this.currentPage = 1;
    this.calculateStatistics();
    this.updatePagination();
  }

  clearFilters() {
    this.searchTerm = '';
    this.estadoFilter = '';
    this.tipoClienteFilter = '';
    this.applyFilters();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredPortfolios.length / this.itemsPerPage);
  }

  get paginatedPortfolios(): PortfolioItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPortfolios.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'VIGENTE': return 'badge-vigente';
      case 'VENCIDO': return 'badge-vencido';
      case 'CANCELADO': return 'badge-cancelado';
      case 'CASTIGADO': return 'badge-castigado';
      default: return 'badge-default';
    }
  }

  exportToExcel() {
    // Abrir modal de exportación
    this.isExportModalOpen = true;
    this.exportFechaInicio = '';
    this.exportFechaFin = '';
    this.exportAliadoId = this.selectedAliadoId; // Pre-seleccionar el aliado actual si hay uno
  }

  closeExportModal() {
    this.isExportModalOpen = false;
    this.isExporting = false;
  }

  confirmarExportacion() {
    this.isExporting = true;
    
    // Obtener datos usando el endpoint existente de records (que sí funciona)
    const params: any = {};
    if (this.exportAliadoId) {
      params.aliadoId = this.exportAliadoId;
    }
    
    this.portfolioService.getAllPortfolios(params).subscribe({
      next: (data: any[]) => {
        try {
          // Filtrar por fechas si se especificaron
          let filteredData = data;
          if (this.exportFechaInicio) {
            const fechaInicio = new Date(this.exportFechaInicio);
            filteredData = filteredData.filter(item => {
              const fechaDesembolso = new Date(item.fechaDesembolso);
              return fechaDesembolso >= fechaInicio;
            });
          }
          if (this.exportFechaFin) {
            const fechaFin = new Date(this.exportFechaFin);
            filteredData = filteredData.filter(item => {
              const fechaDesembolso = new Date(item.fechaDesembolso);
              return fechaDesembolso <= fechaFin;
            });
          }

          if (!filteredData.length) {
            this.toastService.warning('No hay datos para exportar con los filtros seleccionados');
            this.isExporting = false;
            return;
          }

          // Helper para formatear fechas
          const formatDate = (dateStr: string | null | undefined): string => {
            if (!dateStr) return '';
            try {
              const date = new Date(dateStr);
              return date.toLocaleDateString('es-CO');
            } catch {
              return dateStr;
            }
          };

          // Helper para formatear moneda
          const formatCurrency = (value: number | null | undefined): string => {
            if (value === null || value === undefined) return '';
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
          };

          // Helper para formatear porcentaje
          const formatPercent = (value: number | null | undefined): string => {
            if (value === null || value === undefined) return '';
            return `${value}%`;
          };

          // Preparar filas con toda la información
          const rows = filteredData.map((item: any) => ({
            'Obligación': item.obligacion || '',
            'Tipo Documento': item.tipoDocumento || '',
            'Número Documento': item.numeroDocumento || '',
            'Nombres': item.nombres || '',
            'Apellidos': item.apellidos || '',
            'Tipo Cliente': item.tipoCliente || '',
            'Fecha Desembolso': formatDate(item.fechaDesembolso),
            'Plazo Inicial': item.plazoInicial ? `${item.plazoInicial} meses` : '',
            'Valor Desembolso': formatCurrency(item.valorDesembolso),
            'Valor Fianza': formatCurrency(item.valorAval),
            'Interés': formatCurrency(item.interes),
            'Tasa Fianza': formatPercent(item.tasaAval),
            'Otros Conceptos': formatCurrency(item.otrosConceptos),
            'Abono Fianza': formatCurrency(item.abonoAval),
            'Abono Capital': formatCurrency(item.abonoCapital),
            'Total Deuda': formatCurrency(item.totalDeuda),
            'Fecha Vencimiento': formatDate(item.fechaVencimiento),
            'Días de Mora': item.diasMora || 0,
            'Fecha Último Pago': formatDate(item.fechaPago),
            'Estado del Crédito': item.estadoCredito || '',
            'Periodicidad': item.periodicidad || '',
            'Aliado Estratégico': item.aliadoEstrategicoNombre || 'Sin Aliado'
          }));

          const headers = [
            'Obligación', 'Tipo Documento', 'Número Documento', 'Nombres', 'Apellidos',
            'Tipo Cliente', 'Fecha Desembolso', 'Plazo Inicial', 'Valor Desembolso',
            'Valor Fianza', 'Interés', 'Tasa Fianza', 'Otros Conceptos', 'Abono Fianza',
            'Abono Capital', 'Total Deuda', 'Fecha Vencimiento', 'Días de Mora',
            'Fecha Último Pago', 'Estado del Crédito', 'Periodicidad', 'Aliado Estratégico'
          ];

          const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

          // Ajustar anchos de columna
          (ws as any)['!cols'] = [
            { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
            { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
            { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
            { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
            { wch: 14 }, { wch: 22 }
          ];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Estado de Cartera');

          const pad = (n: number) => n.toString().padStart(2, '0');
          const now = new Date();
          const fileName = `estado_cartera_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.xlsx`;

          XLSX.writeFile(wb, fileName);
          
          this.toastService.success('Excel descargado correctamente');
          this.closeExportModal();
        } catch (e) {
          console.error('Error generando Excel:', e);
          this.toastService.error('Error al generar el archivo Excel');
          this.isExporting = false;
        }
      },
      error: (error) => {
        console.error('Error al obtener datos:', error);
        this.toastService.error('Error al obtener los datos para exportar');
        this.isExporting = false;
      }
    });
  }

  exportToPDF() {
    // TODO: Implementar exportación a PDF
    console.log('Exportar a PDF');
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  openActualizacionModal(portfolio: PortfolioItem) {
    this.selectedPortfolio = portfolio;
    this.isModalOpen = true;
  }

  closeActualizacionModal() {
    this.isModalOpen = false;
    this.selectedPortfolio = null;
  }

  onActualizacionSubmit(data: any) {
    console.log('Datos de actualización:', data);
    
    // Llamar al servicio para guardar la actualización
    this.portfolioService.createActualizacionPago(data).subscribe({
      next: (response) => {
        console.log('Actualización guardada exitosamente:', response);
        // Mostrar toast de éxito
        this.toastService.success('Actualización de pago guardada exitosamente');
        // Cerrar modal
        this.closeActualizacionModal();
        // Recargar datos para reflejar cambios
        this.loadPortfolioData();
      },
      error: (error) => {
        console.error('Error al guardar actualización:', error);
        // Mostrar toast de error
        const errorMessage = error?.error?.message || 'Error al guardar la actualización de pago';
        this.toastService.error(errorMessage);
        // Resetear estado de cargando del modal
        if (this.modalComponent) {
          this.modalComponent.resetSubmitting();
        }
      }
    });
  }

  // Métodos de carga masiva
  openUploadModal() {
    this.isUploadModalOpen = true;
    this.uploadResult = null;
    this.uploadedFile = null;
  }

  closeUploadModal() {
    this.isUploadModalOpen = false;
    this.uploadResult = null;
    this.uploadedFile = null;
  }

  downloadTemplate() {
    this.portfolioService.downloadEstadoCarteraTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla_estado_cartera.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Plantilla descargada exitosamente');
      },
      error: (error) => {
        console.error('Error al descargar plantilla:', error);
        this.toastService.error('Error al descargar la plantilla');
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File) {
    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      this.toastService.error('Tipo de archivo no válido. Use Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }

    // Validar tamaño (10 MB máximo)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastService.error('El archivo excede el tamaño máximo de 10 MB');
      return;
    }

    this.uploadedFile = file;
  }

  removeSelectedFile() {
    this.uploadedFile = null;
    const fileInput = document.getElementById('fileInputUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  uploadFile() {
    if (!this.uploadedFile) {
      this.toastService.error('Seleccione un archivo para cargar');
      return;
    }

    this.isUploading = true;
    this.uploadResult = null;

    // Usar el servicio específico para actualizaciones de estado de cartera
    this.portfolioService.uploadEstadoCarteraFile(this.uploadedFile).subscribe({
      next: (response) => {
        console.log('Archivo cargado exitosamente:', response);
        this.isUploading = false;
        this.uploadResult = {
          success: response.success,
          message: response.message,
          records: response.processedRecords,
          errors: response.errors
        };
        
        if (response.success) {
          this.toastService.success(`Archivo cargado exitosamente. ${response.processedRecords} actualizaciones procesadas.`);
          // Recargar datos
          this.loadPortfolioData();
          // Limpiar archivo
          this.uploadedFile = null;
          const fileInput = document.getElementById('fileInputUpload') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        } else {
          this.toastService.error('Error al procesar el archivo. Revise los errores.');
        }
      },
      error: (error) => {
        console.error('Error al cargar archivo:', error);
        this.isUploading = false;
        this.uploadResult = {
          success: false,
          message: error.error?.message || 'Error al cargar el archivo',
          errors: error.error?.errors || ['Error desconocido']
        };
        this.toastService.error('Error al cargar el archivo');
      }
    });
  }

  // ========== Métodos de eliminación por rango de fechas ==========

  /**
   * Abre el modal de eliminación por rango de fechas
   */
  openDeleteModal() {
    this.isDeleteModalOpen = true;
    this.deleteFechaInicio = '';
    this.deleteFechaFin = '';
    this.deleteAliadoId = this.selectedAliadoId;
    this.registrosAEliminar = 0;
  }

  /**
   * Cierra el modal de eliminación
   */
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.deleteFechaInicio = '';
    this.deleteFechaFin = '';
    this.registrosAEliminar = 0;
  }

  /**
   * Cuenta los registros que serían eliminados
   */
  contarRegistrosAEliminar() {
    if (!this.deleteFechaInicio || !this.deleteFechaFin) {
      this.registrosAEliminar = 0;
      return;
    }

    this.isCountingRecords = true;
    this.portfolioService.contarPorRangoFecha(
      this.deleteFechaInicio,
      this.deleteFechaFin,
      this.deleteAliadoId || undefined
    ).subscribe({
      next: (response) => {
        this.registrosAEliminar = response.cantidad || 0;
        this.isCountingRecords = false;
      },
      error: (error) => {
        console.error('Error al contar registros:', error);
        this.registrosAEliminar = 0;
        this.isCountingRecords = false;
      }
    });
  }

  /**
   * Confirma y ejecuta la eliminación definitiva por rango de fechas
   */
  confirmarEliminacion() {
    if (!this.deleteFechaInicio || !this.deleteFechaFin) {
      this.toastService.error('Debe seleccionar un rango de fechas');
      return;
    }

    if (this.registrosAEliminar === 0) {
      this.toastService.warning('No hay registros para eliminar en el rango seleccionado');
      return;
    }

    this.isDeleting = true;
    this.portfolioService.eliminarPorRangoFecha(
      this.deleteFechaInicio,
      this.deleteFechaFin,
      this.deleteAliadoId || undefined
    ).subscribe({
      next: (response) => {
        this.toastService.success(response.message || `${response.eliminados} registros eliminados definitivamente`);
        this.closeDeleteModal();
        this.loadPortfolioData();
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Error al eliminar registros:', error);
        this.toastService.error(error.error?.message || 'Error al eliminar los registros');
        this.isDeleting = false;
      }
    });
  }
}
