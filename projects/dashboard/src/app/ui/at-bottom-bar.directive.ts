import { DOCUMENT, Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

export const AT_BOTTOM_BAR_VAR = '--at-bottom-bar';

/** Alturas publicadas por documento: si hay varias barras, manda la mas alta. */
const registry = new WeakMap<Document, Map<AtBottomBarDirective, number>>();

/**
 * Marca una barra fija al pie de la pagina (p. ej. Limpiar/Guardar) y publica
 * su altura en --at-bottom-bar sobre <html> mientras esta pintada y en
 * pantalla. overlays.css la suma al margen inferior del snackbar para que no
 * la tape. Al destruirse, la quita.
 */
@Directive({
  selector: '[atBottomBar]',
})
export class AtBottomBarDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private height = 0;
  private onScreen = true;
  private destroyed = false;

  constructor() {
    afterNextRender(() => this.start());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.bars().delete(this);
    this.publish();
  }

  private start(): void {
    if (this.destroyed) return;
    this.height = this.el.getBoundingClientRect().height;
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(entries => {
        const entry = entries[entries.length - 1];
        this.height = entry?.borderBoxSize?.[0]?.blockSize ?? this.el.getBoundingClientRect().height;
        this.update();
      });
      this.resizeObserver.observe(this.el);
    }
    // Sin IntersectionObserver se da por visible: el snackbar solo sube un poco.
    if (typeof IntersectionObserver === 'function') {
      this.intersectionObserver = new IntersectionObserver(entries => {
        const entry = entries[entries.length - 1];
        if (entry) this.onScreen = entry.isIntersecting;
        this.update();
      });
      this.intersectionObserver.observe(this.el);
    }
    this.update();
  }

  private update(): void {
    if (this.destroyed) return;
    // display: none (una pestana oculta) mide 0.
    if (this.height > 0 && this.onScreen) this.bars().set(this, this.height);
    else this.bars().delete(this);
    this.publish();
  }

  private bars(): Map<AtBottomBarDirective, number> {
    let bars = registry.get(this.doc);
    if (!bars) registry.set(this.doc, (bars = new Map()));
    return bars;
  }

  private publish(): void {
    const max = Math.max(0, ...this.bars().values());
    const root = this.doc.documentElement;
    if (max > 0) root.style.setProperty(AT_BOTTOM_BAR_VAR, `${Math.ceil(max)}px`);
    else root.style.removeProperty(AT_BOTTOM_BAR_VAR);
  }
}
