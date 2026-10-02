import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AT_BOTTOM_BAR_SETTLE_MS,
  AT_BOTTOM_BAR_VAR,
  AtBottomBarDirective,
  refreshBottomBars,
} from './at-bottom-bar.directive';

// jsdom no trae ResizeObserver ni IntersectionObserver ni maqueta: se simulan
// y el test decide donde esta cada barra y si esta en pantalla.
class FakeObserver {
  static resize: FakeObserver[] = [];
  static intersection: FakeObserver[] = [];
  targets: Element[] = [];
  disconnected = false;
  constructor(private readonly cb: (entries: unknown[]) => void) {}
  observe(el: Element) {
    this.targets.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  emit(entry: object = {}) {
    this.cb([{ target: this.targets[0], ...entry }]);
  }
}
class FakeResizeObserver extends FakeObserver {
  constructor(cb: (entries: unknown[]) => void) {
    super(cb);
    FakeObserver.resize.push(this);
  }
}
class FakeIntersectionObserver extends FakeObserver {
  constructor(cb: (entries: unknown[]) => void) {
    super(cb);
    FakeObserver.intersection.push(this);
  }
}

@Component({
  imports: [AtBottomBarDirective],
  template: `
    @if (first()) {
      <div class="bar-a" atBottomBar></div>
    }
    @if (second()) {
      <div class="bar-b" atBottomBar></div>
    }
  `,
})
class Host {
  first = signal(true);
  second = signal(false);
}

/** Alto de la ventana de jsdom. */
let VH = 0;

describe('AtBottomBarDirective', () => {
  const value = () => document.documentElement.style.getPropertyValue(AT_BOTTOM_BAR_VAR);
  /** Coloca la barra: borde superior y alto en px de la ventana. */
  const place = (selector: string, top: number, height: number) => {
    const el = document.querySelector<HTMLElement>(selector)!;
    el.getBoundingClientRect = () => ({ top, bottom: top + height, height, left: 0, right: 390, width: 390, x: 0, y: top, toJSON() {} }) as DOMRect;
  };
  const resized = (i: number) => FakeObserver.resize[i].emit();
  const intersect = (i: number, isIntersecting: boolean) => FakeObserver.intersection[i].emit({ isIntersecting });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    place('.bar-a', VH, 0);
    TestBed.tick();
    return fixture;
  }

  beforeEach(() => {
    FakeObserver.resize = [];
    FakeObserver.intersection = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    VH = document.defaultView!.innerHeight;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty(AT_BOTTOM_BAR_VAR);
  });

  it('pegada al pie publica su alto en <html> mientras esta en pantalla', () => {
    render();
    expect(FakeObserver.resize).toHaveLength(1);
    place('.bar-a', VH - 71.4, 71.4);
    resized(0);
    expect(value()).toBe('72px');

    intersect(0, false);
    expect(value()).toBe('');
    intersect(0, true);
    expect(value()).toBe('72px');
  });

  it('un poco por encima del pie (final del formulario) reserva hasta su borde superior', () => {
    render();
    // 126 px de alto y 36 px libres debajo: el aviso tiene que quedar por encima de los 162 px.
    place('.bar-a', VH - 162, 126);
    resized(0);
    expect(value()).toBe('162px');
  });

  it('si deja libre la franja del aviso no reserva nada', () => {
    render();
    // Pie de un modal centrado en escritorio: 114 px libres debajo.
    place('.bar-a', VH - 166, 52);
    resized(0);
    expect(value()).toBe('');
  });

  it('una barra oculta (display: none mide 0) o de mas de media ventana no cuenta', () => {
    render();
    place('.bar-a', VH - 64, 64);
    resized(0);
    expect(value()).toBe('64px');
    place('.bar-a', 0, 0);
    resized(0);
    expect(value()).toBe('');
    place('.bar-a', VH - VH / 2 - 20, VH / 2 + 20);
    resized(0);
    expect(value()).toBe('');
  });

  it('se vuelve a medir cuando se detiene el scroll, no en cada evento', () => {
    vi.useFakeTimers();
    render();
    place('.bar-a', VH - 70, 70);
    resized(0);
    expect(value()).toBe('70px');

    // Al llegar al final de la pagina la barra deja de estar pegada y sube 40 px.
    place('.bar-a', VH - 110, 70);
    document.defaultView!.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(AT_BOTTOM_BAR_SETTLE_MS - 1);
    expect(value()).toBe('70px');
    document.defaultView!.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(AT_BOTTOM_BAR_SETTLE_MS);
    expect(value()).toBe('110px');
  });

  it('refreshBottomBars mide en el momento (lo usa el snackbar al abrirse)', () => {
    render();
    place('.bar-a', VH - 60, 60);
    resized(0);
    place('.bar-a', VH - 90, 60);
    expect(value()).toBe('60px');
    refreshBottomBars(document);
    expect(value()).toBe('90px');
  });

  it('con el alto real del aviso solo sube si lo toca', () => {
    render();
    // Pie de un modal con 80 px libres debajo: un aviso de dos lineas (72 px) cabe.
    place('.bar-a', VH - 132, 52);
    refreshBottomBars(document);
    expect(value()).toBe('');
    // Uno de tres lineas (93 px) no: sube por encima del pie.
    refreshBottomBars(document, 93);
    expect(value()).toBe('132px');
    // El siguiente aviso vuelve a empezar por la franja por defecto.
    refreshBottomBars(document);
    expect(value()).toBe('');
  });

  it('con varias barras manda la que mas reserva y al destruir una queda la otra', () => {
    const fixture = render();
    place('.bar-a', VH - 60, 60);
    resized(0);
    fixture.componentInstance.second.set(true);
    fixture.detectChanges();
    place('.bar-b', VH - 130, 130);
    TestBed.tick();
    expect(value()).toBe('130px');

    fixture.componentInstance.second.set(false);
    fixture.detectChanges();
    expect(FakeObserver.resize[1].disconnected).toBe(true);
    expect(FakeObserver.intersection[1].disconnected).toBe(true);
    expect(value()).toBe('60px');
  });

  it('al destruirse quita la variable, desconecta los observadores y deja de escuchar el scroll', () => {
    vi.useFakeTimers();
    const fixture = render();
    place('.bar-a', VH - 80, 80);
    resized(0);
    expect(value()).toBe('80px');
    const remove = vi.spyOn(document.defaultView!, 'removeEventListener');
    fixture.destroy();
    expect(value()).toBe('');
    expect(FakeObserver.resize[0].disconnected).toBe(true);
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true });
  });

  it('sin IntersectionObserver da la barra por visible', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render();
    place('.bar-a', VH - 50, 50);
    resized(0);
    expect(value()).toBe('50px');
  });
});
