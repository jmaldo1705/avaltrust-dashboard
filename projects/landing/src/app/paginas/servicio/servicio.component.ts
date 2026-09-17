import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBlocks,
  LucideFileX,
  LucideGauge,
  LucideMessageSquare,
  LucidePlug,
  LucideShieldCheck,
} from '@lucide/angular';
import { FotoComponent } from '../../ui/foto.component';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

interface Bloque {
  titulo: string;
  texto: string;
  /** Clave del icono; la plantilla la resuelve con @switch. */
  icono?: string;
}

@Component({
  selector: 'at-servicio',
  imports: [
    PageHeroComponent,
    RouterLink,
    FotoComponent,
    LucidePlug,
    LucideMessageSquare,
    LucideBlocks,
    LucideGauge,
    LucideFileX,
    LucideShieldCheck,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servicio.component.html',
  styleUrl: './servicio.component.css',
})
export class ServicioComponent {
  protected readonly flexibilidad: readonly Bloque[] = [
    { titulo: 'Adaptabilidad', texto: 'Diseño personalizado según tu modelo de negocio' },
    { titulo: 'Evolución Continua', texto: 'Actualizaciones constantes del servicio' },
    { titulo: 'Base Sólida', texto: 'Siempre fundamentado en la pérdida esperada' },
  ];

  protected readonly beneficios: readonly Bloque[] = [
    {
      titulo: 'Integración Fluida',
      icono: 'enchufe',
      texto:
        'Se incorporan directamente a tu proceso de crédito y métodos de firma electrónica existentes, asegurando una transición sin interrupciones.',
    },
    {
      titulo: 'Comunicación Digital',
      icono: 'mensaje',
      texto:
        'Todas nuestras comunicaciones son digitales, garantizando agilidad y eficiencia en cada interacción con tus clientes.',
    },
    {
      titulo: 'Fácil Integración',
      icono: 'bloques',
      texto:
        'Se adaptan con facilidad en tus procesos de solicitud, simplificando la experiencia para tus clientes.',
    },
    {
      titulo: 'Reducción de Carga Operativa',
      icono: 'medidor',
      texto:
        'Minimizamos tu trabajo administrativo gracias a un proceso automatizado de reportes mensuales a través de nuestra plataforma.',
    },
    {
      titulo: 'Adiós al Papeleo',
      icono: 'papel',
      texto:
        'Eliminamos la necesidad de transferir documentos físicos en el proceso de activación de la fianza, agilizando todo el procedimiento.',
    },
    {
      titulo: 'Protección Integral',
      icono: 'escudo',
      texto:
        'Con AvalTrust, obtienes una solución completa que combina todos estos beneficios en una plataforma segura, eficiente y confiable.',
    },
  ];

  protected readonly operacion: readonly Bloque[] = [
    {
      titulo: 'La entidad financiera otorga el crédito',
      texto:
        'La aprobación y condiciones del crédito son responsabilidad exclusiva de la entidad financiera, sin participación directa de AvalTrust en esta evaluación.',
    },
    {
      titulo: 'AvalTrust define la cobertura',
      texto:
        'Junto con la entidad financiera, se acuerdan las condiciones de la fianza y el valor correspondiente, según el monto y riesgo de la operación.',
    },
    {
      titulo: 'Contribución al fondo a través del respaldo crediticio',
      texto:
        'El usuario deudor paga el valor de la plataforma de gestión de riesgo crediticio, el cual incluye una contribución que alimenta el Fondo de Cobertura administrado por AvalTrust. Este fondo se usa para respaldar casos de incumplimiento.',
    },
    {
      titulo: 'Activación del fondo ante incumplimiento',
      texto:
        'Si el deudor no cumple con su obligación, el fondo puede cubrir parte o la totalidad del saldo pendiente, conforme a lo pactado en el contrato de servicio digital de garantía crediticia.',
    },
    {
      titulo: 'Gestión y recuperación del crédito',
      texto:
        'AvalTrust asume el seguimiento, reporte y gestión de la recuperación de la deuda, protegiendo los intereses de la entidad afiliada y del sistema de cobertura.',
    },
  ];

  constructor() {
    definirSeo({
      titulo: 'Nuestro Servicio | AvalTrust - Soluciones Innovadoras de Aval',
      descripcion:
        'Transformamos el acceso al crédito con soluciones innovadoras de respaldo crediticio digital y garantía, diseñadas para brindar seguridad tanto a acreedores como a deudores.',
      ruta: '/servicio',
    });
  }
}
