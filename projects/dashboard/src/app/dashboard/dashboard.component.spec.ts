import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ToastService } from '../services/toast.service';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';

describe('DashboardComponent', () => {
  function setup(service: Record<string, unknown>) {
    const toast = { error: vi.fn(), success: vi.fn(), warning: vi.fn() };
    const dashboard = {
      getDashboardSummary: vi.fn(() => of({})),
      getDelinquentUsers: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 1, page: 1 })),
      getMoraTimeline: vi.fn(() => of([])),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { userProfile: signal({ roles: ['ROLE_ADMIN'] }), user: () => null, getUserProfile: () => of(null), logout: vi.fn() } },
        { provide: DashboardService, useValue: dashboard },
        { provide: PortfolioService, useValue: {} },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(DashboardComponent, '');
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast };
  }

  it('si falla la carga de usuarios con mora queda el banner de la tabla y no un toast repetido', () => {
    const { cmp, toast } = setup({ getDelinquentUsers: vi.fn(() => throwError(() => new Error('500'))) });

    expect(cmp.delinquentsError).toBe('No fue posible cargar los usuarios con mora.');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('si falla el resumen queda el banner de carga y no un toast', () => {
    const { cmp, toast } = setup({ getDashboardSummary: vi.fn(() => throwError(() => new Error('500'))) });

    expect(cmp.dashboardError).toBe('Algunos datos no se pudieron actualizar. Se muestran valores disponibles.');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('Exportar vuelve a estar disponible al terminar, sin datos o con error', () => {
    const { cmp, toast } = setup({});
    cmp.exportTopDelinquents();
    expect(toast.warning).toHaveBeenCalledWith('No hay datos para exportar.');
    expect(cmp.isExportingDelinquents).toBe(false);

    TestBed.resetTestingModule();
    const ko = setup({});
    (TestBed.inject(DashboardService) as unknown as { getDelinquentUsers: () => unknown }).getDelinquentUsers = () => throwError(() => new Error('500'));
    ko.cmp.exportTopDelinquents();
    expect(ko.toast.error).toHaveBeenCalledWith('Ocurrió un error al obtener los datos para exportar.');
    expect(ko.cmp.isExportingDelinquents).toBe(false);
  });

  it('la linea de tiempo de mora no tiene banner: su error va al snackbar', () => {
    const { cmp, toast } = setup({ getMoraTimeline: vi.fn(() => throwError(() => new Error('500'))) });
    cmp.loadTimelineData();

    expect(toast.error).toHaveBeenCalledWith('No fue posible cargar la linea de tiempo de mora.');
  });
});
