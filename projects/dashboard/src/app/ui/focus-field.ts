import { Injector, afterNextRender } from '@angular/core';

/**
 * Tras el proximo render, centra en pantalla el elemento con ese id y le pone
 * el foco. Sirve para llevar al usuario al primer campo con error de un
 * formulario: el campo ya enlaza su mensaje con aria-describedby, asi que el
 * lector de pantalla lo lee al recibir el foco. Centrar evita que el campo
 * quede bajo el header fijo.
 */
export function focusFieldAfterRender(injector: Injector, id: string): void {
  afterNextRender(
    {
      read: () => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView?.({ block: 'center' });
        el.focus({ preventScroll: true });
      },
    },
    { injector },
  );
}
