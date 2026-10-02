import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { AdminCursosService } from './admin-cursos.service';
import { CursoFormComponent } from './curso-form.component';

describe('CursoFormComponent', () => {
  function setup(params: Record<string, string> = {}, service: Partial<Record<keyof AdminCursosService, unknown>> = {}) {
    const auth = { logout: vi.fn() };
    const toast = { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() };
    const cursos = {
      obtenerSiguienteOrden: vi.fn(() => of(3)),
      obtenerCurso: vi.fn(() => of({ titulo: 'T', descripcion: 'D', objetivos: [], secciones: [] })),
      crearCurso: vi.fn(() => of({})),
      actualizarCurso: vi.fn(() => of({})),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [CursoFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { params: of(params) } },
        { provide: AuthService, useValue: auth },
        { provide: AdminCursosService, useValue: cursos },
        { provide: ToastService, useValue: toast },
      ],
    });
    // Header y sidebar no son parte de la prueba.
    TestBed.overrideComponent(CursoFormComponent, { set: { imports: [FormsModule], schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
    const fixture = TestBed.createComponent(CursoFormComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, cmp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, auth, toast, cursos, navigate };
  }

  async function render(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();
  }

  it('cierra sesion con AuthService', () => {
    const { cmp, auth } = setup();
    cmp.onLogout();
    expect(auth.logout).toHaveBeenCalledWith(true);
  });

  it('sin titulo ni descripcion no guarda: muestra los dos errores junto a sus campos y enfoca el titulo', async () => {
    const { fixture, cmp, el, cursos, toast } = setup();
    cmp.guardarCurso();
    await render(fixture);

    expect(cursos.crearCurso).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    const titulo = el.querySelector<HTMLInputElement>('#curso-titulo')!;
    const descripcion = el.querySelector<HTMLTextAreaElement>('#curso-descripcion')!;
    expect(el.querySelector('#curso-titulo-error')?.textContent?.trim()).toBe('El título es obligatorio');
    expect(el.querySelector('#curso-descripcion-error')?.textContent?.trim()).toBe('La descripción es obligatoria');
    expect(titulo.getAttribute('aria-invalid')).toBe('true');
    expect(titulo.getAttribute('aria-describedby')).toBe('curso-titulo-error');
    expect(descripcion.getAttribute('aria-invalid')).toBe('true');
    expect(descripcion.getAttribute('aria-describedby')).toBe('curso-descripcion-error');
    expect(document.activeElement).toBe(titulo);
  });

  it('con titulo pero sin descripcion enfoca la descripcion, y el error se va al escribir', async () => {
    const { fixture, cmp, el } = setup();
    cmp.curso.titulo = 'Presupuesto';
    cmp.guardarCurso();
    await render(fixture);

    const descripcion = el.querySelector<HTMLTextAreaElement>('#curso-descripcion')!;
    expect(el.querySelector('#curso-titulo-error')).toBeNull();
    expect(el.querySelector('#curso-titulo')!.hasAttribute('aria-invalid')).toBe(false);
    expect(document.activeElement).toBe(descripcion);

    descripcion.value = 'Breve';
    descripcion.dispatchEvent(new Event('input'));
    await render(fixture);
    expect(el.querySelector('#curso-descripcion-error')).toBeNull();
    expect(descripcion.hasAttribute('aria-invalid')).toBe(false);
    expect(descripcion.hasAttribute('aria-describedby')).toBe(false);
  });

  it('si falla el guardado avisa con el snackbar y no navega', async () => {
    const { cmp, toast, navigate } = setup({}, { crearCurso: vi.fn(() => throwError(() => new Error('500'))) });
    cmp.curso.titulo = 'Presupuesto';
    cmp.curso.descripcion = 'Breve';
    cmp.guardarCurso();

    expect(toast.error).toHaveBeenCalledWith('Error al guardar el curso');
    expect(cmp.saving).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('si falla la carga avisa con el snackbar y vuelve a la lista', () => {
    const { toast, navigate } = setup({ id: '7' }, { obtenerCurso: vi.fn(() => throwError(() => new Error('404'))) });

    expect(toast.error).toHaveBeenCalledWith('Error al cargar el curso');
    expect(navigate).toHaveBeenCalledWith(['/admin/cursos']);
  });
});
