import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
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
}

/**
 * Contenido del snackbar: icono por tipo, el mensaje tal cual y un boton de
 * cerrar de 44 px. No es una region viva: ToastService anuncia el mensaje
 * una sola vez con LiveAnnouncer. El estilo esta en styles/overlays.css.
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
    '(focusin)': 'setHold("focus", true)',
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

  close(): void {
    this.ref.dismiss();
  }

  setHold(reason: AtSnackHold, active: boolean): void {
    this.data.hold?.(reason, active);
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.setHold('focus', false);
  }
}
