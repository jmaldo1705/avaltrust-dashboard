import { ToastService } from '../services/toast.service';
import { announceUploadResult } from './upload-result';

describe('announceUploadResult', () => {
  const toast = () => ({ success: vi.fn(), error: vi.fn() });

  it('exito: el mensaje va al snackbar y no queda nada en la pagina', () => {
    const t = toast();
    const inline = announceUploadResult(t as unknown as ToastService, { success: true, message: 'Hecho', records: 3, errors: [] });
    expect(t.success).toHaveBeenCalledWith('Hecho');
    expect(inline).toBeNull();
  });

  it('error con lista: el mensaje va al snackbar y la lista se queda en la pagina', () => {
    const t = toast();
    const result = { success: false, message: 'Con errores', records: 0, errors: ['Fila 2: Campo - Error'] };
    expect(announceUploadResult(t as unknown as ToastService, result)).toBe(result);
    expect(t.error).toHaveBeenCalledWith('Con errores');
  });

  it('error sin lista (o con errores que no son una lista): solo el snackbar', () => {
    const t = toast();
    expect(announceUploadResult(t as unknown as ToastService, { success: false, message: 'Fallo', errors: [] })).toBeNull();
    expect(announceUploadResult(t as unknown as ToastService, { success: false, message: 'Fallo 2', errors: { campo: 'x' } })).toBeNull();
    expect(t.error).toHaveBeenCalledTimes(2);
  });
});
