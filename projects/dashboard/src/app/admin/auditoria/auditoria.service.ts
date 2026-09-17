import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type AuditEventType = 'LOGIN' | 'NAVIGATION';

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AuditEvent {
  id: number;
  userId: number | null;
  username: string | null;
  email: string | null;
  type: AuditEventType;
  optionKey: string | null;
  optionLabel: string | null;
  route: string | null;
  eventTime: string;
  ipAddress: string | null;
}

export interface LastConnection {
  userId: number;
  username: string;
  email: string | null;
  lastConnectionAt: string | null;
}

export interface OptionSummary {
  optionKey: string;
  optionLabel: string;
  totalAccesses: number;
  uniqueUsers: number;
  lastAccessAt: string | null;
}

export interface CourseProgress {
  userId: number;
  username: string;
  email: string | null;
  cursoId: number;
  cursoTitulo: string;
  attempts: number;
  bestPercentage: number | null;
  aprobado: boolean;
  approvedAttempts: number;
  lastEvaluationAt: string | null;
}

export interface CourseOption {
  cursoId: number;
  titulo: string;
}

export interface AuditSummary {
  totalEvents: number;
  navigationEvents: number;
  loginEvents: number;
  usersWithLogin: number;
}

export interface AuditEventFilters {
  type?: AuditEventType | 'all';
  optionKey?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

type RouteOption = {
  key: string;
  label: string;
  match: RegExp;
};

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/api/admin/auditoria`;
  private auditUrl = `${environment.apiUrl}/api/audit`;
  private lastTrackedSignature = '';

  readonly trackedOptions: RouteOption[] = [
    { key: 'dashboard', label: 'Dashboard', match: /^\/dashboard(?:[/?#]|$)/ },
    { key: 'cargue-cartera', label: 'Cargue Cartera', match: /^\/portfolio(?:[/?#]|$)/ },
    { key: 'estado-cartera', label: 'Estado de Cartera', match: /^\/estado-cartera(?:[/?#]|$)/ },
    { key: 'siniestros', label: 'Cargue Siniestros', match: /^\/claims(?:[/?#]|$)/ },
    { key: 'documentos', label: 'Documentos', match: /^\/documentos(?:[/?#]|$)/ },
    { key: 'certificados', label: 'Certificados', match: /^\/certificados(?:[/?#]|$)/ },
    { key: 'usuarios', label: 'Gestion Usuarios', match: /^\/admin\/users(?:[/?#]|$)/ },
    { key: 'aliados', label: 'Aliados Estrategicos', match: /^\/aliados(?:[/?#]|$)/ },
    { key: 'admin-cursos', label: 'Administracion de Cursos', match: /^\/admin\/cursos(?:[/?#]|$)/ },
    { key: 'auditoria', label: 'Auditoria', match: /^\/admin\/auditoria(?:[/?#]|$)/ },
    { key: 'dashboard-afianzado', label: 'Dashboard Afianzado', match: /^\/dashboard-afianzado(?:[/?#]|$)/ },
    { key: 'escuela-financiera', label: 'Escuela Financiera', match: /^\/escuela-financiera(?:[/?#]|$)/ },
    { key: 'perfil', label: 'Mi Perfil', match: /^\/user\/profile(?:[/?#]|$)/ }
  ];

  getSummary(): Observable<AuditSummary> {
    return this.http.get<AuditSummary>(`${this.adminUrl}/summary`);
  }

  getEvents(filters: AuditEventFilters): Observable<PageResponse<AuditEvent>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20);

    if (filters.type && filters.type !== 'all') {
      params = params.set('type', filters.type);
    }
    if (filters.optionKey && filters.optionKey !== 'all') {
      params = params.set('optionKey', filters.optionKey);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }

    return this.http.get<PageResponse<AuditEvent>>(`${this.adminUrl}/events`, { params });
  }

  getLastConnections(search = '', limit = 120): Observable<LastConnection[]> {
    let params = new HttpParams().set('limit', limit);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<LastConnection[]>(`${this.adminUrl}/last-connections`, { params });
  }

  getOptionSummary(): Observable<OptionSummary[]> {
    return this.http.get<OptionSummary[]>(`${this.adminUrl}/option-summary`);
  }

  getCourseProgress(cursoId: number | 'all' = 'all', search = '', limit = 120): Observable<CourseProgress[]> {
    let params = new HttpParams().set('limit', limit);
    if (cursoId !== 'all') {
      params = params.set('cursoId', cursoId);
    }
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<CourseProgress[]>(`${this.adminUrl}/course-progress`, { params });
  }

  getCourseOptions(): Observable<CourseOption[]> {
    return this.http.get<CourseOption[]>(`${this.adminUrl}/courses`);
  }

  trackRoute(url: string): Observable<void> {
    const route = this.normalizeUrl(url);
    const option = this.resolveRouteOption(route);
    if (!option) {
      return EMPTY;
    }

    const signature = `${option.key}:${route}`;
    if (signature === this.lastTrackedSignature) {
      return EMPTY;
    }
    this.lastTrackedSignature = signature;

    return this.http.post<void>(`${this.auditUrl}/navigation`, {
      optionKey: option.key,
      optionLabel: option.label,
      route
    }).pipe(catchError(() => EMPTY));
  }

  optionLabelFor(key: string | null | undefined): string {
    if (!key) return 'Sin opcion';
    return this.trackedOptions.find(option => option.key === key)?.label || key;
  }

  private resolveRouteOption(route: string): RouteOption | null {
    if (route === '/login' || route.startsWith('/reset-password') || route.startsWith('/change-password')) {
      return null;
    }
    return this.trackedOptions.find(option => option.match.test(route)) || null;
  }

  private normalizeUrl(url: string): string {
    const clean = (url || '').split('#')[0].split('?')[0];
    return clean.startsWith('/') ? clean : `/${clean}`;
  }
}
