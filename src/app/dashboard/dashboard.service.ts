import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// Tipos básicos para las respuestas del backend
export interface PortfolioStatsDto {
  totalPortfolio: number;
  portfolioGrowth: number;
  activeUsers: number;
  averageDelayDays: number;
  delayDaysChange: number;
  guaranteeRate: number;
}

export interface MoraCategoryDto {
  name: string;
  count: number;
  percentage: number;
  amount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PaymentStatsDto {
  totalPayments: number;
  totalInterest: number;
  totalPenalties: number;
}

export interface RecentPaymentDto {
  date: string; // ISO string desde backend
  amount: number;
  type: 'payment' | 'interest' | 'penalty';
  typeName: string;
}

export interface AlertDto {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  timestamp: string; // ISO string
  userId?: string; // opcional: id del usuario asociado a la alerta
}

export interface DelinquentUserDto {
  id: string;
  name: string;
  identification: string;
  debtAmount: number;
  delayDays: number;
  guaranteeRate: string;
}

export interface ClaimsSummaryDto {
  totalCapital: number;
  totalInterest: number;
  monthlyClaimsAmount: number;
  openClaims: number;
  closedClaims: number;
  avgResolutionDays: number;
}

export interface ClaimItemDto {
  id: string;
  userName: string;
  identification: string;
  amount: number;
  status: 'ABIERTO' | 'EN_GESTION' | 'CERRADO';
  date: string; // ISO
}

export interface UserDetailDto {
  obligacion: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  tipoCliente: 'NATURAL' | 'JURIDICA';
  fechaDesembolso: string;
  plazoInicial: number;
  valorDesembolso: number;
  valorAval: number;
  interes: number;
  tasaAval: number;
  otrosConceptos?: number;
  abonoAval?: number;
  abonoCapital?: number;
  totalDeuda: number;
  fechaVencimiento: string;
  diasMora?: number;
  fechaPago?: string;
  estadoCredito: 'VIGENTE' | 'VENCIDO' | 'CANCELADO' | 'CASTIGADO';
  periodicidad: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}`;

  // Endpoints sugeridos (el backend puede ajustarlos)
  getPortfolioStats(): Observable<PortfolioStatsDto> {
    return this.http.get<PortfolioStatsDto>(`${this.baseUrl}/api/dashboard/portfolio-stats`);
  }

  getMoraDistribution(): Observable<MoraCategoryDto[]> {
    return this.http.get<MoraCategoryDto[]>(`${this.baseUrl}/api/dashboard/mora-distribution`);
  }

  getPaymentStats(period: 'month' | 'quarter' | 'year'): Observable<PaymentStatsDto> {
    return this.http.get<PaymentStatsDto>(`${this.baseUrl}/api/dashboard/payments/stats`, { params: { period } });
  }

  getRecentPayments(period: 'month' | 'quarter' | 'year'): Observable<RecentPaymentDto[]> {
    return this.http.get<RecentPaymentDto[]>(`${this.baseUrl}/api/dashboard/payments/recent`, { params: { period } });
  }

  getAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(`${this.baseUrl}/api/dashboard/alerts`);
  }

  getTopDelinquents(): Observable<DelinquentUserDto[]> {
    return this.http.get<DelinquentUserDto[]>(`${this.baseUrl}/api/users/top-delinquents`);
  }

  getPortfolioDetail(portfolioId: string): Observable<UserDetailDto> {
    return this.http.get<UserDetailDto>(`${this.baseUrl}/api/portfolio/${portfolioId}/detail`);
  }

  getUserDetail(userId: string): Observable<UserDetailDto> {
    return this.http.get<UserDetailDto>(`${this.baseUrl}/api/users/${userId}/detail`);
  }

  // Obtener detalle por identificación/documento (cuando la alerta no trae userId)
  getUserDetailByIdentification(identification: string): Observable<UserDetailDto> {
    return this.http.get<UserDetailDto>(`${this.baseUrl}/api/users/detail`, { params: { identification } });
  }

  // Siniestros
  getClaimsSummary(period: 'month' | 'quarter' | 'year'): Observable<ClaimsSummaryDto> {
    return this.http.get<ClaimsSummaryDto>(`${this.baseUrl}/api/claims/summary`, { params: { period } });
  }

  getRecentClaims(period: 'month' | 'quarter' | 'year'): Observable<ClaimItemDto[]> {
    return this.http.get<ClaimItemDto[]>(`${this.baseUrl}/api/claims/recent`, { params: { period } });
  }

  // Fallback: obtener todos los siniestros usando el endpoint de lista estándar (wrapper { success, message, data })
  getAllClaimsRaw(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/claims`);
  }
}
