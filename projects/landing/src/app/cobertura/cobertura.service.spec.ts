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

  it('la prima aplica la tasa de impago sobre la cobertura e incluye IVA', () => {
    const { prima } = servicio.estimar({
      valorPromedio: 5_000_000,
      creditosPorMes: 120,
      tasaImpago: 4,
    });
    // 600.000.000 x 4 % x 1,19
    expect(prima).toBeCloseTo(28_560_000, 2);
  });

  it('sin volumen no hay cobertura ni prima', () => {
    expect(servicio.estimar({ valorPromedio: 5_000_000, creditosPorMes: 0, tasaImpago: 4 }))
      .toEqual({ cobertura: 0, prima: 0 });
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
