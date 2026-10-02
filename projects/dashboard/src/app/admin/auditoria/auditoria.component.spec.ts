import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { AuditoriaComponent } from './auditoria.component';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaComponent', () => {
  function setup(service: Record<string, unknown>) {
    const toast = { error: vi.fn(), success: vi.fn() };
    const auditoria = {
      trackedOptions: [],
      getSummary: vi.fn(() => of({ totalEvents: 0, navigationEvents: 0, loginEvents: 0, usersWithLogin: 0 })),
      getOptionSummary: vi.fn(() => of([])),
      getCourseOptions: vi.fn(() => of([])),
      getEvents: vi.fn(() => of({ content: [], number: 0, totalElements: 0, totalPages: 0 })),
      getLastConnections: vi.fn(() => of([])),
      getCourseProgress: vi.fn(() => of([])),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [AuditoriaComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: () => true, logout: vi.fn() } },
        { provide: AuditoriaService, useValue: auditoria },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(AuditoriaComponent, '');
    TestBed.createComponent(AuditoriaComponent).detectChanges();
    return { toast };
  }

  const fail = () => vi.fn(() => throwError(() => new Error('500')));

  it('cada carga que falla avisa con su mensaje en el snackbar', () => {
    const { toast } = setup({
      getSummary: fail(),
      getEvents: fail(),
      getLastConnections: fail(),
      getCourseProgress: fail(),
    });

    expect(toast.error.mock.calls.map(c => c[0])).toEqual([
      'No fue posible cargar el resumen de auditoria.',
      'No fue posible cargar la actividad.',
      'No fue posible cargar las ultimas conexiones.',
      'No fue posible cargar el avance de cursos.',
    ]);
  });

  it('si todo carga no avisa nada', () => {
    const { toast } = setup({});
    expect(toast.error).not.toHaveBeenCalled();
  });
});
