import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import {
  LucideAlertTriangle,
  LucideBadgeDollarSign,
  LucideBell,
  LucideBuilding2,
  LucideCalendarClock,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronUp,
  LucideChevronsUpDown,
  LucideDownload,
  LucideEye,
  LucideGauge,
  LucideInfo,
  LucideLayoutDashboard,
  LucideLoaderCircle,
  LucideListFilter,
  LucideRefreshCw,
  LucideSearch,
  LucideShieldCheck,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideUsersRound,
  LucideX
} from '@lucide/angular';

import { AuthService } from '../auth/auth.service';
import { UiStateService } from '../ui-state.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DashboardService } from './dashboard.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { FiltroAliadosComponent, FiltroAliadosEvent } from './filtro-aliados.component';
import { ToastService } from '../services/toast.service';
import * as XLSX from 'xlsx';

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

interface MoraTimelineItem {
  date: Date;
  categories: MoraCategory[];
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
  userId?: string;
  portfolioId?: string;  // ID del portfolio específico
  obligacion?: string;    // Número de obligación
  aliadoEstrategicoId?: number;
  aliadoEstrategicoNombre?: string;
}

interface DelinquentUser {
  id: string;
  name: string;
  identification: string;
  debtAmount: number;
  delayDays: number;
  guaranteeRate: string;
  aliadoEstrategicoId?: number;
  aliadoEstrategicoNombre?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    SidebarComponent,
    FiltroAliadosComponent,
    LucideAlertTriangle,
    LucideBadgeDollarSign,
    LucideBell,
    LucideBuilding2,
    LucideCalendarClock,
    LucideChevronDown,
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronUp,
    LucideChevronsUpDown,
    LucideDownload,
    LucideEye,
    LucideGauge,
    LucideInfo,
    LucideLayoutDashboard,
    LucideLoaderCircle,
    LucideListFilter,
    LucideRefreshCw,
    LucideSearch,
    LucideShieldCheck,
    LucideTrendingDown,
    LucideTrendingUp,
    LucideUsersRound,
    LucideX
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private uiState = inject(UiStateService);
  private dashboardService = inject(DashboardService);
  private portfolioService = inject(PortfolioService);
  private toastService = inject(ToastService);

  userProfile = this.auth.userProfile;

  // Estados de UI usando el servicio compartido
  get isSidebarOpen() {
    return this.uiState.isSidebarOpen();
  }

  get isUserMenuOpen() {
    return this.uiState.isUserMenuOpen();
  }

  selectedPeriod = 'month';
  moraView: 'distribution' | 'timeline' = 'distribution';
  timelinePeriod: 'week' | 'month' | 'quarter' | 'year' = 'month';

  // Filtro de aliados estratégicos (solo para ADMIN)
  selectedAliadoIds: number[] | null = null;
  isAliadoFilterVisible = false;
  isDashboardLoading = false;
  dashboardError: string | null = null;
  dashboardSectionErrors: string[] = [];
  delinquentsError: string | null = null;
  lastUpdatedAt: Date | null = null;
  isExportingDelinquents = false;
  private dashboardLoadSub?: Subscription;
  private delinquentsLoadSub?: Subscription;
  private readonly destroy$ = new Subject<void>();

  // Datos del dashboard
  portfolioStats: PortfolioStats = {
    totalPortfolio: 0,
    portfolioGrowth: 0,
    activeUsers: 0,
    averageDelayDays: 0,
    delayDaysChange: 0,
    guaranteeRate: 0
  };

  // Suma total de los valores de aval de todos los usuarios (cobertura)
  totalValorAval: number = 0;

  moraDistribution: MoraCategory[] = [];
  moraTimeline: MoraTimelineItem[] = [];

  paymentStats: PaymentStats = {
    totalPayments: 0,
    totalInterest: 0,
    totalPenalties: 0
  };

  recentPayments: RecentPayment[] = [];

  alerts: Alert[] = [];

  topDelinquentUsers: DelinquentUser[] = [];

  // Controles de tabla: filtro, orden y paginación (Usuarios con Mora) - paginación desde backend
  delinquentsFilter: string = '';
  delinquentsSortBy: 'name' | 'debtAmount' | 'delayDays' | 'guaranteeRate' = 'delayDays';
  delinquentsSortDir: 'asc' | 'desc' = 'desc';
  delinquentsPageSize: number = 10;
  delinquentsCurrentPage: number = 1;
  delinquentsTotalElements: number = 0;
  delinquentsTotalPages: number = 1;
  delinquentsLoading: boolean = false;

