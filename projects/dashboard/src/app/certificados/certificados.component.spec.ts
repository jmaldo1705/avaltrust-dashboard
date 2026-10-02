import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AliadoService } from '../aliado/aliado.service';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { CertificadosComponent } from './certificados.component';
import { CertificadosService } from './certificados.service';

describe('CertificadosComponent', () => {
  function setup(aliados: Record<string, unknown> = {}, certificados: Record<string, unknown> = {}) {
    const toast = { error: vi.fn(), success: vi.fn(), warning: vi.fn(), fromHttpError: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      imports: [CertificadosComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: AliadoService, useValue: { getActivos: vi.fn(() => of([{ id: 4, nombre: 'Aliado', nit: '900' }])), ...aliados } },
        { provide: CertificadosService, useValue: { downloadFile: vi.fn(), formatCurrency: (v: number) => String(v), ...certificados } },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideComponent(CertificadosComponent, { set: { imports: [FormsModule], schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
    const fixture = TestBed.createComponent(CertificadosComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    return { fixture, cmp, el: fixture.nativeElement as HTMLElement, toast };
  }

  async function render(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.tick();
  }

  it('ya no tiene banner de error en la pagina', () => {
    const { el } = setup();
    expect(el.querySelector('.error-message, .close-error')).toBeNull();
  });

  it('si falla la carga de aliados avisa con el snackbar', () => {
    const { toast } = setup({ getActivos: vi.fn(() => throwError(() => new Error('500'))) });
    expect(toast.error).toHaveBeenCalledWith('Error al cargar aliados estratégicos');
  });

  it('sin aliado: el error sale junto al select, que queda invalido y con el foco; se va al elegir uno', async () => {
    const { fixture, cmp, el, toast } = setup();
    cmp.onCertificateTypeChange('ingresos_terceros');
    await render(fixture);
    cmp.previewCertificate();
    await render(fixture);

    const select = el.querySelector<HTMLSelectElement>('#aliadoSelect')!;
    expect(el.querySelector('#cert-aliado-error')?.textContent?.trim()).toBe('Por favor seleccione un aliado estratégico');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe('cert-aliado-error');
    expect(document.activeElement).toBe(select);
    expect(toast.error).not.toHaveBeenCalled();

    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    await render(fixture);
    expect(el.querySelector('#cert-aliado-error')).toBeNull();
    expect(select.hasAttribute('aria-invalid')).toBe(false);
  });

  it('periodo incompleto y fechas al reves: el error sale bajo las fechas y el foco va a la que corresponde', async () => {
    const { fixture, cmp, el } = setup();
    cmp.onCertificateTypeChange('ingresos_terceros');
    cmp.selectedAliadoId = 4;
    cmp.fechaFin = '';
    await render(fixture);
    cmp.downloadCertificate();
    await render(fixture);

    const fin = el.querySelector<HTMLInputElement>('#fechaFin')!;
    expect(el.querySelector('#cert-fechas-error')?.textContent?.trim()).toBe('Por favor seleccione el periodo a certificar');
    expect(fin.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('#fechaInicio')!.hasAttribute('aria-invalid')).toBe(false);
    expect(document.activeElement).toBe(fin);

    cmp.fechaInicio = '2026-09-30';
    cmp.fechaFin = '2026-09-01';
    cmp.downloadCertificate();
    await render(fixture);
    const inicio = el.querySelector<HTMLInputElement>('#fechaInicio')!;
    expect(el.querySelector('#cert-fechas-error')?.textContent?.trim()).toBe('La fecha de inicio debe ser anterior a la fecha fin');
    expect(inicio.getAttribute('aria-invalid')).toBe('true');
    expect(inicio.getAttribute('aria-describedby')).toBe('cert-fechas-error');
    expect(document.activeElement).toBe(inicio);
  });

  it('si falla la descarga o la vista previa pasa el error a fromHttpError con su texto de respaldo', () => {
    const err = new HttpErrorResponse({ status: 500, error: new Blob(['']) });
    const { cmp, toast } = setup({}, {
      downloadCertificadoIngresos: vi.fn(() => throwError(() => err)),
      previewCertificadoIngresos: vi.fn(() => throwError(() => err)),
    });
    cmp.onCertificateTypeChange('ingresos_terceros');
    cmp.selectedAliadoId = 4;

    cmp.downloadCertificate();
    cmp.previewCertificate();

    expect(toast.fromHttpError).toHaveBeenCalledWith(err, 'Error al descargar el certificado');
    expect(toast.fromHttpError).toHaveBeenCalledWith(err, 'Error al generar vista previa del certificado');
    expect(cmp.isLoading).toBe(false);
    expect(cmp.formError).toBeNull();
  });
});
