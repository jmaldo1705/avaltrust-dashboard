import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

interface Bloque {
  titulo: string;
  texto: string;
}

@Component({
  selector: 'at-afianzados',
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './afianzados.component.html',
  styleUrl: './afianzados.component.css',
})
export class AfianzadosComponent {
  protected readonly promesas: readonly Bloque[] = [
    { titulo: 'Trato Humano', texto: 'Cada persona importa' },
    { titulo: '100% Seguro', texto: 'Protección garantizada' },
    { titulo: 'Respuesta Rápida', texto: 'Máximo 24 horas' },
    { titulo: 'Transparencia Total', texto: 'Sin sorpresas ni letra pequeña' },
  ];

  protected readonly compromisos: readonly Bloque[] = [
    {
      titulo: 'Trato Digno Siempre',
      texto:
        'Nunca recibirás llamadas agresivas o amenazas. Creemos en el diálogo respetuoso y la solución colaborativa.',
    },
    {
      titulo: 'Tiempo Necesario',
      texto:
        'No te presionamos. Te damos el tiempo que necesitas para recuperarte y encontrar la mejor manera de resolver la situación.',
    },
    {
      titulo: 'Soluciones a tu Medida',
      texto:
        'Diseñamos planes de pago que se adapten a tu realidad económica. Cada persona es única, cada solución también.',
    },
    {
      titulo: 'Te Educamos Financieramente',
      texto:
        'Te ayudamos a desarrollar mejores hábitos financieros para que esta situación no se repita en el futuro.',
    },
    {
      titulo: 'Privacidad Absoluta',
      texto:
        'Tu información es confidencial. No compartimos tus datos con terceros ni hacemos públicas tus dificultades.',
    },
    {
      titulo: 'Apoyo Integral',
      texto:
        'Más que cobrar una deuda, queremos ayudarte a reconstruir tu estabilidad financiera y tu confianza.',
    },
  ];

  protected readonly creditos: readonly Bloque[] = [
    {
      titulo: 'Educación',
      texto: 'Invierte en tu futuro académico con nuestro respaldo para créditos educativos.',
    },
    {
      titulo: 'Vehículos',
      texto: 'Tu movilidad es importante. Te ayudamos a conseguir el auto que necesitas.',
    },
    {
      titulo: 'Digitales',
      texto: 'Accede a los mejores créditos online con nuestra garantía tecnológica.',
    },
    {
      titulo: 'Vivienda',
      texto: 'Haz realidad el sueño de tu hogar con nuestro respaldo inmobiliario.',
    },
    {
      titulo: 'Libranza',
      texto: 'Para empleados públicos y privados. Créditos con descuento por nómina.',
    },
    {
      titulo: 'Retail',
      texto: 'Compra hoy, paga después. Te respaldamos en tus compras favoritas.',
    },
  ];

  constructor() {
    definirSeo({
      titulo: 'Afianzados | AvalTrust',
      descripcion:
        'Hacemos que acceder al crédito sea más fácil, seguro y humano. En cada paso del camino, estamos contigo.',
      ruta: '/afianzados',
    });
  }
}
