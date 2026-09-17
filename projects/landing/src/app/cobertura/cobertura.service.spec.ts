import { TestBed } from '@angular/core/testing';
import { CoberturaService } from './cobertura.service';

describe('CoberturaService', () => {
  let servicio: CoberturaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(CoberturaService);
  });

  it('la cobertura es el valor promedio por el volumen mensual', () => {
    const { cobertura } = servicio.estimar({
      valorPromedio: 5_000_000,
      creditosPorMes: 120,
      tasaImpago: 4,
    });
    expect(cobertura).toBe(600_000_000);
  });

  it('dentro de la banda, la prima sigue la tasa de impago e incluye IVA', () => {
    const { prima, tasaPrima, ajuste } = servicio.estimar({
      valorPromedio: 5_000_000,
      creditosPorMes: 120,
      tasaImpago: 4,
    });
    // 600.000.000 x 4 % x 1,19
    expect(tasaPrima).toBe(4);
    expect(ajuste).toBeNull();
    expect(prima).toBeCloseTo(28_560_000, 2);
  });

  it('una tasa de impago por debajo del 2 % sube al piso de la banda', () => {
    const { tasaPrima, ajuste, prima } = servicio.estimar({
      valorPromedio: 1_000_000,
      creditosPorMes: 100,
      tasaImpago: 0.5,
    });
    expect(tasaPrima).toBe(2);
    expect(ajuste).toBe('piso');
    // 100.000.000 x 2 % x 1,19
    expect(prima).toBeCloseTo(2_380_000, 2);
  });

  it('una tasa de impago por encima del 8 % se corta en el techo de la banda', () => {
    const { tasaPrima, ajuste, prima } = servicio.estimar({
      valorPromedio: 1_000_000,
      creditosPorMes: 100,
      tasaImpago: 30,
    });
    expect(tasaPrima).toBe(8);
    expect(ajuste).toBe('techo');
    // 100.000.000 x 8 % x 1,19, muy lejos del 35,7 % que daba antes
    expect(prima).toBeCloseTo(9_520_000, 2);
  });

  it('los limites exactos de la banda no se consideran ajuste', () => {
    for (const tasaImpago of [2, 8]) {
      const { tasaPrima, ajuste } = servicio.estimar({
        valorPromedio: 1_000_000,
        creditosPorMes: 10,
        tasaImpago,
      });
      expect(tasaPrima).toBe(tasaImpago);
      expect(ajuste).toBeNull();
    }
  });

  it('sin volumen no hay cobertura ni prima, aunque aplique el piso', () => {
    const { cobertura, prima, tasaPrima } = servicio.estimar({
      valorPromedio: 5_000_000,
      creditosPorMes: 0,
      tasaImpago: 0,
    });
    expect(cobertura).toBe(0);
    expect(prima).toBe(0);
    expect(tasaPrima).toBe(2);
  });

  it('ignora valores negativos en lugar de devolver montos invertidos', () => {
    const { cobertura, prima } = servicio.estimar({
      valorPromedio: -5_000_000,
      creditosPorMes: 120,
      tasaImpago: -4,
    });
    expect(cobertura).toBe(0);
    expect(prima).toBe(0);
  });
});
