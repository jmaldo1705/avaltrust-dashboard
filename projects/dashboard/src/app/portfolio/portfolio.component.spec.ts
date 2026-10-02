import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AliadoService } from '../aliado/aliado.service';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { ExcelTemplateService } from './excel-template.service';
import { PortfolioComponent } from './portfolio.component';
import { PortfolioService } from './portfolio.service';

describe('PortfolioComponent (resultado y plantilla)', () => {
  function setup(service: Record<string, unknown> = {}, generate: () => void = vi.fn()) {
    const toast = { error: vi.fn(), success: vi.fn() };
    TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ username: 'aliado1', roles: ['ROLE_USER'] }), logout: vi.fn() } },
        { provide: AliadoService, useValue: { getActivos: () => of([]) } },
        { provide: PortfolioService, useValue: service },
        { provide: ExcelTemplateService, useValue: { generatePortfolioTemplate: generate } },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(PortfolioComponent, '');
    const fixture = TestBed.createComponent(PortfolioComponent);
    fixture.detectChanges();
    return { cmp: fixture.componentInstance, toast };
  }

  const file = (name: string, type: string, size = 10) => {
    const f = new File(['x'], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
  };

  it('archivo de tipo invalido: mensaje al snackbar y su lista en la pagina', () => {
    const { cmp, toast } = setup();
    cmp.onFileSelected({ target: { files: [file('notas.txt', 'text/plain')] } });

    expect(toast.error).toHaveBeenCalledWith('Tipo de archivo no permitido. Use Excel (.xls, .xlsx) o CSV (.csv)');
    expect(cmp.uploadResult.errors).toEqual(['Formato de archivo inválido']);
    expect(cmp.uploadedFile).toBeNull();
  });

  it('archivo de mas de 10 MB: mensaje al snackbar', () => {
    const { cmp, toast } = setup();
    cmp.onFileSelected({ target: { files: [file('grande.csv', 'text/csv', 11 * 1024 * 1024)] } });
    expect(toast.error).toHaveBeenCalledWith('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
  });

  it('carga masiva con errores: mensaje al snackbar y los errores por fila se quedan en la pagina', () => {
    const { cmp, toast } = setup({
      uploadPortfolioFile: vi.fn(() => throwError(() => ({ error: { message: 'Se encontraron errores en el archivo', errors: ['Fila 3: obligacion - Requerido'] } }))),
    });
    cmp.onFileSelected({ target: { files: [file('cartera.csv', 'text/csv')] } });
    cmp.onUploadFile();

    expect(toast.error).toHaveBeenCalledWith('Se encontraron errores en el archivo');
    expect(cmp.uploadResult.errors).toEqual(['Fila 3: obligacion - Requerido']);
  });

  it('carga masiva exitosa: snackbar y sin tarjeta en la pagina', () => {
    const { cmp, toast } = setup({ uploadPortfolioFile: vi.fn(() => of({ success: true, processedRecords: 4 })) });
    cmp.onFileSelected({ target: { files: [file('cartera.csv', 'text/csv')] } });
    cmp.onUploadFile();

    expect(toast.success).toHaveBeenCalledWith('Se procesaron exitosamente 4 registros');
    expect(cmp.uploadResult).toBeNull();
    expect(cmp.uploadedFile).toBeNull();
  });

  it('plantilla: si el backend falla se genera en el navegador y avisa; si eso tambien falla, error', () => {
    const ok = setup({ downloadTemplate: vi.fn(() => throwError(() => new Error('500'))) });
    ok.cmp.downloadTemplate();
    expect(ok.toast.success).toHaveBeenCalledWith('Plantilla descargada exitosamente');

    TestBed.resetTestingModule();
    const ko = setup({ downloadTemplate: vi.fn(() => throwError(() => new Error('500'))) }, () => { throw new Error('xlsx'); });
    ko.cmp.downloadTemplate();
    expect(ko.toast.error).toHaveBeenCalledWith('Error al descargar la plantilla');
    expect(ko.toast.success).not.toHaveBeenCalled();
  });
});
