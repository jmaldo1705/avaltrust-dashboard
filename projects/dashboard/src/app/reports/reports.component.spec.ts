import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { ReportsComponent } from './reports.component';
import { ReportsService } from './reports.service';

describe('ReportsComponent', () => {
  function setup(service: Record<string, unknown>) {
    const toast = { error: vi.fn(), success: vi.fn(), fromHttpError: vi.fn().mockResolvedValue(undefined) };
    const reports = { getReportHistory: vi.fn(() => of([])), downloadFile: vi.fn(), ...service };
    TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ username: 'admin' }), logout: vi.fn() } },
        { provide: ReportsService, useValue: reports },
        { provide: ToastService, useValue: toast },
      ],
    });
    TestBed.overrideTemplate(ReportsComponent, '');
    const fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    cmp.onReportTypeChange('portfolio_summary');
    return { cmp, toast, reports };
  }

  // Con responseType: 'blob' el JSON del error llega dentro de un Blob.
  const blobError = () => new HttpErrorResponse({
    status: 500,
    error: new Blob([JSON.stringify({ message: 'Detalle' })], { type: 'application/json' }),
  });

  it('si falla la descarga pasa el error a fromHttpError con el texto de siempre de respaldo', () => {
    const err = blobError();
    const { cmp, toast, reports } = setup({ downloadPDF: vi.fn(() => throwError(() => err)) });
    const alertSpy = vi.spyOn(window, 'alert');

    cmp.generateReport();

    expect(toast.fromHttpError).toHaveBeenCalledWith(err, 'Error al generar el reporte. Por favor, intente nuevamente.');
    expect(alertSpy).not.toHaveBeenCalled();
    expect(reports.downloadFile).not.toHaveBeenCalled();
    expect(cmp.isLoading).toBe(false);
  });

  it('si falla la vista previa pasa el error a fromHttpError y no abre el modal', () => {
    const err = new HttpErrorResponse({ status: 500 });
    const { cmp, toast } = setup({ generateReport: vi.fn(() => throwError(() => err)) });

    cmp.previewReport();

    expect(toast.fromHttpError).toHaveBeenCalledWith(err, 'Error al generar vista previa. Por favor, intente nuevamente.');
    expect(cmp.showPreview).toBe(false);
    expect(cmp.isLoading).toBe(false);
  });
});
