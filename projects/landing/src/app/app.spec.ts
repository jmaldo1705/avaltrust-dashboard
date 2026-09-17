import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('monta cabecera, contenido y pie en todas las rutas', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('at-site-header')).toBeTruthy();
    expect(compiled.querySelector('main router-outlet')).toBeTruthy();
    expect(compiled.querySelector('at-site-footer')).toBeTruthy();
  });

  it('ofrece un enlace para saltar al contenido', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const salto = (fixture.nativeElement as HTMLElement).querySelector('.saltar-contenido');
    expect(salto?.textContent).toContain('Saltar al contenido');
  });
});
