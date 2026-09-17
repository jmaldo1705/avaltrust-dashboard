import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideBuilding,
  LucideHeadset,
  LucideLandmark,
  LucideLaptop,
  LucideLightbulb,
  LucideUser,
  LucideUserCheck,
} from '@lucide/angular';
import { FotoComponent } from '../ui/foto.component';
import { Meta, Title } from '@angular/platform-browser';
import {
  CoberturaService,
  TASA_PRIMA_MAXIMA,
  TASA_PRIMA_MINIMA,
} from '../cobertura/cobertura.service';

interface Bloque {
  titulo: string;
  texto: string;
  /** Clave del icono; la plantilla la resuelve con @switch. */
  icono?: string;
}

interface Servicio extends Bloque {
  destino: string;
}

interface Caso {
  cita: string;
  nombre: string;
  ciudad: string;
}

interface Pregunta {
  pregunta: string;
  respuesta: string;
}

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const PORCENTAJE = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 1,
});

@Component({
  selector: 'at-home',
  imports: [
    FormsModule,
    RouterLink,
    FotoComponent,
    LucideLaptop,
    LucideHeadset,
    LucideUserCheck,
    LucideUser,
    LucideBuilding,
    LucideLightbulb,
    LucideLandmark,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly cobertura = inject(CoberturaService);

  // Valores de partida: el monto es el que la calculadora publicada usa como
  // ejemplo, y el resto son cifras redondas de una fintech mediana.
  protected readonly valorPromedio = signal(5_000_000);
  protected readonly creditosPorMes = signal(100);
  protected readonly tasaImpago = signal(4);

  protected readonly estimacion = computed(() =>
    this.cobertura.estimar({
      valorPromedio: this.valorPromedio(),
      creditosPorMes: this.creditosPorMes(),
      tasaImpago: this.tasaImpago(),
    }),
  );

  protected readonly coberturaFormateada = computed(() => PESOS.format(this.estimacion().cobertura));
  protected readonly primaFormateada = computed(() => PESOS.format(this.estimacion().prima));
  protected readonly tasaFormateada = computed(() => PORCENTAJE.format(this.tasaImpago() / 100));

  /** Aviso cuando la tasa de impago cae fuera de la banda 2-8 % de la prima. */
  protected readonly notaPrima = computed(() => {
    const { ajuste, tasaPrima } = this.estimacion();
    if (!ajuste) return null;
    const limite = ajuste === 'piso' ? 'mínimo' : 'tope';
    const banda = `${PORCENTAJE.format(TASA_PRIMA_MINIMA / 100)} a ${PORCENTAJE.format(TASA_PRIMA_MAXIMA / 100)}`;
    return `Prima calculada al ${PORCENTAJE.format(tasaPrima / 100)}, el ${limite} de la banda (${banda}).`;
  });

  protected readonly queEsAvalTrust: readonly Bloque[] = [
    {
      titulo: 'Soluciones 100% digitales',
      icono: 'laptop',
      texto:
        'Todas nuestras soluciones están completamente digitalizadas, eliminando la burocracia y acelerando los procesos de manera significativa.',
    },
    {
      titulo: 'Atención personalizada',
      icono: 'headset',
      texto:
        'Ofrecemos un servicio adaptado a las necesidades específicas de cada cliente, con asesoría especializada en cada paso del proceso.',
    },
    {
      titulo: 'Garantías diseñadas para cada perfil',
      icono: 'perfil',
      texto:
        'Nuestras garantías están diseñadas tanto para personas como para empresas, alineados con su perfil de riesgo específico.',
    },
  ];

  protected readonly pasosFintech: readonly Bloque[] = [
    {
      titulo: 'Protege tus ingresos',
      texto:
        'Minimiza el impacto del riesgo operativo y asegura la estabilidad necesaria para garantizar la continuidad y sostenibilidad de tu operación.',
    },
    {
      titulo: 'Optimiza tu capital',
      texto:
        'Libera recursos para innovar y crecer sin asumir todo el riesgo, maximizando el retorno de tu inversión.',
    },
    {
      titulo: 'Expande con confianza',
      texto:
        'Ofrece crédito de manera más audaz, respaldado por una red de seguridad que te permite crecer sin temor.',
    },
    {
      titulo: 'Atrae inversionistas',
      texto:
        'Demuestra solidez financiera y gestión inteligente del riesgo para atraer capital e impulsar tu crecimiento.',
    },
  ];

  protected readonly servicios: readonly Servicio[] = [
    {
      titulo: 'Para Personas',
      icono: 'persona',
      texto:
        'Crédito más accesible y seguro. Garantía digital ante imprevistos que te permite acceder al financiamiento que necesitas.',
      destino: '/afianzados',
    },
    {
      titulo: 'Para Empresas',
      icono: 'empresa',
      texto:
        'Garantía para licitaciones y financiamiento empresarial. Impulsa el crecimiento de tu negocio con nuestro respaldo.',
      destino: '/servicio',
    },
    {
      titulo: 'Para Fintechs',
      icono: 'fintech',
      texto:
        'Infraestructura de fianza digital. Fácil de integrar, lista para escalar y optimizar tu plataforma crediticia.',
      destino: '/servicio',
    },
    {
      titulo: 'Para Cooperativas',
      icono: 'cooperativa',
      texto:
        'Fondos financieramente estables contra exposición al riesgo operativo. Mejoran la cartera crediticia y reducen significativamente las pérdidas.',
      destino: '/servicio',
    },
  ];

  protected readonly casos: readonly Caso[] = [
    {
      cita:
        'Gracias a su equipo de profesionales pude acceder al crédito que mi banco me negaba. Su proceso digital fue rápido y transparente.',
      nombre: 'Yadira Triana',
      ciudad: 'Medellín',
    },
    {
      cita:
        'Nos ayudaron a disminuir el riesgo crediticio asociado a la operación de mi empresa. Su garantía nos dio la confianza que necesitábamos.',
      nombre: 'Miguel Rodríguez',
      ciudad: 'Bogotá',
    },
  ];

  protected readonly preguntas: readonly Pregunta[] = [
    {
      pregunta: '¿Qué tipos de crédito puedo afianzar?',
      respuesta:
        'Ofrecemos fianzas para una amplia gama de productos crediticios incluyendo créditos de libranza, digitales, educativos, de vehículos, arrendamiento y retail.',
    },
    {
      pregunta: '¿AvalTrust es una entidad financiera?',
      respuesta:
        'No, AvalTrust no actúa como avalista ni como entidad que otorga créditos. Nuestra función es respaldar las obligaciones de crédito originadas por entidades financieras, fintech o acreedores, mediante la emisión de fianzas digitales subsidiarias. Estas fianzas constituyen un respaldo tecnológico y contractual frente al riesgo de impago, sin que AvalTrust asuma el rol de prestamista ni de avalista solidario.',
    },
    {
      pregunta: '¿Qué necesito para solicitar una fianza?',
      respuesta:
        'En la mayoría de casos, no necesitas contactarnos directamente. Solo sigue estos pasos: 1. Acude a un intermediario financiero (banco, cooperativa, FinTech, etc.) que trabaje con AvalTrust. 2. Solicita tu crédito y menciona que deseas el respaldo de Avaltrust. 3. Ellos gestionarán todo con nosotros, simplificando tu proceso.',
    },
  ];

  constructor() {
    const titulo = 'AvalTrust - Revolucionando el Acceso al Crédito en Colombia';
    const descripcion =
      'La primera plataforma de garantías crediticias diseñada específicamente para el ecosistema Fintech colombiano. Desbloqueando oportunidades, impulsando la inclusión.';

    inject(Title).setTitle(titulo);
    inject(Meta).addTags([
      { name: 'description', content: descripcion },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'es_CO' },
      { property: 'og:site_name', content: 'AvalTrust' },
      { property: 'og:url', content: 'https://avaltrust.co/' },
      { property: 'og:title', content: titulo },
      { property: 'og:description', content: descripcion },
      { property: 'og:image', content: 'https://avaltrust.co/image/og-avaltrust.jpg' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ]);
  }
}
