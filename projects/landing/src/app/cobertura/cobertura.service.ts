import { Injectable } from '@angular/core';

export interface DatosCobertura {
  /** Monto tipico que otorgas por credito, en pesos. */
  valorPromedio: number;
  /** Creditos otorgados por mes. */
  creditosPorMes: number;
  /** Tasa historica de impagos a 90+ dias, en porcentaje (4.5 = 4,5 %). */
  tasaImpago: number;
}

export interface Estimacion {
  cobertura: number;
  prima: number;
}

/** IVA aplicado sobre la prima. */
const IVA = 1.19;

/**
 * Estimacion de cobertura y prima.
 *
 * La formula es la misma que usa la calculadora publicada en
 * avaltrust.co/calculadora desde 2025: cobertura = valor promedio x
 * volumen mensual, y prima = cobertura x tasa de impago x IVA. No se
 * modifica aqui porque es una definicion de negocio, no tecnica.
 */
@Injectable({ providedIn: 'root' })
export class CoberturaService {
  estimar(datos: DatosCobertura): Estimacion {
    const valorPromedio = Math.max(0, datos.valorPromedio || 0);
    const creditosPorMes = Math.max(0, datos.creditosPorMes || 0);
    const tasaImpago = Math.max(0, datos.tasaImpago || 0);

    const cobertura = valorPromedio * creditosPorMes;
    const prima = cobertura * (tasaImpago / 100) * IVA;

    return { cobertura, prima };
  }
}
