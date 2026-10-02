import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideInfo,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

export type AtSnackType = 'success' | 'error' | 'warning' | 'info';
export type AtSnackHold = 'hover' | 'focus';

export interface AtSnackData {
  message: string;
  type: AtSnackType;
  /** El facade pausa su temporizador mientras el puntero o el foco estan dentro. */
  hold?: (reason: AtSnackHold, active: boolean) => void;
  /** Ya pintado: el facade mide su alto para dejarlo por encima de las barras de acciones. */
  rendered?: (host: HTMLElement) => void;
}

/**
 * Contenido del snackbar: icono por tipo, el mensaje tal cual y un boton de
 * cerrar de 44 px. No es una region viva: ToastService anuncia el mensaje
 * una sola vez con LiveAnnouncer. El estilo esta en styles/overlays.css.
 *
 * Si se cierra con el foco dentro (se llego con Tab), el foco vuelve al
 * elemento de la pagina de donde vino en lugar de perderse en el body.
 */
@Component({
  selector: 'at-snack',
  imports: [MatSnackBarLabel, LucideCircleCheck, LucideCircleX, LucideInfo, LucideTriangleAlert, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'at-snack',
    '[attr.data-type]': 'data.type',
    '(mouseenter)': 'setHold("hover", true)',
    '(mouseleave)': 'setHold("hover", false)',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <span class="at-snack__icon">
      @switch (data.type) {
        @case ('success') {
          <svg lucideCircleCheck></svg>
        }
        @case ('error') {
          <svg lucideCircleX></svg>
        }
        @case ('warning') {
          <svg lucideTriangleAlert></svg>
        }
        @default {
          <svg lucideInfo></svg>
        }
      }
    </span>
    <p matSnackBarLabel class="at-snack__message">{{ data.message }}</p>
    <button type="button" class="at-snack__close" aria-label="Cerrar" (click)="close()">
      <svg lucideX></svg>
    </button>
  `,
})
export class AtSnackComponent {
  readonly data = inject<AtSnackData>(MAT_SNACK_BAR_DATA);
  private readonly ref = inject<MatSnackBarRef<AtSnackComponent>>(MatSnackBarRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Elemento de la pagina que tenia el foco antes de entrar en el aviso. */
  private returnFocus: HTMLElement | null = null;

  constructor() {
    afterNextRender({ read: () => this.data.rendered?.(this.host) });
  }

  close(): void {
    const hadFocus = this.host.contains(this.host.ownerDocument.activeElement);
    this.ref.dismiss();
    // Sin desplazar la pagina: con el raton tambien llega aqui y no debe saltar.
    if (hadFocus && this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true });
  }

  onFocusIn(event: FocusEvent): void {
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !this.host.contains(from)) this.returnFocus = from;
    this.setHold('focus', true);
  }

  setHold(reason: AtSnackHold, active: boolean): void {
    this.data.hold?.(reason, active);
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.setHold('focus', false);
  }
}
