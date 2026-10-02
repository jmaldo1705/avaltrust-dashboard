import { DOCUMENT, Directive, ElementRef, NgZone, OnDestroy, afterNextRender, inject } from '@angular/core';

export const AT_BOTTOM_BAR_VAR = '--at-bottom-bar';

/**
 * Franja inferior de la ventana que ocupa el snackbar en su sitio normal
 * mientras no se ha medido: 8 px de margen y dos lineas de texto. Solo una
 * barra que llega a esa franja sube el aviso. Al pintarse el aviso,
 * ToastService la corrige con su alto real (refreshBottomBars).
 */
export const AT_SNACK_ZONE = 72;

/** Tras un scroll o un resize se vuelve a medir cuando se detiene, no en cada fotograma. */
export const AT_BOTTOM_BAR_SETTLE_MS = 100;

/** Barras vivas por documento y el espacio que reserva cada una (0 = ninguno). */
const registry = new WeakMap<Document, Map<AtBottomBarDirective, number>>();
/** Franja del aviso por documento (AT_SNACK_ZONE hasta que se mide uno). */
const zones = new WeakMap<Document, number>();

/**
 * Vuelve a medir las barras del documento y publica el resultado. ToastService
 * lo llama al abrir un aviso (con la franja por defecto, para no depender de
 * una medida pendiente) y otra vez con el alto real del aviso ya pintado.
 */
export function refreshBottomBars(doc: Document, zone = AT_SNACK_ZONE): void {
  zones.set(doc, zone);
  const bars = registry.get(doc);
  if (!bars?.size) return;
  for (const bar of [...bars.keys()]) bar.refresh(false);
  publish(doc);
}

/**
 * Marca una barra de acciones al pie de la pantalla: Limpiar/Guardar de un
 * formulario o el pie de un modal. Publica en --at-bottom-bar sobre <html> el
 * espacio que ocupa desde el borde inferior de la ventana: su alto cuando esta
 * pegada abajo y algo mas cuando queda un poco por encima (al final del
 * formulario o en un modal que llena la pantalla). overlays.css lo suma al
 * margen inferior del snackbar para que no la tape.
 *
 * No reserva nada si la barra esta fuera de pantalla, oculta o deja libre la
 * franja del aviso. Se vuelve a medir al cambiar de tamano, al entrar o salir
 * de pantalla y cuando se detiene un scroll. Al destruirse, se quita.
 */
@Directive({
  selector: '[atBottomBar]',
})
export class AtBottomBarDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private onScreen = true;
  private listening = false;
  private settleTimer?: ReturnType<typeof setTimeout>;
  private destroyed = false;

  private readonly onViewportChange = (): void => {
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => this.refresh(), AT_BOTTOM_BAR_SETTLE_MS);
  };

  constructor() {
    afterNextRender(() => this.start());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.listen(false);
    registry.get(this.doc)?.delete(this);
    publish(this.doc);
  }

  /** Mide la barra y, salvo que se pida lo contrario, publica el resultado. */
  refresh(publishNow = true): void {
    if (this.destroyed) return;
    this.listen(this.onScreen);
    bars(this.doc).set(this, this.onScreen ? this.space() : 0);
    if (publishNow) publish(this.doc);
  }

  private start(): void {
    if (this.destroyed) return;
    // Observadores y scroll no tocan el estado de Angular: van fuera de la zona.
    this.zone.runOutsideAngular(() => {
      if (typeof ResizeObserver === 'function') {
        this.resizeObserver = new ResizeObserver(() => this.refresh());
        this.resizeObserver.observe(this.el);
      }
      // Sin IntersectionObserver se da por visible y se mide tras cada scroll.
      if (typeof IntersectionObserver === 'function') {
        this.intersectionObserver = new IntersectionObserver(entries => {
          const entry = entries[entries.length - 1];
          if (entry) this.onScreen = entry.isIntersecting;
          this.refresh();
        });
        this.intersectionObserver.observe(this.el);
      }
    });
    this.refresh();
  }

  /** Distancia del borde inferior de la ventana al borde superior de la barra, o 0. */
  private space(): number {
    const vh = this.doc.defaultView?.innerHeight ?? 0;
    const r = this.el.getBoundingClientRect();
    // display: none (una pestana oculta) mide 0; fuera de la ventana no estorba.
    if (!vh || r.height <= 0 || r.bottom <= 0 || r.top >= vh) return 0;
    // Si deja libre la franja del aviso, este cabe debajo sin moverse.
    if (vh - r.bottom >= (zones.get(this.doc) ?? AT_SNACK_ZONE)) return 0;
    const space = vh - Math.max(r.top, 0);
    // Una barra que ocupa mas de media ventana no sube el aviso a la mitad de arriba.
    return space > vh / 2 ? 0 : space;
  }

  /** Escucha scroll (tambien el de un contenedor, en captura) y resize mientras la barra esta en pantalla. */
  private listen(on: boolean): void {
    const view = this.doc.defaultView;
    if (!view || on === this.listening) return;
    this.listening = on;
    if (on) {
      this.zone.runOutsideAngular(() => {
        view.addEventListener('scroll', this.onViewportChange, { capture: true, passive: true });
        view.addEventListener('resize', this.onViewportChange, { passive: true });
      });
    } else {
      view.removeEventListener('scroll', this.onViewportChange, { capture: true });
      view.removeEventListener('resize', this.onViewportChange);
      clearTimeout(this.settleTimer);
    }
  }
}

function bars(doc: Document): Map<AtBottomBarDirective, number> {
  let map = registry.get(doc);
  if (!map) registry.set(doc, (map = new Map()));
  return map;
}

/** Si hay varias barras manda la que mas espacio reserva. Solo escribe si el valor cambia. */
function publish(doc: Document): void {
  const max = Math.max(0, ...(registry.get(doc)?.values() ?? []));
  const next = max > 0 ? `${Math.ceil(max)}px` : '';
  const root = doc.documentElement;
  if (root.style.getPropertyValue(AT_BOTTOM_BAR_VAR) === next) return;
  if (next) root.style.setProperty(AT_BOTTOM_BAR_VAR, next);
  else root.style.removeProperty(AT_BOTTOM_BAR_VAR);
}
