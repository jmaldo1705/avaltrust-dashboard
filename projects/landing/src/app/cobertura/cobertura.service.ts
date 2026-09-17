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
  /** Porcentaje del valor cubierto que se cobra como prima, ya acotado. */
  tasaPrima: number;
  /** Si la tasa de impago quedo fuera de la banda y hubo que acotarla. */
  ajuste: 'piso' | 'techo' | null;
}

/** IVA aplicado sobre la prima. */
const IVA = 1.19;

/** La prima siempre queda entre el 2 % y el 8 % del valor cubierto. */
export const TASA_PRIMA_MINIMA = 2;
export const TASA_PRIMA_MAXIMA = 8;

/**
 * Estimacion de cobertura y prima.
 *
 * La cobertura es el valor promedio por el volumen mensual. La prima es un
 * porcentaje de esa cobertura que sigue la tasa de impago del aliado, pero
 * acotado a la banda 2-8 % que define el producto: por debajo del 2 % la
 * operacion no se sostiene y por encima del 8 % deja de ser competitiva,
 * asi que un riesgo mayor se conversa caso por caso en vez de multiplicar
 * la prima sin limite. Sobre ese valor se aplica el IVA.
 */
@Injectable({ providedIn: 'root' })
export class CoberturaService {
  estimar(datos: DatosCobertura): Estimacion {
    const valorPromedio = Math.max(0, datos.valorPromedio || 0);
    const creditosPorMes = Math.max(0, datos.creditosPorMes || 0);
    const tasaImpago = Math.max(0, datos.tasaImpago || 0);

    const cobertura = valorPromedio * creditosPorMes;

    let tasaPrima = tasaImpago;
    let ajuste: Estimacion['ajuste'] = null;
    if (tasaImpago < TASA_PRIMA_MINIMA) {
      tasaPrima = TASA_PRIMA_MINIMA;
      ajuste = 'piso';
    } else if (tasaImpago > TASA_PRIMA_MAXIMA) {
      tasaPrima = TASA_PRIMA_MAXIMA;
      ajuste = 'techo';
    }

    const prima = cobertura * (tasaPrima / 100) * IVA;

    return { cobertura, prima, tasaPrima, ajuste };
  }
}
