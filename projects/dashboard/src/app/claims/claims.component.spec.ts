import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { ClaimsTemplateService } from './claims-template.service';
import { ClaimsComponent } from './claims.component';
import { ClaimsService } from './claims.service';

describe('ClaimsComponent (resultado y plantilla)', () => {
  function setup(service: Record<string, unknown> = {}) {
    const toast = { error: vi.fn(), success: vi.fn() };
    const template = { generateClaimsTemplate: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClaimsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ username: 'aliado1' }), logout: vi.fn() } },
        { provide: ClaimsService, useValue: service },
        { provide: ClaimsTemplateService, useValue: template },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(ClaimsComponent, '');
    const fixture = TestBed.createComponent(ClaimsComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast, template };
  }

  afterEach(() => vi.restoreAllMocks());

  const csv = () => new File(['x'], 'siniestros.csv', { type: 'text/csv' });

  it('archivo de tipo invalido: mensaje al snackbar y su lista en la pagina', () => {
    const { cmp, toast } = setup();
    cmp.onFileSelected({ target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
    expect(toast.error).toHaveBeenCalledWith('Tipo de archivo no permitido. Use Excel (.xls, .xlsx) o CSV (.csv)');
    expect(cmp.uploadResult.errors).toEqual(['Formato de archivo inválido']);
  });

  it('carga masiva que falla sin detalle: snackbar y la lista con el error de conexion', () => {
    const { cmp, toast } = setup({ uploadClaimsFile: vi.fn(() => throwError(() => ({}))) });
    cmp.onFileSelected({ target: { files: [csv()] } });
    cmp.onUploadFile();

    expect(toast.error).toHaveBeenCalledWith('Error al procesar el archivo.');
    expect(cmp.uploadResult.errors).toEqual(['Error de conexión con el servidor']);
  });

  it('carga masiva exitosa: snackbar y sin tarjeta', () => {
    const { cmp, toast } = setup({ uploadClaimsFile: vi.fn(() => of({ success: true, processedRecords: 2 })) });
    cmp.onFileSelected({ target: { files: [csv()] } });
    cmp.onUploadFile();

    expect(toast.success).toHaveBeenCalledWith('Se procesaron exitosamente 2 siniestros');
    expect(cmp.uploadResult).toBeNull();
  });

  it('plantilla: descarga del backend o generada en el navegador, con aviso en ambos casos', () => {
    const backend = setup({ downloadTemplate: vi.fn(() => of(new Blob(['x']))) });
    const createObjectURL = vi.fn(() => 'blob:x');
    Object.assign(window.URL, { createObjectURL, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    backend.cmp.downloadTemplate();
    expect(backend.toast.success).toHaveBeenCalledWith('Plantilla descargada exitosamente');

    TestBed.resetTestingModule();
    const local = setup({ downloadTemplate: vi.fn(() => throwError(() => new Error('500'))) });
    local.cmp.downloadTemplate();
    expect(local.template.generateClaimsTemplate).toHaveBeenCalled();
    expect(local.toast.success).toHaveBeenCalledWith('Plantilla descargada exitosamente');
  });
});
