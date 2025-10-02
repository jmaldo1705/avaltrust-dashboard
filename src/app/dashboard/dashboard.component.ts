import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HasRoleDirective } from '../auth/has-role.directive';

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
    totalPortfolio: 15750000000,
    portfolioGrowth: 12.5,
    activeUsers: 2847,
    averageDelayDays: 45,
    delayDaysChange: -3,
    guaranteeRate: 18.5
  };

  moraDistribution: MoraCategory[] = [
    { name: '0-60 días', count: 1245, percentage: 45, amount: 5500000000, severity: 'low' },
    { name: '61-120 días', count: 852, percentage: 30, amount: 4200000000, severity: 'medium' },
    { name: '121-180 días', count: 456, percentage: 16, amount: 3100000000, severity: 'high' },
    { name: '181+ días', count: 294, percentage: 9, amount: 2950000000, severity: 'critical' }
  ];

  paymentStats: PaymentStats = {
    totalPayments: 8750000000,
    totalInterest: 2100000000,
    totalPenalties: 650000000
  };

  recentPayments: RecentPayment[] = [
    { date: new Date('2025-01-15'), amount: 125000000, type: 'payment', typeName: 'Abono' },
    { date: new Date('2025-01-14'), amount: 85000000, type: 'payment', typeName: 'Abono' },
    { date: new Date('2025-01-13'), amount: 15000000, type: 'interest', typeName: 'Interés' },
    { date: new Date('2025-01-12'), amount: 95000000, type: 'payment', typeName: 'Abono' },
    { date: new Date('2025-01-11'), amount: 8000000, type: 'penalty', typeName: 'Mora' }
  ];

  alerts: Alert[] = [
    {
      id: '1',
      type: 'high_mora',
      severity: 'error',
      title: 'Mora Crítica Detectada',
      description: '15 usuarios superan los 180 días de mora',
      timestamp: new Date('2025-01-15T10:30:00')
    },
    {
      id: '2',
      type: 'payment_delay',
      severity: 'warning',
      title: 'Tasa De Impagos',
      description: 'Los créditos que están en dudoso recaudo o en mora 180 / total de créditos',
      timestamp: new Date('2025-01-15T09:15:00')
    },
    {
      id: '3',
      type: 'system',
      severity: 'info',
      title: 'Carga Exitosa',
      description: 'Nueva cartera cargada con 1,247 registros',
      timestamp: new Date('2025-01-15T08:00:00')
    }
  ];

  topDelinquentUsers: DelinquentUser[] = [
    { id: '1', name: 'Carlos Rodriguez', identification: '12345678', debtAmount: 85000000, delayDays: 125, guaranteeRate: 'Obl-123' },
    { id: '2', name: 'María González', identification: '87654321', debtAmount: 67000000, delayDays: 98, guaranteeRate: 'Obl-123' },
    { id: '3', name: 'Juan Pérez', identification: '11223344', debtAmount: 54000000, delayDays: 87, guaranteeRate: 'Obl-123' },
    { id: '4', name: 'Ana Martínez', identification: '99887766', debtAmount: 48000000, delayDays: 76, guaranteeRate: 'Obl-123' },
    { id: '5', name: 'Luis Silva', identification: '55443322', debtAmount: 42000000, delayDays: 69, guaranteeRate: 'Obl-123' }
  ];

  ngOnInit() {
    // Cargar datos del usuario si no están disponibles
    if (!this.userProfile()) {
      this.auth.getUserProfile().subscribe();
    }

    // Cargar datos del dashboard
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Aquí harías las llamadas a los servicios para cargar los datos reales
    // Por ejemplo: this.portfolioService.getStats().subscribe(stats => this.portfolioStats = stats);
    console.log('Cargando datos del dashboard...');
  }

  getLastUpdateTime(): string {
    return new Date().toLocaleString('es-CO');
  }

  setMoraView(view: 'distribution' | 'timeline') {
    this.moraView = view;
  }

  loadPaymentData() {
    // Cargar datos según el período seleccionado
    console.log('Cargando datos de pagos para:', this.selectedPeriod);
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
    this.navigateTo(`/portfolio/user/${userId}`);
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
