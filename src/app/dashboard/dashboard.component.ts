import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HasRoleDirective } from '../auth/has-role.directive';
import { DashboardService } from './dashboard.service';

// Interfaces para tipado
interface PortfolioStats {
  totalPortfolio: number;
  portfolioGrowth: number;
  activeUsers: number;
  averageDelayDays: number;
  delayDaysChange: number;
  guaranteeRate: number;
}

interface MoraCategory {
  name: string;
  count: number;
  percentage: number;
  amount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PaymentStats {
  totalPayments: number;
  totalInterest: number;
  totalPenalties: number;
}

interface RecentPayment {
  date: Date;
  amount: number;
  type: 'payment' | 'interest' | 'penalty';
  typeName: string;
}

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  timestamp: Date;
}

interface DelinquentUser {
  id: string;
  name: string;
  identification: string;
  debtAmount: number;
  delayDays: number;
  guaranteeRate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, HasRoleDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private uiState = inject(UiStateService);
  private dashboardService = inject(DashboardService);

  userProfile = this.auth.userProfile;

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  selectedPeriod = 'month';
  moraView = 'distribution';

  // Datos del dashboard
  portfolioStats: PortfolioStats = {
    totalPortfolio: 0,
    portfolioGrowth: 0,
    activeUsers: 0,
    averageDelayDays: 0,
    delayDaysChange: 0,
    guaranteeRate: 0
  };

  moraDistribution: MoraCategory[] = [];

  paymentStats: PaymentStats = {
    totalPayments: 0,
    totalInterest: 0,
    totalPenalties: 0
  };

  recentPayments: RecentPayment[] = [];

  alerts: Alert[] = [];

  topDelinquentUsers: DelinquentUser[] = [];

  // Siniestros (resumen y recientes)
  claimsSummary = {
    totalCapital: 0,
    totalInterest: 0,
    monthlyClaimsAmount: 0,
    openClaims: 0,
    closedClaims: 0,
    avgResolutionDays: 0
  };

  recentClaims: {
    id: string;
    userName: string;
    identification: string;
    amount: number;
    status: string;
    date: Date;
  }[] = [];

  // Modal detalle de usuario moroso
  isUserModalOpen = false;
  selectedUserDetail: any = null;
  userModalLoading = false;
  userModalError: string | null = null;

  ngOnInit() {
    // Cargar datos del usuario si no están disponibles
    if (!this.userProfile()) {
      this.auth.getUserProfile().subscribe();
    }

    // Cargar datos del dashboard
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Cargar estadísticas generales de la cartera
    this.dashboardService.getPortfolioStats().subscribe({
      next: (data: any) => this.portfolioStats = data,
      error: (err) => console.error('Error cargando portfolioStats', err)
    });

    // Distribución por categorías de mora
    this.dashboardService.getMoraDistribution().subscribe({
      next: (data: any) => this.moraDistribution = data,
      error: (err) => console.error('Error cargando moraDistribution', err)
    });

    // Alertas
    this.dashboardService.getAlerts().subscribe({
      next: (data: any[]) => {
        this.alerts = data.map(a => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      },
      error: (err) => console.error('Error cargando alertas', err)
    });

    // Top usuarios morosos
    this.dashboardService.getTopDelinquents().subscribe({
      next: (data: any) => this.topDelinquentUsers = data,
      error: (err) => console.error('Error cargando top morosos', err)
    });

    // Datos dependientes del período seleccionado
    this.loadPaymentData();
  }

  getLastUpdateTime(): string {
    return new Date().toLocaleString('es-CO');
  }

  setMoraView(view: 'distribution' | 'timeline') {
    this.moraView = view;
  }

  loadPaymentData() {
    const period = this.selectedPeriod as 'month' | 'quarter' | 'year';

    // Resumen de pagos
    this.dashboardService.getPaymentStats(period).subscribe({
      next: (data: any) => this.paymentStats = data,
      error: (err) => console.error('Error cargando paymentStats', err)
    });

    // Pagos recientes
    this.dashboardService.getRecentPayments(period).subscribe({
      next: (data: any[]) => {
        this.recentPayments = data.map(p => ({
          ...p,
          date: new Date(p.date)
        }));
      },
      error: (err) => console.error('Error cargando recentPayments', err)
    });

    // Siniestros: resumen y recientes
    this.dashboardService.getClaimsSummary(period).subscribe({
      next: (data: any) => this.claimsSummary = data,
      error: (err) => console.error('Error cargando claimsSummary', err)
    });

    this.dashboardService.getRecentClaims(period).subscribe({
      next: (data: any[]) => {
        this.recentClaims = data.map(c => ({
          ...c,
          date: new Date(c.date)
        }));
      },
      error: (err) => console.error('Error cargando recentClaims', err)
    });
  }

  getAlertIcon(type: string): string {
    const icons = {
      'high_mora': '🚨',
      'payment_delay': '⚠️',
      'system': 'ℹ️',
      'user_contact': '📞'
    };
    return icons[type as keyof typeof icons] || 'ℹ️';
  }

  getDaysSeverity(days: number): string {
    if (days <= 30) return 'low';
    if (days <= 60) return 'medium';
    if (days <= 90) return 'high';
    return 'critical';
  }

  handleAlert(alert: Alert) {
    console.log('Manejando alerta:', alert);
    // Implementar lógica para manejar alertas
  }

  exportTopDelinquents() {
    console.log('Exportando datos de morosos...');
    // Implementar lógica de exportación
  }

  viewUserDetail(userId: string) {
    this.userModalError = null;
    this.userModalLoading = true;
    this.isUserModalOpen = true;
    this.dashboardService.getUserDetail(userId).subscribe({
      next: (detail: any) => {
        this.selectedUserDetail = detail;
        this.userModalLoading = false;
      },
      error: (err) => {
        console.error('Error cargando detalle de usuario', err);
        this.userModalError = 'No fue posible cargar el detalle del usuario.';
        this.userModalLoading = false;
      }
    });
  }

  closeUserModal() {
    this.isUserModalOpen = false;
    this.selectedUserDetail = null;
  }

  navigateToClaim(claimId: string) {
    // Ajustar cuando exista ruta específica de detalle de siniestro
    this.navigateTo('/claims');
  }

  contactUser(userId: string) {
    this.navigateTo(`/portfolio/contact/${userId}`);
  }

  trackByUserId(index: number, user: DelinquentUser): string {
    return user.id;
  }

  // Métodos para controlar el sidebar usando UiStateService
  toggleSidebar() {
    this.uiState.toggleSidebar();
  }

  closeSidebar() {
    this.uiState.closeSidebar();
  }

  // Métodos para controlar el menú de usuario usando UiStateService
  toggleUserMenu() {
    this.uiState.toggleUserMenu();
  }

  closeUserMenu() {
    this.uiState.closeUserMenu();
  }

  // Navegación principal
  navigateTo(route: string) {
    this.router.navigate([route]);
    // No cerrar sidebar automáticamente para mantener estado
    // Solo cerrar en móvil si es necesario
    // this.uiState.closeSidebar();
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

  // Método de logout
  logout() {
    this.uiState.closeAllMenus();
    this.auth.logout(true);
  }
}
