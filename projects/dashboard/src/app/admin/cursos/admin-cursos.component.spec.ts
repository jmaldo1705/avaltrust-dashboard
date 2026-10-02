import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { AdminCursosComponent } from './admin-cursos.component';
import { AdminCursosService, CursoAdmin } from './admin-cursos.service';

const curso = (id: number, orden: number) => ({ id, orden, titulo: `C${id}` }) as CursoAdmin;

describe('AdminCursosComponent', () => {
  function setup(service: Record<string, unknown> = {}) {
    const toast = { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() };
    const cursos = {
      listarCursosPaginados: vi.fn(() => of({ content: [curso(1, 1), curso(2, 2)], number: 0, size: 10, totalElements: 2, totalPages: 1 })),
      eliminarCurso: vi.fn(() => of(void 0)),
      actualizarCurso: vi.fn(() => of({})),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [AdminCursosComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: () => true, logout: vi.fn() } },
        { provide: AdminCursosService, useValue: cursos },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(AdminCursosComponent, '');
    const fixture = TestBed.createComponent(AdminCursosComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast, cursos };
  }

  it('si falla eliminar avisa con el snackbar y deja abierta la confirmacion', () => {
    const { cmp, toast } = setup({ eliminarCurso: vi.fn(() => throwError(() => new Error('409'))) });
    cmp.confirmarEliminar(cmp.cursos[0]);
    cmp.eliminarCurso();

    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el curso. Puede que tenga datos asociados.');
    expect(cmp.showDeleteModal).toBe(true);
  });

  it('si falla guardar el nuevo orden avisa con el snackbar y recarga la lista', () => {
    const { cmp, toast, cursos } = setup({ actualizarCurso: vi.fn(() => throwError(() => new Error('500'))) });
    cursos.listarCursosPaginados.mockClear();
    cmp.guardarNuevoOrden([...cmp.cursos].reverse());

    expect(toast.error).toHaveBeenCalledWith('Error al guardar el nuevo orden. Recargando...');
    expect(cmp.isReordering).toBe(false);
    expect(cursos.listarCursosPaginados).toHaveBeenCalledTimes(1);
  });
});
