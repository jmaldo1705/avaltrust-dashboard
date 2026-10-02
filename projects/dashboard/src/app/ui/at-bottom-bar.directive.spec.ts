import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AT_BOTTOM_BAR_VAR, AtBottomBarDirective } from './at-bottom-bar.directive';

// jsdom no trae ResizeObserver ni IntersectionObserver: se simulan y el test
// decide que alto mide la barra y si esta en pantalla.
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
  emit(entry: object) {
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

describe('AtBottomBarDirective', () => {
  const value = () => document.documentElement.style.getPropertyValue(AT_BOTTOM_BAR_VAR);
  const resize = (i: number, blockSize: number) =>
    FakeObserver.resize[i].emit({ borderBoxSize: [{ blockSize, inlineSize: 390 }] });
  const intersect = (i: number, isIntersecting: boolean) => FakeObserver.intersection[i].emit({ isIntersecting });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.tick();
    return fixture;
  }

  beforeEach(() => {
    FakeObserver.resize = [];
    FakeObserver.intersection = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty(AT_BOTTOM_BAR_VAR);
  });

  it('publica la altura de la barra en <html> mientras esta en pantalla', () => {
    render();
    expect(FakeObserver.resize).toHaveLength(1);
    resize(0, 71.4);
    expect(value()).toBe('72px');

    intersect(0, false);
    expect(value()).toBe('');
    intersect(0, true);
    expect(value()).toBe('72px');
  });

  it('una barra oculta (display: none mide 0) no cuenta', () => {
    render();
    resize(0, 64);
    resize(0, 0);
    expect(value()).toBe('');
  });

  it('con varias barras manda la mas alta y al destruir una queda la otra', () => {
    const fixture = render();
    resize(0, 60);
    fixture.componentInstance.second.set(true);
    fixture.detectChanges();
    TestBed.tick();
    resize(1, 130);
    expect(value()).toBe('130px');

    fixture.componentInstance.second.set(false);
    fixture.detectChanges();
    expect(FakeObserver.resize[1].disconnected).toBe(true);
    expect(FakeObserver.intersection[1].disconnected).toBe(true);
    expect(value()).toBe('60px');
  });

  it('al destruirse quita la variable y desconecta los observadores', () => {
    const fixture = render();
    resize(0, 80);
    expect(value()).toBe('80px');
    fixture.destroy();
    expect(value()).toBe('');
    expect(FakeObserver.resize[0].disconnected).toBe(true);
  });

  it('sin IntersectionObserver da la barra por visible', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render();
    resize(0, 50);
    expect(value()).toBe('50px');
  });
});