  // Debounce para filtro de texto
  private delinquentsFilterTimeout: any = null;


  // Modal detalle de usuario moroso
  isUserModalOpen = false;
  selectedUserDetail: any = null;
  userModalLoading = false;
  userModalError: string | null = null;

  // Reintentos para resolver usuario desde alertas cuando aún no cargan los morosos
  private alertRetryCount: Record<string, number> = {};

  ngOnInit() {
    // Cargar datos del usuario si no están disponibles
    if (!this.userProfile()) {
      this.auth.getUserProfile()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.checkAdminRole(),
          error: () => this.checkAdminRole()
        });
    }

    // Verificar si es admin para mostrar filtro de aliados
    this.checkAdminRole();

    // Cargar datos del dashboard
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.dashboardLoadSub?.unsubscribe();
    this.delinquentsLoadSub?.unsubscribe();
    if (this.delinquentsFilterTimeout) {
      clearTimeout(this.delinquentsFilterTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAdminRole() {
    const profile = this.userProfile();
    const currentUser = this.auth.user();
    this.isAliadoFilterVisible =
      Boolean(profile?.roles?.includes('ROLE_ADMIN')) ||
      Boolean(profile?.isAdmin) ||
      Boolean(currentUser?.roles?.includes('ROLE_ADMIN')) ||
      Boolean(currentUser?.isAdmin);
  }

  onAliadoFilterChange(event: FiltroAliadosEvent) {
    this.selectedAliadoIds = event.aliadoIds;
    this.delinquentsCurrentPage = 1;
    this.loadDashboardData();
  }

  private loadDashboardData() {
    const params = this.getDashboardParams();
    const period = this.selectedPeriod as 'month' | 'quarter' | 'year';

    this.dashboardLoadSub?.unsubscribe();
    this.dashboardSectionErrors = [];
    this.dashboardError = null;
    this.isDashboardLoading = true;

    this.dashboardLoadSub = this.safeRequest(
      this.dashboardService.getDashboardSummary(period, params),
      'No fue posible cargar el resumen del dashboard.',
      {
        portfolioStats: this.getEmptyPortfolioStats(),
        totalValorAval: 0,
        moraDistribution: [],
        paymentStats: this.getEmptyPaymentStats(),
        recentPayments: [],
        alerts: []
      }
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDashboardLoading = false)
      )
      .subscribe({
        next: data => {
          this.portfolioStats = this.normalizePortfolioStats(data.portfolioStats);
          this.totalValorAval = this.toNumber(data.totalValorAval);
          this.moraDistribution = this.normalizeMoraDistribution(data.moraDistribution);
          this.alerts = this.normalizeAlerts(data.alerts);
          this.paymentStats = this.normalizePaymentStats(data.paymentStats);
          this.recentPayments = this.normalizeRecentPayments(data.recentPayments);
          this.lastUpdatedAt = new Date();
          this.dashboardError = this.dashboardSectionErrors.length
            ? 'Algunos datos no se pudieron actualizar. Se muestran valores disponibles.'
            : null;
        },
        error: err => {
          console.error('Error inesperado cargando dashboard', err);
          this.dashboardError = 'No fue posible actualizar el dashboard. Intenta nuevamente.';
          this.toastService.error(this.dashboardError);
        }
      });

    this.loadDelinquentUsers();
  }

  private loadDashboardDataLegacy() {
    const params = this.selectedAliadoIds ? { aliadoIds: this.selectedAliadoIds } : {};

    // Cargar estadísticas generales de la cartera
    this.dashboardService.getPortfolioStats(params).subscribe({
      next: (data: any) => this.portfolioStats = data,
      error: (err) => console.error('Error cargando portfolioStats', err)
    });

    // Calcular cobertura como suma de valorAval de todos los usuarios
    this.loadTotalValorAval();

    // Distribución por categorías de mora
    this.dashboardService.getMoraDistribution(params).subscribe({
      next: (data: any) => this.moraDistribution = data,
      error: (err) => console.error('Error cargando moraDistribution', err)
    });

    // Alertas
    this.dashboardService.getAlerts(params).subscribe({
      next: (data: any[]) => {
        this.alerts = data.map(a => {
          const userId = (a as any).userId ?? (a as any).user_id ?? (a as any).userID ?? (a as any).usuarioId ?? (a as any).usuario_id ?? (a as any).clienteId ?? (a as any).cliente_id;
          return {
            ...a,
            userId,
            timestamp: new Date(a.timestamp)
          };
        });
      },
      error: (err) => console.error('Error cargando alertas', err)
    });

    // Cargar usuarios con mora (paginado desde backend)
    this.loadDelinquentUsers();

    // Datos dependientes del período seleccionado
    this.loadPaymentData();
  }

  refreshDashboard() {
    this.loadDashboardData();
  }

  private getDashboardParams(): { aliadoIds?: number[] } {
    return this.selectedAliadoIds && this.selectedAliadoIds.length > 0
      ? { aliadoIds: this.selectedAliadoIds }
      : {};
  }

  private safeRequest<T>(request$: Observable<T>, message: string, fallback: T): Observable<T> {
    return request$.pipe(
      catchError(err => {
        this.addDashboardSectionError(message, err);
        return of(fallback);
      })
    );
  }

  private addDashboardSectionError(message: string, err: unknown) {
    console.error(message, err);
    if (!this.dashboardSectionErrors.includes(message)) {
      this.dashboardSectionErrors.push(message);
    }
  }

  private getEmptyPortfolioStats(): PortfolioStats {
    return {
      totalPortfolio: 0,
      portfolioGrowth: 0,
      activeUsers: 0,
      averageDelayDays: 0,
      delayDaysChange: 0,
      guaranteeRate: 0
    };
  }

  private getEmptyPaymentStats(): PaymentStats {
    return {
      totalPayments: 0,
      totalInterest: 0,
      totalPenalties: 0
    };
  }

  private normalizePortfolioStats(data: any): PortfolioStats {
    return {
      totalPortfolio: this.toNumber(data?.totalPortfolio),
      portfolioGrowth: this.toNumber(data?.portfolioGrowth),
      activeUsers: this.toNumber(data?.activeUsers),
      averageDelayDays: this.toNumber(data?.averageDelayDays),
      delayDaysChange: this.toNumber(data?.delayDaysChange),
      guaranteeRate: this.toNumber(data?.guaranteeRate)
    };
  }

  private normalizePaymentStats(data: any): PaymentStats {
    return {
      totalPayments: this.toNumber(data?.totalPayments),
      totalInterest: this.toNumber(data?.totalInterest),
      totalPenalties: this.toNumber(data?.totalPenalties)
    };
  }

  private normalizeMoraDistribution(data: any): MoraCategory[] {
    if (!Array.isArray(data)) return [];

    return data.map(category => ({
      name: String(category?.name ?? 'Sin clasificar'),
      count: this.toNumber(category?.count),
      percentage: Math.max(0, Math.min(100, this.toNumber(category?.percentage))),
      amount: this.toNumber(category?.amount),
      severity: this.normalizeSeverity(category?.severity)
    }));
  }

  private normalizeAlerts(data: any): Alert[] {
    if (!Array.isArray(data)) return [];

    return data.map(a => {
      const userId = (a as any).userId ?? (a as any).user_id ?? (a as any).userID ?? (a as any).usuarioId ?? (a as any).usuario_id ?? (a as any).clienteId ?? (a as any).cliente_id;
      return {
        ...a,
        id: String(a?.id ?? `${a?.title ?? 'alert'}-${a?.timestamp ?? Date.now()}`),
        type: String(a?.type ?? 'system'),
        severity: this.normalizeAlertSeverity(a?.severity),
        title: String(a?.title ?? 'Alerta'),
        description: String(a?.description ?? 'Sin descripcion disponible.'),
        userId,
        timestamp: this.toDate(a?.timestamp)
      };
    });
  }

  private normalizeRecentPayments(data: any): RecentPayment[] {
    if (!Array.isArray(data)) return [];

    return data.map(p => ({
      ...p,
      date: this.toDate(p?.date),
      amount: this.toNumber(p?.amount),
      type: p?.type ?? 'payment',
      typeName: String(p?.typeName ?? 'Pago')
    }));
  }

  private calculateCoverageValue(resp: any): number {
    const value = this.toNumber(resp?.sumValorAval ?? resp?.sum_valor_aval ?? resp?.sum);
    const porcentajeCapitalizacion = this.toNumber(resp?.porcentajeCapitalizacion ?? 100, 100);
    const valorConIva = value / 1.19;
    return Number.isFinite(valorConIva) ? valorConIva * (porcentajeCapitalizacion / 100) : 0;
  }

  private normalizeSeverity(value: unknown): MoraCategory['severity'] {
    return value === 'low' || value === 'medium' || value === 'high' || value === 'critical'
      ? value
      : 'low';
  }

  private normalizeAlertSeverity(value: unknown): Alert['severity'] {
    return value === 'info' || value === 'warning' || value === 'error'
      ? value
      : 'info';
  }

  private toNumber(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  private toDate(value: unknown): Date {
    const date = new Date(String(value ?? ''));
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  /**
   * Carga usuarios con mora desde el backend con paginación.
   */
  private loadDelinquentUsers() {
    this.delinquentsLoadSub?.unsubscribe();
    this.delinquentsLoading = true;
    this.delinquentsError = null;

    const params: any = {
      page: this.delinquentsCurrentPage,
      size: this.delinquentsPageSize,
      sortBy: this.delinquentsSortBy,
      sortDir: this.delinquentsSortDir
    };

    if (this.delinquentsFilter?.trim()) {
      params.filter = this.delinquentsFilter.trim();
    }

    if (this.selectedAliadoIds && this.selectedAliadoIds.length > 0) {
      params.aliadoIds = this.selectedAliadoIds;
    }

    this.delinquentsLoadSub = this.dashboardService.getDelinquentUsers(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.delinquentsLoading = false)
      )
      .subscribe({
        next: (response: any) => {
          const content = Array.isArray(response?.content) ? response.content : [];
          this.topDelinquentUsers = content.map((u: any) => {
            const uid = u.userId ?? u.user_id ?? u.uid ?? u.userUid ?? u.usuarioUid ?? u.clienteUid ?? u.cliente_id ?? u.id;
            return {
              ...u,
              id: String(uid ?? u.identification ?? u.numeroDocumento ?? ''),
              name: String(u.name ?? u.nombres ?? 'Sin nombre'),
              identification: String(u.identification ?? u.numeroDocumento ?? ''),
              debtAmount: this.toNumber(u.debtAmount ?? u.totalDeuda),
              delayDays: this.toNumber(u.delayDays ?? u.diasMora),
              guaranteeRate: String(u.guaranteeRate ?? u.obligacion ?? '')
            } as DelinquentUser;
          });
          this.delinquentsTotalElements = this.toNumber(response?.totalElements, content.length);
          this.delinquentsTotalPages = Math.max(1, this.toNumber(response?.totalPages, 1));
          this.delinquentsCurrentPage = Math.min(
            Math.max(1, this.toNumber(response?.page, this.delinquentsCurrentPage)),
            this.delinquentsTotalPages
          );
        },
        error: err => {
          console.error('Error cargando usuarios con mora', err);
          this.topDelinquentUsers = [];
          this.delinquentsTotalElements = 0;
          this.delinquentsTotalPages = 1;
          this.delinquentsError = 'No fue posible cargar los usuarios con mora.';
          this.toastService.error(this.delinquentsError);
        }
      });
  }

  private loadDelinquentUsersLegacy() {
    this.delinquentsLoading = true;
    
    const params: any = {
      page: this.delinquentsCurrentPage,
      size: this.delinquentsPageSize,
      sortBy: this.delinquentsSortBy,
      sortDir: this.delinquentsSortDir
    };
    
    if (this.delinquentsFilter && this.delinquentsFilter.trim()) {
      params.filter = this.delinquentsFilter.trim();
    }
    
    if (this.selectedAliadoIds && this.selectedAliadoIds.length > 0) {
      params.aliadoIds = this.selectedAliadoIds;
    }
    
    this.dashboardService.getDelinquentUsers(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isExportingDelinquents = false)
      )
      .subscribe({
      next: (response: any) => {
        this.topDelinquentUsers = (response.content || []).map((u: any) => {
          const uid = u.userId ?? u.user_id ?? u.uid ?? u.userUid ?? u.usuarioUid ?? u.clienteUid ?? u.cliente_id ?? u.id;
          return { ...u, id: uid } as any;
        });
        this.delinquentsTotalElements = response.totalElements || 0;
        this.delinquentsTotalPages = response.totalPages || 1;
        this.delinquentsCurrentPage = response.page || 1;
        this.delinquentsLoading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios con mora', err);
        this.delinquentsLoading = false;
      }
    });
  }

  // Cobertura: traer valor desde el servicio y dividir entre 1.19 y luego aplicar porcentaje de capitalización
  private loadTotalValorAval() {
    this.totalValorAval = 0;
    const params = this.selectedAliadoIds ? { aliadoIds: this.selectedAliadoIds } : {};
    this.portfolioService.getSumValorAval(params).subscribe({
      next: (resp: any) => {
        const value = Number(resp?.sumValorAval ?? resp?.sum_valor_aval ?? resp?.sum ?? 0);
        const porcentajeCapitalizacion = Number(resp?.porcentajeCapitalizacion ?? 100);
        
        // Dividir la suma de valores aval entre 1.19 y luego aplicar el porcentaje de capitalización
        const valorConIva = value / 1.19;
        this.totalValorAval = isNaN(valorConIva) ? 0 : valorConIva * (porcentajeCapitalizacion / 100);
      },
      error: (err) => console.error('Error cargando cobertura (sumValorAval)', err)
    });
  }

  getLastUpdateTime(): string {
    return new Date().toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Bogota'
    });
  }

  setMoraView(view: 'distribution' | 'timeline') {
    this.moraView = view;
    if (view === 'timeline' && this.moraTimeline.length === 0) {
      this.loadTimelineData();
    }
  }

  loadTimelineData() {
    this.dashboardService.getMoraTimeline(this.timelinePeriod, this.getDashboardParams()).subscribe({
      next: (data: any[]) => {
        this.moraTimeline = Array.isArray(data)
          ? data.map(item => ({
              date: this.toDate(item.date),
              categories: this.normalizeMoraDistribution(item.categories)
            }))
          : [];
      },
      error: (err) => {
        console.error('Error cargando moraTimeline', err);
        this.toastService.error('No fue posible cargar la linea de tiempo de mora.');
      }
    });
  }

  loadPaymentData() {
    const period = this.selectedPeriod as 'month' | 'quarter' | 'year';
    const params = this.getDashboardParams();

    // Resumen de pagos
    this.dashboardService.getPaymentStats(period, params).subscribe({
      next: (data: any) => this.paymentStats = this.normalizePaymentStats(data),
      error: (err) => console.error('Error cargando paymentStats', err)
    });

    // Pagos recientes
    this.dashboardService.getRecentPayments(period, params).subscribe({
      next: (data: any[]) => {
        this.recentPayments = this.normalizeRecentPayments(data);
      },
      error: (err) => console.error('Error cargando recentPayments', err)
    });

  }


  private getPeriodStart(period: 'month' | 'quarter' | 'year'): Date {
    const now = new Date();
    const start = new Date(now);
    if (period === 'month') {
      start.setDate(1);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(q, 1);
    } else {
      start.setMonth(0, 1);
    }
    start.setHours(0, 0, 0, 0);
    return start;
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

  // ===== Tabla "Usuarios con Mora" — Filtro, Orden y Paginación desde Backend =====
  
  // Los datos ya vienen procesados del backend, solo mostramos lo que tenemos
  get visibleDelinquentUsers(): DelinquentUser[] {
    return this.topDelinquentUsers || [];
  }

  get moraUsersCount(): number {
    return this.moraDistribution.reduce((total, category) => total + category.count, 0);
  }

  get riskUsersCount(): number {
    return this.moraDistribution
      .filter(category => category.severity === 'high' || category.severity === 'critical')
      .reduce((total, category) => total + category.count, 0);
  }

  get riskAmount(): number {
    return this.moraDistribution
      .filter(category => category.severity === 'high' || category.severity === 'critical')
      .reduce((total, category) => total + category.amount, 0);
  }

  get highRiskPercentage(): number {
    const total = this.moraUsersCount;
    if (!total) return 0;
    return Math.max(0, Math.min(100, (this.riskUsersCount / total) * 100));
  }

  get coverageRatio(): number {
    const portfolio = this.toNumber(this.portfolioStats.totalPortfolio);
    if (portfolio <= 0) return 0;
    return Math.max(0, (this.toNumber(this.totalValorAval) / portfolio) * 100);
  }

  get riskMeterBackground(): string {
    const risk = this.highRiskPercentage;
    return `conic-gradient(#f45f9a 0 ${risk}%, rgba(2, 199, 217, 0.2) ${risk}% 100%)`;
  }

  get delinquentsRangeStart(): number {
    if (this.delinquentsTotalElements === 0) return 0;
    return (this.delinquentsCurrentPage - 1) * this.delinquentsPageSize;
  }

  get delinquentsRangeEnd(): number {
    const end = this.delinquentsRangeStart + this.topDelinquentUsers.length;
    return Math.min(end, this.delinquentsTotalElements);
  }

  get delinquentsPagesArray(): number[] {
    const total = this.delinquentsTotalPages;
    const current = this.delinquentsCurrentPage;
    const windowSize = 7;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }

  onDelinquentsFilterChange() {
    // Usar debounce para evitar llamadas excesivas al backend
    if (this.delinquentsFilterTimeout) {
      clearTimeout(this.delinquentsFilterTimeout);
    }
    this.delinquentsFilterTimeout = setTimeout(() => {
      this.delinquentsCurrentPage = 1;
      this.loadDelinquentUsers();
    }, 400);
  }

  onDelinquentsPageSizeChange(_event?: any) {
    this.delinquentsCurrentPage = 1;
    this.loadDelinquentUsers();
  }

  changeDelinquentsSort(field: 'name' | 'debtAmount' | 'delayDays' | 'guaranteeRate') {
    if (this.delinquentsSortBy === field) {
      this.delinquentsSortDir = this.delinquentsSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.delinquentsSortBy = field;
      this.delinquentsSortDir = (field === 'delayDays' || field === 'debtAmount') ? 'desc' : 'asc';
    }
    this.delinquentsCurrentPage = 1;
    this.loadDelinquentUsers();
  }

  getDelinquentsSortIcon(field: 'name' | 'debtAmount' | 'delayDays' | 'guaranteeRate'): string {
    if (this.delinquentsSortBy !== field) return '↕';
    return this.delinquentsSortDir === 'asc' ? '▲' : '▼';
  }

  prevDelinquentsPage() {
    if (this.delinquentsCurrentPage > 1) {
      this.delinquentsCurrentPage--;
      this.loadDelinquentUsers();
    }
  }

  nextDelinquentsPage() {
    if (this.delinquentsCurrentPage < this.delinquentsTotalPages) {
      this.delinquentsCurrentPage++;
      this.loadDelinquentUsers();
    }
  }

  goToDelinquentsPage(p: number) {
    if (p >= 1 && p <= this.delinquentsTotalPages && p !== this.delinquentsCurrentPage) {
      this.delinquentsCurrentPage = p;
      this.loadDelinquentUsers();
    }
  }

  handleAlert(alert: Alert) {
    // 1) Si la alerta trae portfolioId, usarlo directamente (más confiable)
    if (alert.portfolioId) {
      this.viewPortfolioDetail(alert.portfolioId);
      return;
    }

    // 2) Si la alerta trae userId explícito
    if (alert.userId) {
      this.viewUserDetail(alert.userId);
      return;
    }

    // Si aún no han cargado los morosos, reintentar brevemente antes de fallar
    if (!this.topDelinquentUsers || this.topDelinquentUsers.length === 0) {
      const key = alert.id || `${alert.title}|${alert.description}`;
      const count = this.alertRetryCount[key] ?? 0;
      if (count < 5) {
        this.alertRetryCount[key] = count + 1;
        // Mostrar estado de carga en el modal mientras resolvemos
        this.isUserModalOpen = true;
        this.userModalLoading = true;
        this.userModalError = null;
        setTimeout(() => this.handleAlert(alert), 300);
        return;
      }
    }

    // Texto completo para heurísticas
    const text = `${alert.title ?? ''} ${alert.description ?? ''}`.trim();
    const lowerText = text.toLowerCase();

    // Extraer nombre probable desde el título (ej: "Mora alta: Pepito Perez")
    const titleName = (alert.title || '').replace(/^[^:]*:\s*/, '').trim().toLowerCase();

    // Helper: normalizar documentos (remover puntos, espacios, guiones)
    const normalizeId = (s: string) => (s || '').replace(/\D+/g, '');

    // 3) Primero, intentar capturar documento junto a CC/NIT (evita confundir montos como identificación)
    const idFromLabelMatch = /(\bCC\b|\bNIT\b)\s*([0-9.\-]+)/i.exec(text);
    if (idFromLabelMatch?.[2]) {
      const normToken = normalizeId(idFromLabelMatch[2]);
      const candidates = this.topDelinquentUsers.filter(u => normalizeId(u.identification) === normToken);
      if (candidates.length === 1) {
        // Si tenemos nombre en título y no coincide, preferimos buscar directo por identificación
        if (titleName && !candidates[0].name?.toLowerCase().includes(titleName)) {
          this.viewUserDetailByIdentification(normToken);
          return;
        }
        this.viewUserDetail(candidates[0].id);
        return;
      }
      if (candidates.length > 1) {
        const byName = titleName ? candidates.find(c => c.name?.toLowerCase().includes(titleName)) : undefined;
        if (byName) {
          this.viewUserDetail(byName.id);
          return;
        }
        this.viewUserDetailByIdentification(normToken);
        return;
      }
      // Sin candidatos en top morosos, intentar directo por identificación
      this.viewUserDetailByIdentification(normToken);
      return;
    }

    // 4) Buscar identificaciones numéricas (permitiendo puntos/guiones) y compararlas normalizadas
    const digitTokens = text.replace(/\D+/g, ' ').split(/\s+/).filter(t => t && t.length >= 6);
    // Ordenar por longitud desc para priorizar documentos largos (evitar confundir montos)
    digitTokens.sort((a,b) => b.length - a.length);

    for (const token of digitTokens) {
      const normToken = normalizeId(token);

      // Candidatos en top morosos por identificación
      const candidates = this.topDelinquentUsers.filter(u => normalizeId(u.identification) === normToken);

      if (candidates.length === 1) {
        // Si tenemos nombre en título y no coincide, preferimos buscar directo por identificación
        if (titleName && !candidates[0].name?.toLowerCase().includes(titleName)) {
          this.viewUserDetailByIdentification(normToken);
          return;
        }
        this.viewUserDetail(candidates[0].id);
        return;
      }

      if (candidates.length > 1) {
        // Desambiguar por nombre si es posible; si no, ir directo por identificación
        const byName = titleName ? candidates.find(c => c.name?.toLowerCase().includes(titleName)) : undefined;
        if (byName) {
          this.viewUserDetail(byName.id);
          return;
        }
        this.viewUserDetailByIdentification(normToken);
        return;
      }

      // Si no hay candidatos en top morosos, intentar directo por identificación
      if (candidates.length === 0) {
        this.viewUserDetailByIdentification(normToken);
        return;
      }
    }

    // 5) Intentar coincidir por nombre (si el texto incluye el nombre del usuario)
    const byName = this.topDelinquentUsers.find(u => lowerText.includes((u.name || '').toLowerCase()))
      || (titleName ? this.topDelinquentUsers.find(u => u.name?.toLowerCase().includes(titleName)) : undefined);
    if (byName) {
      this.viewUserDetail(byName.id);
      return;
    }

    // 6) Heurística adicional: si el texto trae la obligación y coincide con la columna mostrada
    const byObligation = this.topDelinquentUsers.find(u => u.guaranteeRate && text.includes(u.guaranteeRate));
    if (byObligation) {
      this.viewUserDetail(byObligation.id);
      return;
    }

    // Si no fue posible determinar el usuario, mostrar modal con error
    this.userModalError = 'No se pudo determinar el usuario asociado a esta alerta.';
    this.userModalLoading = false;
    this.selectedUserDetail = null;
    this.isUserModalOpen = true;
  }

  exportTopDelinquents() {
    if (this.isExportingDelinquents) return;
    this.isExportingDelinquents = true;

    // Exportar todos los usuarios con mora que cumplan con los filtros actuales
    const params: any = {
      page: 1,
      size: 50000, // Obtener todos para exportación
      sortBy: this.delinquentsSortBy,
      sortDir: this.delinquentsSortDir,
      exportAll: true // Indicar al backend que es para exportación
    };
    
    if (this.delinquentsFilter && this.delinquentsFilter.trim()) {
      params.filter = this.delinquentsFilter.trim();
    }
    
    if (this.selectedAliadoIds && this.selectedAliadoIds.length > 0) {
      params.aliadoIds = this.selectedAliadoIds;
    }
    
    this.dashboardService.getDelinquentUsers(params).subscribe({
      next: (response: any) => {
        try {
          const data = Array.isArray(response?.content) ? response.content : [];
          if (!data.length) {
            this.toastService.warning('No hay datos para exportar.');
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

          // Preparar filas con información completa igual al detalle
          const rows = data.map((u: any) => ({
            'Obligación': u.guaranteeRate || '',
            'Tipo Documento': u.tipoDocumento || '',
            'Número Documento': u.numeroDocumento || '',
            'Nombres': u.name || '',
            'Tipo Cliente': u.tipoCliente || '',
            'Fecha Desembolso': formatDate(u.fechaDesembolso),
            'Plazo Inicial': u.plazoInicial ? `${u.plazoInicial} meses` : '',
            'Valor Desembolso': formatCurrency(u.valorDesembolso),
            'Valor Fianza': formatCurrency(u.valorAval),
            'Interés': formatCurrency(u.interes),
            'Tasa Fianza': formatPercent(u.tasaAval),
            'Otros Conceptos': formatCurrency(u.otrosConceptos),
            'Abono Fianza': formatCurrency(u.abonoAval),
            'Abono Capital': formatCurrency(u.abonoCapital),
            'Total Deuda': formatCurrency(u.debtAmount),
            'Fecha Vencimiento': formatDate(u.fechaVencimiento),
            'Días de Mora': u.delayDays || 0,
            'Fecha Último Pago': formatDate(u.fechaPago),
            'Estado del Crédito': u.estadoCredito || '',
            'Periodicidad': u.periodicidad || '',
            'Aliado Estratégico': u.aliadoEstrategicoNombre || 'Sin Aliado'
          }));

          const headers = [
            'Obligación', 'Tipo Documento', 'Número Documento', 'Nombres', 'Tipo Cliente',
            'Fecha Desembolso', 'Plazo Inicial', 'Valor Desembolso', 'Valor Fianza', 'Interés',
            'Tasa Fianza', 'Otros Conceptos', 'Abono Fianza', 'Abono Capital', 'Total Deuda',
            'Fecha Vencimiento', 'Días de Mora', 'Fecha Último Pago', 'Estado del Crédito',
            'Periodicidad', 'Aliado Estratégico'
          ];

          const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

          // Ajustar anchos de columna
          (ws as any)['!cols'] = [
            { wch: 18 }, // Obligación
            { wch: 14 }, // Tipo Documento
            { wch: 16 }, // Número Documento
            { wch: 28 }, // Nombres
            { wch: 12 }, // Tipo Cliente
            { wch: 16 }, // Fecha Desembolso
            { wch: 14 }, // Plazo Inicial
            { wch: 18 }, // Valor Desembolso
            { wch: 16 }, // Valor Fianza
            { wch: 14 }, // Interés
            { wch: 12 }, // Tasa Fianza
            { wch: 16 }, // Otros Conceptos
            { wch: 14 }, // Abono Fianza
            { wch: 14 }, // Abono Capital
            { wch: 16 }, // Total Deuda
            { wch: 18 }, // Fecha Vencimiento
            { wch: 14 }, // Días de Mora
            { wch: 18 }, // Fecha Último Pago
            { wch: 16 }, // Estado del Crédito
            { wch: 14 }, // Periodicidad
            { wch: 22 }  // Aliado Estratégico
          ];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Usuarios con Mora');

          const pad = (n: number) => n.toString().padStart(2, '0');
          const now = new Date();
          const fileName = `usuarios_con_mora_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.xlsx`;

          XLSX.writeFile(wb, fileName);
          this.toastService.success('Excel exportado correctamente.');
        } catch (e) {
          console.error('Error exportando a Excel', e);
          this.toastService.error('Ocurrió un error al exportar el archivo.');
        }
      },
      error: (err) => {
        console.error('Error obteniendo datos para exportar', err);
        this.toastService.error('Ocurrió un error al obtener los datos para exportar.');
      }
    });
  }

  viewPortfolioDetail(portfolioId: string) {
    this.userModalError = null;
    this.userModalLoading = true;
    this.isUserModalOpen = true;
    this.dashboardService.getPortfolioDetail(portfolioId).subscribe({
      next: (detail: any) => {
        this.selectedUserDetail = detail;
        this.userModalLoading = false;
      },
      error: (err) => {
        console.error('Error cargando detalle del portfolio', err);
        this.userModalError = 'No fue posible cargar el detalle del crédito.';
        this.userModalLoading = false;
      }
    });
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

  // Abrir detalle cuando solo tenemos la identificación (desde alertas)
  viewUserDetailByIdentification(identification: string) {
    this.userModalError = null;
    this.userModalLoading = true;
    this.isUserModalOpen = true;
    this.dashboardService.getUserDetailByIdentification(identification).subscribe({
      next: (detail: any) => {
        this.selectedUserDetail = detail;
        this.userModalLoading = false;
      },
      error: (err) => {
        console.error('Error cargando detalle por identificación', err);
        this.userModalError = 'No fue posible cargar el detalle del usuario por identificación.';
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
