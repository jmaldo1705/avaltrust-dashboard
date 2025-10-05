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

  // Controles de tabla: filtro, orden y paginación (Usuarios con Mayor Mora)
  delinquentsFilter: string = '';
  delinquentsSortBy: 'name' | 'debtAmount' | 'delayDays' | 'guaranteeRate' = 'delayDays';
  delinquentsSortDir: 'asc' | 'desc' = 'desc';
  delinquentsPageSize: number = 10;
  delinquentsCurrentPage: number = 1;

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
    date: Date | null;
  }[] = [];

  // Indica si se están mostrando siniestros fuera del período seleccionado
  claimsFromAllTime: boolean = false;

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
      next: (data: any) => {
        this.claimsSummary = {
          totalCapital: data.totalCapital ?? data.valorCapitalTotal ?? 0,
          totalInterest: data.totalInterest ?? data.totalIntereses ?? 0,
          monthlyClaimsAmount: data.monthlyClaimsAmount ?? data.montoMensual ?? 0,
          openClaims: data.openClaims ?? data.abiertos ?? 0,
          closedClaims: data.closedClaims ?? data.cerrados ?? 0,
          avgResolutionDays: data.avgResolutionDays ?? data.diasPromedioResolucion ?? 0,
        };
        if (this.isClaimsSummaryEmpty()) {
          this.loadClaimsFallbackUsingAllClaims();
        }
      },
      error: (err) => {
        console.error('Error cargando claimsSummary', err);
        this.loadClaimsFallbackUsingAllClaims();
      }
    });

    this.dashboardService.getRecentClaims(period).subscribe({
      next: (data: any[]) => {
        this.recentClaims = data.map((c: any) => {
          const amount = (c?.amount ?? c?.valor ?? ((c?.valorCapital ?? 0) + (c?.intereses ?? 0) + (c?.otrosConceptos ?? 0))) as number;
          const dateRaw = c?.date ?? c?.fecha ?? c?.fechaSolicitud ?? c?.fecha_creacion;
          return {
            id: (c?.id ?? c?.claimId ?? c?.obligacion ?? c?.obligation ?? '-') + '',
            userName: c?.userName ?? c?.usuario ?? c?.cliente ?? c?.nombreUsuario ?? c?.obligacion ?? '—',
            identification: c?.identification ?? c?.numeroDocumento ?? c?.documento ?? c?.nitEmpresa ?? c?.nit ?? '—',
            amount: amount ?? 0,
            status: c?.status ?? c?.estado ?? '—',
            date: dateRaw ? new Date(dateRaw) : null,
          };
        });
        // Datos provienen del endpoint filtrado por período
        this.claimsFromAllTime = false;
        if (this.recentClaims.length === 0) {
          this.loadClaimsFallbackUsingAllClaims();
        }
      },
      error: (err) => {
        console.error('Error cargando recentClaims', err);
        this.loadClaimsFallbackUsingAllClaims();
      }
    });
  }

  // Fallback: cargar siniestros desde /api/claims/all y calcular resumen/recientes
  private loadClaimsFallbackUsingAllClaims() {
    this.dashboardService.getAllClaimsRaw().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (!rows.length) {
          return;
        }
        const period = this.selectedPeriod as 'month' | 'quarter' | 'year';
        const start = this.getPeriodStart(period);

        const mapped = rows.map((c: any) => {
          const amount = (c?.amount ?? c?.valor ?? ((c?.valorCapital ?? 0) + (c?.intereses ?? 0) + (c?.otrosConceptos ?? 0))) as number;
          const dateRaw = c?.date ?? c?.fecha ?? c?.fechaSolicitud ?? c?.fecha_creacion;
          const d = dateRaw ? new Date(dateRaw) : null;
          const status = c?.status ?? c?.estado ?? 'CARGADO';
          return {
            id: (c?.id ?? c?.claimId ?? c?.obligacion ?? c?.obligation ?? '-') + '',
            userName: c?.userName ?? c?.usuario ?? c?.cliente ?? c?.nombreUsuario ?? c?.obligacion ?? '—',
            identification: c?.identification ?? c?.numeroDocumento ?? c?.documento ?? c?.nitEmpresa ?? c?.nit ?? '—',
            amount: amount ?? 0,
            status,
            date: d,
          };
        });

        // Ordenar por fecha descendente
        mapped.sort((a: { date: { getTime: () => any; }; }, b: { date: { getTime: () => any; }; }) => {
          const da = a.date ? a.date.getTime() : 0;
          const db = b.date ? b.date.getTime() : 0;
          return db - da;
        });

        // Tomar registros del período; si no hay, tomar últimos 10 globales
        if (this.recentClaims.length === 0) {
          // @ts-ignore
          const filtered = mapped.filter((m: { date: number; }) => m.date && m.date >= start);
          if (filtered.length > 0) {
            this.recentClaims = filtered.slice(0, 10);
            this.claimsFromAllTime = false;
          } else if (mapped.length > 0) {
            this.recentClaims = mapped.slice(0, 10);
            this.claimsFromAllTime = true;
          }
        }

        // Calcular resumen a partir del cargue cuando el backend no lo provee
        const totalCapital = rows.reduce((sum: number, r: any) => sum + (Number(r?.valorCapital) || 0), 0);
        const totalInterest = rows.reduce((sum: number, r: any) => sum + (Number(r?.intereses) || 0), 0);
        const monthlyClaimsAmount = rows.reduce((sum: number, r: any) => {
          const dateRaw = r?.date ?? r?.fecha ?? r?.fechaSolicitud ?? r?.fecha_creacion;
          const d = dateRaw ? new Date(dateRaw) : null;
          if (d && d >= start) {
            const amount = (r?.amount ?? r?.valor ?? ((r?.valorCapital ?? 0) + (r?.intereses ?? 0) + (r?.otrosConceptos ?? 0))) as number;
            return sum + (Number(amount) || 0);
          }
          return sum;
        }, 0);
        const hasEstado = rows.some((r: any) => r?.estado || r?.status);
        const openClaims = hasEstado ? rows.filter((r: any) => (r?.status ?? r?.estado) !== 'CERRADO').length : rows.length;
        const closedClaims = hasEstado ? rows.filter((r: any) => (r?.status ?? r?.estado) === 'CERRADO').length : 0;

        if (this.isClaimsSummaryEmpty()) {
          this.claimsSummary = {
            totalCapital,
            totalInterest,
            monthlyClaimsAmount,
            openClaims,
            closedClaims,
            avgResolutionDays: this.claimsSummary.avgResolutionDays || 0,
          };
        }
      },
      error: (err) => console.error('Fallback: error cargando siniestros', err)
    });
  }

  private isClaimsSummaryEmpty(): boolean {
    const s = this.claimsSummary as any;
    return (
      (s.totalCapital ?? 0) === 0 &&
      (s.totalInterest ?? 0) === 0 &&
      (s.monthlyClaimsAmount ?? 0) === 0 &&
      (s.openClaims ?? 0) === 0 &&
      (s.closedClaims ?? 0) === 0 &&
      (s.avgResolutionDays ?? 0) === 0
    );
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

  // ===== Tabla "Usuarios con Mayor Mora" — Filtro, Orden y Paginación =====
  get processedDelinquents(): DelinquentUser[] {
    let arr = [...(this.topDelinquentUsers || [])];

    const q = (this.delinquentsFilter || '').trim().toLowerCase();
    if (q) {
      const normDigits = q.replace(/\D+/g, '');
      arr = arr.filter(u => {
        const name = (u.name || '').toLowerCase();
        const id = (u.identification || '').replace(/\D+/g, '');
        const oblig = (u.guaranteeRate || '').toLowerCase();
        return name.includes(q) || (!!normDigits && id.includes(normDigits)) || oblig.includes(q);
      });
    }

    const dir = this.delinquentsSortDir === 'asc' ? 1 : -1;
    const field = this.delinquentsSortBy;
    arr.sort((a: any, b: any) => {
      let va = a[field];
      let vb = b[field];
      if (field === 'name' || field === 'guaranteeRate') {
        va = (va || '').toString().toLowerCase();
        vb = (vb || '').toString().toLowerCase();
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      } else {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
        return (va - vb) * dir;
      }
    });

    return arr;
  }

  get delinquentsTotalPages(): number {
    const total = this.processedDelinquents.length;
    return total === 0 ? 1 : Math.ceil(total / this.delinquentsPageSize);
  }

  get visibleDelinquentUsers(): DelinquentUser[] {
    const totalPages = this.delinquentsTotalPages;
    if (this.delinquentsCurrentPage > totalPages) {
      this.delinquentsCurrentPage = totalPages;
    }
    const start = (this.delinquentsCurrentPage - 1) * this.delinquentsPageSize;
    const end = start + this.delinquentsPageSize;
    return this.processedDelinquents.slice(start, end);
  }

  get delinquentsRangeStart(): number {
    return (this.delinquentsCurrentPage - 1) * this.delinquentsPageSize;
  }

  get delinquentsRangeEnd(): number {
    const end = this.delinquentsRangeStart + this.delinquentsPageSize;
    return Math.min(end, this.processedDelinquents.length);
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
    this.delinquentsCurrentPage = 1;
  }

  onDelinquentsPageSizeChange(_event?: any) {
    this.delinquentsCurrentPage = 1;
  }

  changeDelinquentsSort(field: 'name' | 'debtAmount' | 'delayDays' | 'guaranteeRate') {
    if (this.delinquentsSortBy === field) {
      this.delinquentsSortDir = this.delinquentsSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.delinquentsSortBy = field;
      this.delinquentsSortDir = (field === 'delayDays' || field === 'debtAmount') ? 'desc' : 'asc';
    }
    this.delinquentsCurrentPage = 1;
  }

  getDelinquentsSortIcon(field: 'name' | 'debtAmount' | 'delayDays' | 'guaranteeRate'): string {
    if (this.delinquentsSortBy !== field) return '↕';
    return this.delinquentsSortDir === 'asc' ? '▲' : '▼';
  }

  prevDelinquentsPage() {
    if (this.delinquentsCurrentPage > 1) this.delinquentsCurrentPage--;
  }

  nextDelinquentsPage() {
    if (this.delinquentsCurrentPage < this.delinquentsTotalPages) this.delinquentsCurrentPage++;
  }

  goToDelinquentsPage(p: number) {
    if (p >= 1 && p <= this.delinquentsTotalPages) {
      this.delinquentsCurrentPage = p;
    }
  }

  handleAlert(alert: Alert) {
    // 1) Si la alerta trae userId explícito
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

    // 2) Primero, intentar capturar documento junto a CC/NIT (evita confundir montos como identificación)
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

    // 2-b) Buscar identificaciones numéricas (permitiendo puntos/guiones) y compararlas normalizadas
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

    // 3) Intentar coincidir por nombre (si el texto incluye el nombre del usuario)
    const byName = this.topDelinquentUsers.find(u => lowerText.includes((u.name || '').toLowerCase()))
      || (titleName ? this.topDelinquentUsers.find(u => u.name?.toLowerCase().includes(titleName)) : undefined);
    if (byName) {
      this.viewUserDetail(byName.id);
      return;
    }

    // 4) Intentar coincidir por id exacto
    const byUserId = this.topDelinquentUsers.find(u => u.id === alert.id);
    if (byUserId) {
      this.viewUserDetail(byUserId.id);
      return;
    }

    // 5) Heurística adicional: si el texto trae la obligación y coincide con la columna mostrada
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
    try {
      const data = this.processedDelinquents || [];
      if (!data.length) {
        alert('No hay datos para exportar.');
        return;
      }

      // Preparar filas con encabezados legibles en español
      const rows = data.map(u => ({
        'Nombre': u.name,
        'Documento': u.identification,
        'Monto Adeudado': u.debtAmount,
        'Días de Mora': u.delayDays,
        'Obligación': u.guaranteeRate
      }));

      const ws = XLSX.utils.json_to_sheet(rows, {
        header: ['Nombre', 'Documento', 'Monto Adeudado', 'Días de Mora', 'Obligación']
      });

      // Ajustar anchos de columna básicos
      (ws as any)['!cols'] = [
        { wch: 28 }, // Nombre
        { wch: 18 }, // Documento
        { wch: 18 }, // Monto Adeudado
        { wch: 14 }, // Días de Mora
        { wch: 16 }  // Obligación
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mayor mora');

      const pad = (n: number) => n.toString().padStart(2, '0');
      const now = new Date();
      const fileName = `usuarios_mayor_mora_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error('Error exportando a Excel', e);
      alert('Ocurrió un error al exportar el archivo.');
    }
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
