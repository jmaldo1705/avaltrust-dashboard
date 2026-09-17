import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CoberturaService,
  TASA_PRIMA_MAXIMA,
  TASA_PRIMA_MINIMA,
} from '../cobertura/cobertura.service';
import { MailService, plantillaCorreo } from '../contacto/mail.service';
import { TurnstileComponent } from '../contacto/turnstile.component';
import { PageHeroComponent } from '../ui/page-hero.component';
import { definirSeo } from '../ui/seo';

type Estado = 'inactivo' | 'enviando' | 'enviado' | 'error';

const DESTINATARIO = 'comercial@avaltrust.co';

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const PORCENTAJE = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 2,
});

@Component({
  selector: 'at-calculadora',
  imports: [ReactiveFormsModule, PageHeroComponent, TurnstileComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculadora.component.html',
  styleUrl: './calculadora.component.css',
})
export class CalculadoraComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cobertura = inject(CoberturaService);
  private readonly mail = inject(MailService);
  private readonly captcha = viewChild(TurnstileComponent);

  protected readonly paso = signal(1);
  protected readonly estado = signal<Estado>('inactivo');
  protected readonly token = signal<string | null>(null);

  protected readonly pasos = ['Parámetros Financieros', 'Datos del Aliado', 'Confirmación'];

  protected readonly cargos = [
    { valor: 'gerente-general', etiqueta: 'Gerente General' },
    { valor: 'director-financiero', etiqueta: 'Director(a) Financiero' },
    { valor: 'gerente-comercial', etiqueta: 'Gerente Comercial' },
    { valor: 'propietario', etiqueta: 'Propietario/Socio' },
    { valor: 'director-credito', etiqueta: 'Director(a) de Crédito' },
    { valor: 'otro', etiqueta: 'Otro cargo directivo' },
  ];

  protected readonly plazos = [
    { valor: '1', etiqueta: '1 cuota (pago único)' },
    { valor: '3', etiqueta: '3 cuotas' },
    { valor: '6', etiqueta: '6 cuotas' },
    { valor: '12', etiqueta: '12 cuotas (1 año)' },
    { valor: '18', etiqueta: '18 cuotas' },
    { valor: '24', etiqueta: '24 cuotas (2 años)' },
    { valor: '36', etiqueta: '36 cuotas (3 años)' },
  ];

  protected readonly operacion = this.fb.nonNullable.group({
    valorPromedio: [5_000_000, [Validators.required, Validators.min(1)]],
    numeroCuotas: ['12', Validators.required],
    porcentajeDefault: [4, [Validators.required, Validators.min(0), Validators.max(100)]],
    creditosPorMes: [100, [Validators.required, Validators.min(1)]],
  });

  protected readonly aliado = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
    cargoDesempena: ['', Validators.required],
    nombreEmpresa: ['', Validators.required],
    correoEmpresarial: ['', [Validators.required, Validators.email]],
    celularCorporativo: ['', [Validators.required, Validators.pattern(/^[\d\s()+-]{7,20}$/)]],
    acepta: [false, Validators.requiredTrue],
  });

  /** Se recalcula con cada tecla: el valor aparece antes de pedir datos personales. */
  private readonly valores = signal(this.operacion.getRawValue());

  protected readonly estimacion = computed(() =>
    this.cobertura.estimar({
      valorPromedio: this.valores().valorPromedio,
      creditosPorMes: this.valores().creditosPorMes,
      tasaImpago: this.valores().porcentajeDefault,
    }),
  );

  protected readonly coberturaFormateada = computed(() => PESOS.format(this.estimacion().cobertura));
  protected readonly primaFormateada = computed(() => PESOS.format(this.estimacion().prima));
  protected readonly tasaFormateada = computed(() =>
    PORCENTAJE.format((this.valores().porcentajeDefault || 0) / 100),
  );
  protected readonly valorPromedioFormateado = computed(() =>
    PESOS.format(this.valores().valorPromedio || 0),
  );
  protected readonly tasaPrimaFormateada = computed(() =>
    PORCENTAJE.format(this.estimacion().tasaPrima / 100),
  );

  /** Aviso cuando la tasa de impago cae fuera de la banda 2-8 % de la prima. */
  protected readonly notaPrima = computed(() => {
    const { ajuste } = this.estimacion();
    if (!ajuste) return null;
    const limite = ajuste === 'piso' ? 'mínimo' : 'tope';
    const banda = `${PORCENTAJE.format(TASA_PRIMA_MINIMA / 100)} a ${PORCENTAJE.format(TASA_PRIMA_MAXIMA / 100)}`;
    return `Prima calculada al ${this.tasaPrimaFormateada()}, el ${limite} de la banda (${banda}).`;
  });

  constructor() {
    this.operacion.valueChanges.subscribe(() => this.valores.set(this.operacion.getRawValue()));

    definirSeo({
      titulo: 'Calculadora de Cobertura | AvalTrust - Estimación en 30 Minutos',
      descripcion:
        'Recibe en menos de 30 minutos una estimación de cobertura garantizada para tu negocio con AvalTrust.',
      ruta: '/calculadora',
    });
  }

  protected etiquetaCargo(valor: string): string {
    return this.cargos.find((cargo) => cargo.valor === valor)?.etiqueta ?? valor;
  }

  protected etiquetaPlazo(valor: string): string {
    return this.plazos.find((plazo) => plazo.valor === valor)?.etiqueta ?? valor;
  }

  protected siguiente(): void {
    const grupo = this.paso() === 1 ? this.operacion : this.aliado;
    if (grupo.invalid) {
      grupo.markAllAsTouched();
      return;
    }
    this.paso.update((actual) => Math.min(3, actual + 1));
  }

  protected anterior(): void {
    this.paso.update((actual) => Math.max(1, actual - 1));
  }

  protected invalidoOperacion(campo: keyof typeof this.operacion.controls): boolean {
    const control = this.operacion.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  protected invalidoAliado(campo: keyof typeof this.aliado.controls): boolean {
    const control = this.aliado.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  protected enviar(): void {
    if (this.operacion.invalid || this.aliado.invalid) {
      this.operacion.markAllAsTouched();
      this.aliado.markAllAsTouched();
      return;
    }

    if (!this.token()) {
      this.estado.set('error');
      return;
    }

    const datos = this.aliado.getRawValue();
    const negocio = this.operacion.getRawValue();
    this.estado.set('enviando');

    this.mail
      .enviar({
        para: [DESTINATARIO],
        asunto: `Nueva Solicitud de Calculadora - ${datos.nombreEmpresa}`,
        turnstileToken: this.token(),
        cuerpoHtml: plantillaCorreo({
          titulo: 'Nueva solicitud desde la calculadora de cobertura',
          introduccion: 'Un aliado potencial calculó su cobertura y pidió una propuesta.',
          filas: [
            ['Nombre completo', datos.nombreCompleto],
            ['Cargo actual', this.etiquetaCargo(datos.cargoDesempena)],
            ['Empresa', datos.nombreEmpresa],
            ['Correo empresarial', datos.correoEmpresarial],
            ['Teléfono corporativo', datos.celularCorporativo],
            ['Valor promedio por crédito', PESOS.format(negocio.valorPromedio)],
            ['Plazo promedio', this.etiquetaPlazo(negocio.numeroCuotas)],
            ['Tasa de impagos (90+ días)', this.tasaFormateada()],
            ['Tasa de prima aplicada', this.tasaPrimaFormateada()],
            ['Volumen mensual', `${negocio.creditosPorMes} créditos`],
            ['Cobertura Mensual Estimada', this.coberturaFormateada()],
            ['Prima Aproximada', this.primaFormateada()],
            ['Fecha', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })],
          ],
        }),
      })
      .subscribe({
        next: () => {
          this.estado.set('enviado');
          this.token.set(null);
          this.captcha()?.reiniciar();
        },
        error: () => {
          this.estado.set('error');
          this.token.set(null);
          this.captcha()?.reiniciar();
        },
      });
  }

  protected nuevaEstimacion(): void {
    this.estado.set('inactivo');
    this.paso.set(1);
    this.aliado.reset();
    this.operacion.reset({
      valorPromedio: 5_000_000,
      numeroCuotas: '12',
      porcentajeDefault: 4,
      creditosPorMes: 100,
    });
  }
}
