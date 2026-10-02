import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { AdminCursosService, PreguntaAdmin } from './admin-cursos.service';
import { EvaluacionFormComponent } from './evaluacion-form.component';

const opcion = (textoOpcion: string, esCorrecta = false) => ({ textoOpcion, esCorrecta, explicacion: '', orden: 1 });
const pregunta = (textoPregunta: string, opciones = [opcion('A', true), opcion('B')]): PreguntaAdmin =>
  ({ cursoId: 1, textoPregunta, orden: 1, puntos: 10, opciones }) as PreguntaAdmin;

describe('EvaluacionFormComponent', () => {
  function setup(preguntas: PreguntaAdmin[] = [pregunta('Uno')], service: Record<string, unknown> = {}) {
    const auth = { logout: vi.fn() };
    const toast = { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() };
    const cursos = {
      obtenerEvaluacion: vi.fn(() => of({ cursoId: 1, preguntas })),
      guardarEvaluacion: vi.fn(() => of({})),
      ...service,
    };
    TestBed.configureTestingModule({
      imports: [EvaluacionFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } },
        { provide: AuthService, useValue: auth },
        { provide: AdminCursosService, useValue: cursos },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideComponent(EvaluacionFormComponent, { set: { imports: [FormsModule], schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
    const fixture = TestBed.createComponent(EvaluacionFormComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, cmp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, auth, toast, cursos, navigate };
  }

  async function render(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();
  }

  const text = (el: HTMLElement, sel: string) => el.querySelector(sel)?.textContent?.trim();

  it('cierra sesion con AuthService', () => {
    const { cmp, auth } = setup();
    cmp.onLogout();
    expect(auth.logout).toHaveBeenCalledWith(true);
  });

  it('pregunta sin texto: error junto a la pregunta, campo invalido y con foco; se va al escribir', async () => {
    const { fixture, cmp, el, cursos } = setup([pregunta('Uno'), pregunta('  ')]);
    cmp.preguntaExpandida = null;
    cmp.guardarEvaluacion();
    await render(fixture);

    expect(cursos.guardarEvaluacion).not.toHaveBeenCalled();
    expect(text(el, '#pregunta-1-error')).toBe('Todas las preguntas deben tener texto');
    expect(el.querySelector('#pregunta-0-error')).toBeNull();
    const input = el.querySelector<HTMLInputElement>('#pregunta-1-texto')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('pregunta-1-error');
    expect(document.activeElement).toBe(input);
    // El texto se corrige sin desplegar la pregunta.
    expect(cmp.preguntaExpandida).toBeNull();

    input.value = '¿Dos?';
    input.dispatchEvent(new Event('input'));
    await render(fixture);
    expect(el.querySelector('#pregunta-1-error')).toBeNull();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('pregunta con menos de 2 opciones: la despliega y enfoca Agregar Opcion; el error se va al agregarla', async () => {
    const { fixture, cmp, el } = setup([pregunta('Uno'), pregunta('Dos', [opcion('A', true)])]);
    cmp.preguntaExpandida = 0;
    cmp.guardarEvaluacion();
    await render(fixture);

    expect(cmp.preguntaExpandida).toBe(1);
    expect(text(el, '#pregunta-1-error')).toBe('Cada pregunta debe tener al menos 2 opciones');
    const agregar = el.querySelector<HTMLButtonElement>('#pregunta-1-agregar-opcion')!;
    expect(agregar.getAttribute('aria-describedby')).toBe('pregunta-1-error');
    expect(document.activeElement).toBe(agregar);

    agregar.click();
    await render(fixture);
    expect(el.querySelector('#pregunta-1-error')).toBeNull();
  });

  it('pregunta sin opcion correcta: enfoca el primer boton de marcar; el error se va al marcar una', async () => {
    const { fixture, cmp, el } = setup([pregunta('Uno', [opcion('A'), opcion('B')])]);
    cmp.guardarEvaluacion();
    await render(fixture);

    expect(text(el, '#pregunta-0-error')).toBe('Cada pregunta debe tener al menos una opción correcta');
    const marcar = el.querySelector<HTMLButtonElement>('#pregunta-0-correcta-0')!;
    expect(marcar.getAttribute('aria-describedby')).toBe('pregunta-0-error');
    expect(document.activeElement).toBe(marcar);

    el.querySelector<HTMLButtonElement>('#pregunta-0-correcta-1')!.click();
    await render(fixture);
    expect(el.querySelector('#pregunta-0-error')).toBeNull();
  });

  it('sin preguntas: error junto a la lista y foco en Agregar Pregunta; se va al agregar una', async () => {
    const { fixture, cmp, el } = setup();
    cmp.preguntas = [];
    cmp.guardarEvaluacion();
    await render(fixture);

    expect(text(el, '#evaluacion-sin-preguntas')).toBe('Debes agregar al menos una pregunta');
    const agregar = el.querySelector<HTMLButtonElement>('#evaluacion-agregar-pregunta')!;
    expect(agregar.getAttribute('aria-describedby')).toBe('evaluacion-sin-preguntas');
    expect(document.activeElement).toBe(agregar);

    agregar.click();
    await render(fixture);
    expect(el.querySelector('#evaluacion-sin-preguntas')).toBeNull();
  });

  it('quitar una de solo 2 opciones avisa con el snackbar y no la quita', () => {
    const { cmp, toast } = setup();
    cmp.eliminarOpcion(0, 1);
    expect(toast.warning).toHaveBeenCalledWith('Debe haber al menos 2 opciones');
    expect(cmp.preguntas[0].opciones.length).toBe(2);
  });

  it('si falla el guardado avisa con el snackbar y no navega', () => {
    const { cmp, toast, navigate } = setup([pregunta('Uno')], { guardarEvaluacion: vi.fn(() => throwError(() => new Error('500'))) });
    cmp.guardarEvaluacion();
    expect(toast.error).toHaveBeenCalledWith('Error al guardar la evaluación');
    expect(cmp.saving).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('una evaluacion valida se guarda y vuelve a la lista', () => {
    const { cmp, cursos, navigate, toast } = setup();
    cmp.guardarEvaluacion();
    expect(cursos.guardarEvaluacion).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/admin/cursos']);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
