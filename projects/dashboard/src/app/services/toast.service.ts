import { DOCUMENT, Injectable, NgZone, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  MatSnackBar,
  MatSnackBarRef,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { AtSnackComponent, AtSnackData, AtSnackHold } from '../ui/at-snack.component';
import { AT_BOTTOM_BAR_VAR, refreshBottomBars } from '../ui/at-bottom-bar.directive';
import { readHttpErrorMessage } from '../ui/http-error';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Milisegundos hasta el cierre automatico; 0 = hasta que se cierre a mano. */
  duration?: number;
}

/** Tiempos del snackbar (plan movil, 2.2). */
export const TOAST_TIMING = {
  /** Un error se ve al menos 8 s. */
  error: 8000,
  /** El resto, 5 s por defecto y entre 4 y 6 s si quien llama pide otro valor. */
  default: 5000,
  min: 4000,
  max: 6000,
  /** Lo que no es error no reemplaza a un error durante sus primeros 2 s. */
  errorPriority: 2000,
  /** El mismo aviso (tipo y texto) dentro de 3 s se descarta. */
  dedupe: 3000,
  /** Al salir el puntero o el foco, quedan al menos 1 s antes del cierre. */
  resumeMin: 1000,
} as const;

interface ActiveToast {
  toast: Toast;
  ref: MatSnackBarRef<AtSnackComponent>;
  openedAt: number;
  /** false = se queda hasta que se cierre a mano (duration 0). */
  autoClose: boolean;
  /** Tiempo que falta; se recalcula al pausar. */
  remaining: number;
  deadline: number;
  timer?: ReturnType<typeof setTimeout>;
  holds: Set<AtSnackHold>;
}

