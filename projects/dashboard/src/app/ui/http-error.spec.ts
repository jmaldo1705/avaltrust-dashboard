import { HttpErrorResponse } from '@angular/common/http';
import { readHttpErrorMessage } from './http-error';

describe('readHttpErrorMessage', () => {
  const json = (body: unknown) => JSON.stringify(body);
  const httpError = (error: unknown, status = 400) => new HttpErrorResponse({ status, error });

  it('lee el message del JSON en un Blob, un ArrayBuffer, una vista de bytes, un string o un objeto', async () => {
    const bytes = new TextEncoder().encode(json({ message: 'En bytes' }));
    expect(await readHttpErrorMessage(httpError(new Blob([json({ message: 'En Blob' })])))).toBe('En Blob');
    expect(await readHttpErrorMessage(httpError(bytes.buffer))).toBe('En bytes');
    expect(await readHttpErrorMessage(httpError(bytes))).toBe('En bytes');
    expect(await readHttpErrorMessage(httpError(json({ message: 'En texto' })))).toBe('En texto');
    expect(await readHttpErrorMessage(httpError({ message: 'En objeto' }, 409))).toBe('En objeto');
  });

  it('no muestra cuerpos que no son JSON con un message de texto', async () => {
    for (const error of [
      new Blob(['<html>502 Bad Gateway</html>'], { type: 'text/html' }),
      new Blob([]),
      new Blob(['x'.repeat(64 * 1024 + 1)]),
      new TextEncoder().encode('<html>502</html>').buffer,
      new ArrayBuffer(0),
      '<html>502</html>',
      '',
      { error: 'Bad Request', status: 400 },
      { message: '   ' },
      { message: 42 },
      { message: { text: 'objeto' } },
      null,
    ]) {
      expect(await readHttpErrorMessage(httpError(error))).toBeNull();
    }
  });

  it('con un error de red o de JavaScript usa el respaldo: su texto no lo escribio el backend', async () => {
    // XHR (withXhr): sin conexion llega un ProgressEvent.
    expect(await readHttpErrorMessage(httpError(new ProgressEvent('error'), 0))).toBeNull();
    // fetch: sin conexion llega el TypeError del navegador; al abortar, un DOMException.
    expect(await readHttpErrorMessage(httpError(new TypeError('Failed to fetch'), 0))).toBeNull();
    expect(await readHttpErrorMessage(httpError(new DOMException('The user aborted a request.', 'AbortError'), 0))).toBeNull();
    expect(await readHttpErrorMessage(httpError(new ErrorEvent('error', { message: 'Script error.' }), 0))).toBeNull();
  });

  it('no falla con valores que no son un error HTTP ni con un Blob ilegible', async () => {
    const unreadable = new Blob(['{}']);
    vi.spyOn(unreadable, 'text').mockRejectedValue(new Error('NotReadableError'));
    for (const err of [undefined, null, 0, 'texto', new Error('boom'), { error: unreadable }, { status: 500 }]) {
      await expect(readHttpErrorMessage(err)).resolves.toBeNull();
    }
  });
});
