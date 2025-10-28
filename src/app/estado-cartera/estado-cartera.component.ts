import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel');
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
}