/**
 * Avisos del dashboard sobre MatSnackBar, con la misma API que el toast
 * anterior: las llamadas de las pantallas no cambian.
 *
 * - Muestra un aviso a la vez, abajo al centro (AtSnackComponent).
 * - Lo anuncia una sola vez con LiveAnnouncer: assertive si es error,
 *   polite si no. El snackbar en si no es una region viva.
 * - El temporizador es propio (MatSnackBar recibe duration 0) y se pausa
 *   mientras el puntero o el foco estan sobre el aviso.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  /** El aviso visible (cero o uno). */
  public toasts$ = this.toastsSubject.asObservable();

  private active: ActiveToast | null = null;
  private pending: Toast | null = null;
  private pendingTimer?: ReturnType<typeof setTimeout>;
  private last: { key: string; at: number } | null = null;
  private announcedId: string | null = null;
  private positionOverride: (() => MatSnackBarVerticalPosition | null) | null = null;
  private seq = 0;

  show(message: string, type: Toast['type'] = 'info', duration?: number): void {
    if (typeof message !== 'string' || !message.trim()) return;
    const now = Date.now();
    const key = keyOf(type, message);
    if (this.last?.key === key && now - this.last.at < TOAST_TIMING.dedupe) return;
    if (this.pending && keyOf(this.pending.type, this.pending.message) === key) return;

    const toast: Toast = { id: this.nextId(), message, type, duration: resolveDuration(type, duration) };
    if (type !== 'error' && this.errorIsProtected(now)) {
      this.pending = toast;
      this.schedulePending();
      return;
    }
    this.open(toast);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /** Cierra el aviso con ese id (visible o en espera); sin id, cierra todo. */
  remove(id?: string): void {
    if (this.pending && (!id || this.pending.id === id)) this.clearPending();
    const active = this.active;
    if (active && (!id || active.toast.id === id)) this.zone.run(() => active.ref.dismiss());
  }

  /**
   * Muestra como error el `message` del cuerpo de un error HTTP, tambien
   * cuando llega dentro de un Blob (descargas); si no hay, usa `fallback`.
   */
  async fromHttpError(err: unknown, fallback: string): Promise<void> {
    const message = await readHttpErrorMessage(err);
    this.error(message ?? fallback);
  }

  /**
   * Gancho para las hojas de F4: decide si el aviso sale arriba o abajo
   * (null = abajo). Se consulta cada vez que se abre un aviso.
   */
  setPositionOverride(resolver: (() => MatSnackBarVerticalPosition | null) | null): void {
    this.positionOverride = resolver;
  }

  /**
   * Reabre el aviso visible con su tiempo restante y la posicion actual, sin
   * volver a anunciarlo. Sirve para que quede sobre un overlay recien abierto.
   */
  reposition(): void {
    const active = this.active;
    if (!active) return;
    let remaining = 0;
    if (active.autoClose) {
      remaining = active.timer
        ? Math.max(active.deadline - Date.now(), TOAST_TIMING.resumeMin)
        : Math.max(active.remaining, TOAST_TIMING.resumeMin);
    }
    this.open(active.toast, { announce: false, remaining, openedAt: active.openedAt });
  }

  // ---------- interno ----------

  private open(toast: Toast, opts: { announce?: boolean; remaining?: number; openedAt?: number } = {}): void {
    if (this.pending === toast) this.clearPending();
    if (this.active) this.stopTimer(this.active);

    // rendered va desde el principio: si el aviso se abre fuera de la zona,
    // Angular puede pintarlo antes de que zone.run devuelva la referencia.
    const data: AtSnackData = {
      message: toast.message,
      type: toast.type,
      rendered: host => this.fitAboveBars(host),
    };
    // Las barras de acciones ([atBottomBar]) se miden ahora: el aviso sale por encima.
    refreshBottomBars(this.document);
    const ref = this.zone.run(() =>
      this.snackBar.openFromComponent(AtSnackComponent, {
        data,
        duration: 0,
        politeness: 'off',
        horizontalPosition: 'center',
        verticalPosition: this.positionOverride?.() ?? 'bottom',
        panelClass: ['at-snack-panel', `at-snack-panel--${toast.type}`],
      }),
    );
    const now = Date.now();
    const remaining = opts.remaining ?? toast.duration ?? 0;
    const active: ActiveToast = {
      toast,
      ref,
      openedAt: opts.openedAt ?? now,
      autoClose: remaining > 0,
      remaining,
      deadline: 0,
      holds: new Set(),
    };
    data.hold = (reason, on) => this.hold(active, reason, on);
    this.active = active;
    ref.afterDismissed().subscribe(() => this.onDismissed(active));
    this.startTimer(active);
    this.toastsSubject.next([toast]);

    if (opts.announce !== false) {
      this.last = { key: keyOf(toast.type, toast.message), at: now };
      this.announcedId = toast.id;
      this.announcer.announce(toast.message, toast.type === 'error' ? 'assertive' : 'polite');
    }
  }

  /**
   * Con el aviso pintado se conoce cuanto ocupa desde el borde inferior: las
   * barras se vuelven a medir con ese alto y solo suben el aviso si lo tocan.
   * Se usa offsetHeight porque la animacion de entrada lo escala.
   */
  private fitAboveBars(host: HTMLElement): void {
    const container = host.closest<HTMLElement>('.mat-mdc-snack-bar-container');
    const view = this.document.defaultView;
    // Un aviso que ya se esta cerrando (lo reemplazo otro) no cuenta.
    if (!container?.isConnected || container.hasAttribute('mat-exit') || !view) return;
    const lifted = parseFloat(this.document.documentElement.style.getPropertyValue(AT_BOTTOM_BAR_VAR)) || 0;
    const margin = parseFloat(view.getComputedStyle(container).marginBottom) || 0;
    const zone = Math.ceil(container.offsetHeight + margin - lifted);
    if (zone > 0) refreshBottomBars(this.document, zone);
  }

  private onDismissed(active: ActiveToast): void {
    this.stopTimer(active);
    if (this.active !== active) return;
    this.active = null;
    this.toastsSubject.next([]);
    if (this.announcedId === active.toast.id) {
      this.announcedId = null;
      this.announcer.clear();
    }
    this.flushPending();
  }

  private hold(active: ActiveToast, reason: AtSnackHold, on: boolean): void {
    if (this.active !== active) return;
    const wasHeld = active.holds.size > 0;
    if (on) active.holds.add(reason);
    else active.holds.delete(reason);
    const held = active.holds.size > 0;
    if (held === wasHeld) return;
    if (held) {
      if (active.timer) active.remaining = Math.max(0, active.deadline - Date.now());
      this.stopTimer(active);
    } else {
      if (active.autoClose) active.remaining = Math.max(active.remaining, TOAST_TIMING.resumeMin);
      this.startTimer(active);
      this.flushPending();
    }
  }

  private startTimer(active: ActiveToast): void {
    this.stopTimer(active);
    if (!active.autoClose || active.holds.size) return;
    active.deadline = Date.now() + active.remaining;
    active.timer = this.zone.runOutsideAngular(() =>
      setTimeout(() => {
        active.timer = undefined;
        this.zone.run(() => active.ref.dismiss());
      }, active.remaining),
    );
  }

  private stopTimer(active: ActiveToast): void {
    if (active.timer) clearTimeout(active.timer);
    active.timer = undefined;
  }

  /** Un error recien abierto, o que se esta leyendo, no se reemplaza. */
  private errorIsProtected(now: number): boolean {
    const active = this.active;
    if (!active || active.toast.type !== 'error') return false;
    return now - active.openedAt < TOAST_TIMING.errorPriority || active.holds.size > 0;
  }

  private schedulePending(): void {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = undefined;
    const active = this.active;
    if (!active) return this.flushPending();
    const wait = active.openedAt + TOAST_TIMING.errorPriority - Date.now();
    // Si el error esta en pausa, el aviso sale al reanudarse (hold).
    if (wait > 0) {
      this.pendingTimer = this.zone.runOutsideAngular(() =>
        setTimeout(() => {
          this.pendingTimer = undefined;
          this.flushPending();
        }, wait),
      );
    }
  }

  private flushPending(): void {
    const toast = this.pending;
    if (!toast) return;
    if (this.errorIsProtected(Date.now())) return this.schedulePending();
    this.open(toast);
  }

  private clearPending(): void {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = undefined;
    this.pending = null;
  }

  private nextId(): string {
    return `toast-${Date.now()}-${++this.seq}`;
  }
}

const keyOf = (type: ToastType, message: string) => `${type}\u0000${message}`;

function resolveDuration(type: ToastType, requested?: number): number {
  if (requested !== undefined && requested <= 0) return 0;
  if (type === 'error') return Math.max(requested ?? TOAST_TIMING.error, TOAST_TIMING.error);
  if (requested === undefined) return TOAST_TIMING.default;
  return Math.min(Math.max(requested, TOAST_TIMING.min), TOAST_TIMING.max);
}
