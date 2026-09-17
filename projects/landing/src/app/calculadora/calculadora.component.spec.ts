import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CalculadoraComponent } from './calculadora.component';

describe('CalculadoraComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculadoraComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function crear() {
    const fixture = TestBed.createComponent(CalculadoraComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('abre en el paso de parámetros financieros con una estimación ya calculada', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Parámetros Financieros');
    // 5.000.000 x 100 creditos
    expect(texto).toContain('500.000.000');
  });

  it('recalcula al cambiar el volumen mensual', () => {
    const fixture = crear();
    const componente = fixture.componentInstance as unknown as {
      operacion: { patchValue: (v: Record<string, unknown>) => void };
      coberturaFormateada: () => string;
    };

    componente.operacion.patchValue({ creditosPorMes: 200 });
    fixture.detectChanges();

    expect(componente.coberturaFormateada()).toContain('1.000.000.000');
  });

  it('no avanza al paso siguiente si faltan datos del aliado', () => {
    const fixture = crear();
    const componente = fixture.componentInstance as unknown as {
      paso: () => number;
      siguiente: () => void;
    };

    componente.siguiente(); // paso 1 valido con los valores por defecto
    expect(componente.paso()).toBe(2);

    componente.siguiente(); // paso 2 vacio: no debe avanzar
    expect(componente.paso()).toBe(2);
  });

  it('no envía nada al backend mientras no haya token de captcha', () => {
    const fixture = crear();
    const componente = fixture.componentInstance as unknown as {
      aliado: { patchValue: (v: Record<string, unknown>) => void };
      enviar: () => void;
      estado: () => string;
    };

    componente.aliado.patchValue({
      nombreCompleto: 'Prueba Local',
      cargoDesempena: 'gerente-general',
      nombreEmpresa: 'Fintech Demo',
      correoEmpresarial: 'prueba@ejemplo.com',
      celularCorporativo: '3001234567',
      acepta: true,
    });

    componente.enviar();

    expect(componente.estado()).toBe('error');
    http.expectNone(() => true);
  });
});
