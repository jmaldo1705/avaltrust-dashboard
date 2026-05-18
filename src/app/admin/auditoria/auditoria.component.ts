import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideActivity,
  LucideBookOpen,
  LucideCalendarClock,
  LucideChevronLeft,
  LucideChevronRight,
  LucideClock3,
  LucideGraduationCap,
  LucideListFilter,
  LucideLoaderCircle,
  LucideRefreshCw,
  LucideRoute,
  LucideSearch,
  LucideShieldCheck,
  LucideUserRound
} from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../auth/auth.service';
import {
  AuditEvent,
  AuditEventType,
  AuditSummary,
  AuditoriaService,
  CourseOption,
  CourseProgress,
  LastConnection,
  OptionSummary
} from './auditoria.service';

type AuditTab = 'activity' | 'connections' | 'courses';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    SidebarComponent,
    LucideActivity,
    LucideBookOpen,
    LucideCalendarClock,
    LucideChevronLeft,
    LucideChevronRight,
    LucideClock3,
    LucideGraduationCap,
    LucideListFilter,
    LucideLoaderCircle,
    LucideRefreshCw,
    LucideRoute,
    LucideSearch,
    LucideShieldCheck,
    LucideUserRound
  ],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSidebarOpen = false;
  isUserMenuOpen = false;
  activeTab: AuditTab = 'activity';

  summary: AuditSummary = {
    totalEvents: 0,
    navigationEvents: 0,
    loginEvents: 0,
    usersWithLogin: 0
  };

  optionSummary: OptionSummary[] = [];
  events: AuditEvent[] = [];
  lastConnections: LastConnection[] = [];
  courseProgress: CourseProgress[] = [];
  courseOptions: CourseOption[] = [];

  loadingSummary = false;
  loadingActivity = false;
  loadingConnections = false;
  loadingCourses = false;
  errorMessage = '';

  eventFilters = {
    type: 'NAVIGATION' as AuditEventType | 'all',
    optionKey: 'all',
    search: '',
    from: '',
    to: ''
  };

  currentPage = 0;
  pageSize = 20;
  totalEvents = 0;
  totalPages = 0;

  connectionSearch = '';
  selectedCourse: number | 'all' = 'all';
  courseSearch = '';

  ngOnInit(): void {
    if (!this.authService.hasRole('ROLE_ADMIN')) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadInitialData();
  }

  get trackedOptions() {
    return this.auditoriaService.trackedOptions;
  }

  get rangeStart(): number {
    return this.totalEvents === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalEvents);
  }

  get pageNumbers(): number[] {
    if (this.totalPages <= 1) return [];

    const windowSize = 5;
    let start = Math.max(0, this.currentPage - Math.floor(windowSize / 2));
    let end = Math.min(this.totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);

    const pages: number[] = [];
    for (let page = start; page <= end; page++) {
      pages.push(page);
    }
    return pages;
  }

  loadInitialData(): void {
    this.loadingSummary = true;
    this.errorMessage = '';

    forkJoin({
      summary: this.auditoriaService.getSummary(),
      optionSummary: this.auditoriaService.getOptionSummary(),
      courseOptions: this.auditoriaService.getCourseOptions()
    }).pipe(finalize(() => (this.loadingSummary = false))).subscribe({
      next: ({ summary, optionSummary, courseOptions }) => {
        this.summary = summary;
        this.optionSummary = optionSummary || [];
        this.courseOptions = courseOptions || [];
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el resumen de auditoria.';
      }
    });

    this.loadActivity(0);
    this.loadConnections();
    this.loadCourseProgress();
  }

  refreshCurrentTab(): void {
    this.loadInitialData();
  }

  setTab(tab: AuditTab): void {
    this.activeTab = tab;
    if (tab === 'activity' && !this.events.length) {
      this.loadActivity(0);
    }
    if (tab === 'connections' && !this.lastConnections.length) {
      this.loadConnections();
    }
    if (tab === 'courses' && !this.courseProgress.length) {
      this.loadCourseProgress();
    }
  }

  loadActivity(page = this.currentPage): void {
    this.loadingActivity = true;
    this.errorMessage = '';

    this.auditoriaService.getEvents({
      type: this.eventFilters.type,
      optionKey: this.eventFilters.optionKey,
      search: this.eventFilters.search,
      from: this.eventFilters.from,
      to: this.eventFilters.to,
      page,
      size: this.pageSize
    }).pipe(finalize(() => (this.loadingActivity = false))).subscribe({
      next: response => {
        this.events = response.content || [];
        this.currentPage = response.number ?? page;
        this.totalEvents = response.totalElements ?? this.events.length;
        this.totalPages = response.totalPages ?? 0;
      },
      error: () => {
        this.events = [];
        this.errorMessage = 'No fue posible cargar la actividad.';
      }
    });
  }

  applyActivityFilters(): void {
    this.loadActivity(0);
  }

  clearActivityFilters(): void {
    this.eventFilters = {
      type: 'NAVIGATION',
      optionKey: 'all',
      search: '',
      from: '',
      to: ''
    };
    this.loadActivity(0);
  }

  loadConnections(): void {
    this.loadingConnections = true;
    this.auditoriaService.getLastConnections(this.connectionSearch)
      .pipe(finalize(() => (this.loadingConnections = false)))
      .subscribe({
        next: data => {
          this.lastConnections = data || [];
        },
        error: () => {
          this.lastConnections = [];
          this.errorMessage = 'No fue posible cargar las ultimas conexiones.';
        }
      });
  }

  loadCourseProgress(): void {
    this.loadingCourses = true;
    this.auditoriaService.getCourseProgress(this.selectedCourse, this.courseSearch)
      .pipe(finalize(() => (this.loadingCourses = false)))
      .subscribe({
        next: data => {
          this.courseProgress = data || [];
        },
        error: () => {
          this.courseProgress = [];
          this.errorMessage = 'No fue posible cargar el avance de cursos.';
        }
      });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage || this.loadingActivity) return;
    this.loadActivity(page);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  optionLabel(key: string | null | undefined): string {
    return this.auditoriaService.optionLabelFor(key);
  }

  eventTypeLabel(type: AuditEventType): string {
    return type === 'LOGIN' ? 'Inicio de sesion' : 'Navegacion';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin registro';

    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  formatPercent(value: number | null | undefined): string {
    const percentage = Number(value ?? 0);
    return `${percentage.toFixed(1)}%`;
  }

  trackByEventId(index: number, event: AuditEvent): number {
    return event.id || index;
  }

  trackByUserId(index: number, user: LastConnection): number {
    return user.userId || index;
  }

  trackByCourseProgress(index: number, item: CourseProgress): string {
    return `${item.userId}-${item.cursoId}`;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  handleSidebarClose(): void {
    this.isSidebarOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  handleUserMenuClose(): void {
    this.isUserMenuOpen = false;
  }

  onHeaderNavigate(path: string): void {
    this.router.navigate([path]);
  }

  onSidebarNavigate(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
