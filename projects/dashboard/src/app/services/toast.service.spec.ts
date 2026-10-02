import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { Toast, TOAST_TIMING, ToastService } from './toast.service';

@Component({ template: '' })
class Host {}

describe('ToastService (snackbar)', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        // jsdom: sin popover ni animaciones (plan movil, 6).
        { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    const fixture = TestBed.createComponent(Host);
    const service = TestBed.inject(ToastService);
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    const open = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent');
    const seen: Toast[][] = [];
    service.toasts$.subscribe(t => seen.push(t));
    return { fixture, service, announce, open, seen };
  }

  /** Avanza el reloj y deja que Material termine de abrir o cerrar. */
  async function tick(ms = 0) {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();
  }

  const snacks = () => [...document.querySelectorAll('.mat-mdc-snack-bar-container:not([mat-exit])')];
  const visibleMessages = () => snacks().map(el => el.querySelector('.at-snack__message')?.textContent?.trim());
  const snackEl = () => document.querySelector<HTMLElement>('.mat-mdc-snack-bar-container:not([mat-exit]) .at-snack')!;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach(el => (el.innerHTML = ''));
  });

  describe('API compatible con el toast anterior', () => {
    it('success, error, warning, info y show abren un snackbar con el mensaje y el tipo', async () => {
      const { service } = setup();
      for (const [type, call] of [
        ['success', () => service.success('Hecho')],
        ['error', () => service.error('Fallo')],
        ['warning', () => service.warning('Ojo')],
        ['info', () => service.info('Dato')],
        ['info', () => service.show('Por defecto')],
      ] as const) {
        call();
        await tick(TOAST_TIMING.errorPriority);
        const panel = document.querySelector('.mat-mdc-snack-bar-container:not([mat-exit])')!;
        expect(panel.classList).toContain(`at-snack-panel--${type}`);
        expect(panel.querySelector('.at-snack')!.getAttribute('data-type')).toBe(type);
      }
      expect(visibleMessages()).toEqual(['Por defecto']);
    });

    it('usa MatSnackBar con duracion 0 y politeness off: el temporizador y el anuncio son propios', async () => {
      const { service, open } = setup();
      service.success('Hecho');
      await tick();
      expect(open).toHaveBeenCalledTimes(1);
      const config = open.mock.calls[0][1]!;
      expect(config.duration).toBe(0);
      expect(config.politeness).toBe('off');
      expect(config.verticalPosition).toBe('bottom');
      expect(config.horizontalPosition).toBe('center');
    });

    it('se lee con MatSnackBarHarness y el boton de cerrar lo quita', async () => {
      const { fixture, service, seen } = setup();
      service.info('Mensaje para el harness');
      await tick();
      const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const harness = await loader.getHarness(MatSnackBarHarness);
      expect(await harness.getMessage()).toBe('Mensaje para el harness');
      expect(await harness.getAriaLive()).toBe('off');

      const close = snackEl().querySelector<HTMLButtonElement>('button.at-snack__close')!;
      expect(close.type).toBe('button');
      expect(close.getAttribute('aria-label')).toBe('Cerrar');
      close.click();
      await tick();
      expect(snacks()).toHaveLength(0);
      expect(seen.at(-1)).toEqual([]);
    });

    it('toasts$ refleja el aviso visible y remove(id) o remove() lo cierran', async () => {
      const { service, seen } = setup();
      service.success('Uno');
      await tick();
      const [toast] = seen.at(-1)!;
      expect(toast).toMatchObject({ message: 'Uno', type: 'success', duration: TOAST_TIMING.default });

      service.remove('otro-id');
      await tick();
      expect(visibleMessages()).toEqual(['Uno']);

      service.remove(toast.id);
      await tick();
      expect(snacks()).toHaveLength(0);
      expect(seen.at(-1)).toEqual([]);

      service.warning('Dos');
      await tick();
      service.remove();
      await tick();
      expect(snacks()).toHaveLength(0);
    });

    it('ignora mensajes vacios', async () => {
      const { service, open, announce } = setup();
      service.error('');
      service.info('   ');
      await tick();
      expect(open).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });
  });

  describe('anuncio', () => {
    it('anuncia una sola vez: assertive para errores y polite para el resto', async () => {
      const { service, announce } = setup();
      service.error('No se pudo guardar');
      await tick();
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenLastCalledWith('No se pudo guardar', 'assertive');

      await tick(TOAST_TIMING.error);
      service.success('Guardado');
      await tick();
      expect(announce).toHaveBeenCalledTimes(2);
      expect(announce).toHaveBeenLastCalledWith('Guardado', 'polite');

      service.warning('Revise');
      service.info('Nota');
      await tick();
      expect(announce.mock.calls.slice(2).map(c => c[1])).toEqual(['polite', 'polite']);
    });

    it('el snackbar no es una segunda region viva', async () => {
      const { service } = setup();
      service.error('Fallo');
      await tick(500);
      const live = [...document.querySelectorAll('[aria-live]')].filter(el => el.getAttribute('aria-live') !== 'off');
      expect(live.every(el => el.classList.contains('cdk-live-announcer-element'))).toBe(true);
      expect(snackEl().closest('[aria-live]')?.getAttribute('aria-live') ?? 'off').toBe('off');
      expect(document.querySelector('.mat-mdc-snack-bar-container [role="alert"], .mat-mdc-snack-bar-container [role="status"]')).toBeNull();
    });
  });

  describe('duraciones', () => {
    async function closesAfter(run: () => void, ms: number) {
      run();
      await tick(ms - 1);
      const openBefore = snacks().length;
      await tick(1);
      return { openBefore, openAfter: snacks().length };
    }

    it('error: 8 s aunque quien llama pida menos', async () => {
      const { service } = setup();
      expect(await closesAfter(() => service.error('a'), 8000)).toEqual({ openBefore: 1, openAfter: 0 });
      expect(await closesAfter(() => service.error('b', 5000), 8000)).toEqual({ openBefore: 1, openAfter: 0 });
    });

    it('el resto: 5 s por defecto, y lo pedido queda entre 4 y 6 s', async () => {
      const { service } = setup();
      expect(await closesAfter(() => service.success('a'), 5000)).toEqual({ openBefore: 1, openAfter: 0 });
      expect(await closesAfter(() => service.warning('b', 3000), 4000)).toEqual({ openBefore: 1, openAfter: 0 });
      expect(await closesAfter(() => service.info('c', 10000), 6000)).toEqual({ openBefore: 1, openAfter: 0 });
    });

    it('duracion 0: se queda hasta que se cierra', async () => {
      const { service } = setup();
      service.show('Fijo', 'info', 0);
      await tick(60_000);
      expect(visibleMessages()).toEqual(['Fijo']);
    });
  });

  describe('pausa', () => {
    it('se pausa con el puntero encima y sigue con el tiempo que le quedaba', async () => {
      const { service } = setup();
      service.success('Hecho');
      await tick(3000);
      snackEl().dispatchEvent(new MouseEvent('mouseenter'));
      await tick(30_000);
      expect(snacks()).toHaveLength(1);

      snackEl().dispatchEvent(new MouseEvent('mouseleave'));
      await tick(1999);
      expect(snacks()).toHaveLength(1);
      await tick(1);
      expect(snacks()).toHaveLength(0);
    });

    it('se pausa con el foco dentro y al salir le queda al menos 1 s', async () => {
      const { service } = setup();
      service.info('Nota');
      await tick(4900);
      const close = snackEl().querySelector('button')!;
      close.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await tick(10_000);
      expect(snacks()).toHaveLength(1);

      // El foco se mueve dentro del aviso: sigue en pausa.
      close.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: snackEl() }));
      await tick(10_000);
      expect(snacks()).toHaveLength(1);

      close.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      await tick(TOAST_TIMING.resumeMin - 1);
      expect(snacks()).toHaveLength(1);
      await tick(1);
      expect(snacks()).toHaveLength(0);
    });

    it('puntero y foco a la vez: sigue en pausa hasta que salen los dos', async () => {
      const { service } = setup();
      service.success('Hecho');
      await tick(1000);
      snackEl().dispatchEvent(new MouseEvent('mouseenter'));
      snackEl().dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      snackEl().dispatchEvent(new MouseEvent('mouseleave'));
      await tick(20_000);
      expect(snacks()).toHaveLength(1);
      snackEl().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await tick(4000);
      expect(snacks()).toHaveLength(0);
    });
  });

  describe('teclado', () => {
    it('al cerrarlo con el foco dentro, el foco vuelve al elemento de donde vino', async () => {
      const { service } = setup();
      const origin = document.body.appendChild(document.createElement('button'));
      origin.focus();
      service.error('Fallo');
      await tick();
      const close = snackEl().querySelector<HTMLButtonElement>('button.at-snack__close')!;
      close.focus();
      close.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: origin }));
      close.click();
      await tick();
      expect(snacks()).toHaveLength(0);
      expect(document.activeElement).toBe(origin);
      origin.remove();
    });

    it('si se cierra sin el foco dentro, no mueve el foco', async () => {
      const { service } = setup();
      const input = document.body.appendChild(document.createElement('input'));
      const other = document.body.appendChild(document.createElement('button'));
      service.info('Nota');
      await tick();
      // El foco paso por el aviso y volvio a la pagina antes de cerrarlo.
      snackEl().dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: other }));
      input.focus();
      snackEl().querySelector<HTMLButtonElement>('button.at-snack__close')!.click();
      await tick();
      expect(document.activeElement).toBe(input);
      input.remove();
      other.remove();
    });
  });

  describe('prioridad y duplicados', () => {
    it('un exito no tapa a un error en sus primeros 2 s: sale despues y se anuncia entonces', async () => {
      const { service, announce } = setup();
      service.error('Error de carga');
      await tick(500);
      service.success('Exportado');
      await tick(1000);
      expect(visibleMessages()).toEqual(['Error de carga']);
      expect(announce).toHaveBeenCalledTimes(1);

      await tick(500);
      expect(visibleMessages()).toEqual(['Exportado']);
      expect(announce).toHaveBeenCalledTimes(2);
      expect(announce).toHaveBeenLastCalledWith('Exportado', 'polite');
    });

    it('mientras el error se esta leyendo (puntero encima), el aviso espera', async () => {
      const { service } = setup();
      service.error('Error');
      await tick(100);
      snackEl().dispatchEvent(new MouseEvent('mouseenter'));
      service.info('Nota');
      await tick(5000);
      expect(visibleMessages()).toEqual(['Error']);
      snackEl().dispatchEvent(new MouseEvent('mouseleave'));
      await tick();
      expect(visibleMessages()).toEqual(['Nota']);
    });

    it('si el error se cierra antes, el aviso en espera sale enseguida', async () => {
      const { service } = setup();
      service.error('Error');
      await tick(100);
      service.warning('Aviso');
      await tick();
      snackEl().querySelector('button')!.click();
      await tick();
      expect(visibleMessages()).toEqual(['Aviso']);
    });

    it('un error si reemplaza enseguida a otro aviso, y otro error tambien', async () => {
      const { service } = setup();
      service.success('Hecho');
      await tick(100);
      service.error('Fallo 1');
      await tick();
      expect(visibleMessages()).toEqual(['Fallo 1']);
      service.error('Fallo 2');
      await tick();
      expect(visibleMessages()).toEqual(['Fallo 2']);
    });

    it('descarta el mismo aviso dentro de 3 s', async () => {
      const { service, announce, open } = setup();
      service.warning('No hay datos para exportar.');
      await tick(1000);
      service.warning('No hay datos para exportar.');
      await tick(1999);
      service.warning('No hay datos para exportar.');
      await tick();
      expect(open).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledTimes(1);

      await tick(1);
      service.warning('No hay datos para exportar.');
      await tick();
      expect(open).toHaveBeenCalledTimes(2);
    });

    it('el mismo texto con otro tipo no es un duplicado', async () => {
      const { service, open } = setup();
      service.info('Texto');
      service.error('Texto');
      await tick();
      expect(open).toHaveBeenCalledTimes(2);
    });

    it('tampoco duplica un aviso que esta en espera', async () => {
      const { service, open } = setup();
      service.error('Error');
      service.success('Hecho');
      service.success('Hecho');
      await tick(TOAST_TIMING.errorPriority);
      expect(open).toHaveBeenCalledTimes(2);
      expect(visibleMessages()).toEqual(['Hecho']);
    });
  });

  describe('fromHttpError', () => {
    const blobError = (body: string, type = 'application/json') =>
      new HttpErrorResponse({ status: 400, error: new Blob([body], { type }) });

    it('lee el message del JSON que llega dentro de un Blob', async () => {
      const { service } = setup();
      await service.fromHttpError(blobError(JSON.stringify({ message: 'Sin datos en el rango' })), 'Error al descargar');
      await tick();
      expect(visibleMessages()).toEqual(['Sin datos en el rango']);
      expect(document.querySelector('.at-snack-panel--error')).not.toBeNull();
    });

    it('usa el texto de respaldo si el Blob no trae JSON con message', async () => {
      const { service } = setup();
      await service.fromHttpError(blobError('<html>502</html>', 'text/html'), 'Error al descargar');
      await tick();
      expect(visibleMessages()).toEqual(['Error al descargar']);
      service.remove();
      await tick();
      // El campo error de Spring ("Bad Request") no se muestra.
      await service.fromHttpError(blobError(JSON.stringify({ error: 'Bad Request' })), 'Error al exportar');
      await tick();
      expect(visibleMessages()).toEqual(['Error al exportar']);
    });

    it('lee errores JSON normales y cae al respaldo con errores sin cuerpo', async () => {
      const { service, announce } = setup();
      await service.fromHttpError(new HttpErrorResponse({ status: 409, error: { message: 'Ya existe' } }), 'r');
      await service.fromHttpError({ error: JSON.stringify({ message: 'En texto' }) }, 'r');
      await service.fromHttpError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }), 'Sin conexion');
      await service.fromHttpError(new Error('boom'), 'Generico');
      await service.fromHttpError(null, 'Nulo');
      expect(announce.mock.calls.map(c => c[0])).toEqual(['Ya existe', 'En texto', 'Sin conexion', 'Generico', 'Nulo']);
      expect(announce.mock.calls.every(c => c[1] === 'assertive')).toBe(true);
    });
  });

  describe('gancho de posicion (F4)', () => {
    it('setPositionOverride decide arriba o abajo y reposition reabre sin volver a anunciar', async () => {
      const { service, open, announce } = setup();
      let top = false;
      service.setPositionOverride(() => (top ? 'top' : null));
      service.success('Hecho');
      await tick(1000);
      expect(open.mock.calls[0][1]!.verticalPosition).toBe('bottom');

      top = true;
      service.reposition();
      await tick();
      expect(open).toHaveBeenCalledTimes(2);
      expect(open.mock.calls[1][1]!.verticalPosition).toBe('top');
      expect(announce).toHaveBeenCalledTimes(1);
      expect(visibleMessages()).toEqual(['Hecho']);

      // Conserva el tiempo restante (4 s de 5).
      await tick(3999);
      expect(snacks()).toHaveLength(1);
      await tick(1);
      expect(snacks()).toHaveLength(0);
    });
  });
});
