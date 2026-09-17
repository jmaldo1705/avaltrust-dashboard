import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  output,
  viewChild,
} from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    turnstile?: {
      render: (elemento: HTMLElement, opciones: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Captcha de Cloudflare Turnstile.
 *
 * Se monta con afterNextRender, asi que el script no se toca durante el
 * prerender: el HTML estatico sale sin el widget y este aparece cuando la
 * pagina se hidrata en el navegador.
 */
@Component({
  selector: 'at-turnstile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #contenedor class="captcha"></div>`,
  styles: `
    .captcha {
      min-height: 65px;
    }
  `,
})
export class TurnstileComponent {
  /** Emite el token al resolverse, o null si expira o falla. */
  readonly resuelto = output<string | null>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');
  private widgetId?: string;

  constructor() {
    afterNextRender(() => void this.montar());
  }

  /** Limpia el token actual y pide uno nuevo, tras enviar el formulario. */
  reiniciar(): void {
    window.turnstile?.reset(this.widgetId);
    this.resuelto.emit(null);
  }

  private async montar(): Promise<void> {
    try {
      await cargarScript();
      this.widgetId = window.turnstile?.render(this.contenedor().nativeElement, {
        sitekey: environment.turnstileSiteKey,
        callback: (token: string) => this.resuelto.emit(token),
        'expired-callback': () => this.resuelto.emit(null),
        'error-callback': () => this.resuelto.emit(null),
      });
    } catch {
      this.resuelto.emit(null);
    }
  }
}

let carga: Promise<void> | undefined;

function cargarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  carga ??= new Promise<void>((resolver, rechazar) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolver();
    script.onerror = () => rechazar(new Error('No se pudo cargar Turnstile'));
    document.head.appendChild(script);
  });

  return carga;
}
