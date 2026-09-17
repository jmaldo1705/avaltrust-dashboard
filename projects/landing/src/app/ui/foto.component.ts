import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Imagen responsiva del sitio.
 *
 * Cada foto vive en public/img con dos anchos y dos formatos: AVIF primero
 * y WebP como respaldo. El navegador elige, y las medidas explicitas
 * evitan que el texto salte mientras carga.
 */
@Component({
  selector: 'at-foto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <picture>
      <source type="image/avif" [srcset]="srcset('avif')" [sizes]="sizes()" />
      <img
        [src]="'img/' + nombre() + '-' + anchos()[anchos().length - 1] + '.webp'"
        [srcset]="srcset('webp')"
        [sizes]="sizes()"
        [width]="ancho()"
        [height]="alto()"
        [alt]="alt()"
        [attr.loading]="prioridad() ? null : 'lazy'"
        [attr.fetchpriority]="prioridad() ? 'high' : null"
        [attr.decoding]="prioridad() ? null : 'async'"
      />
    </picture>
  `,
  styles: `
    :host {
      display: block;
    }

    img {
      width: 100%;
      border-radius: var(--at-radius-lg);
    }
  `,
})
export class FotoComponent {
  /** Nombre base del archivo en public/img, sin ancho ni extension. */
  readonly nombre = input.required<string>();
  readonly alt = input.required<string>();
  readonly anchos = input<readonly number[]>([480, 800]);
  readonly sizes = input('(max-width: 860px) 100vw, 46vw');
  readonly ancho = input(800);
  readonly alto = input(600);
  /** true para la imagen visible al entrar: se carga sin diferir. */
  readonly prioridad = input(false);

  protected srcset(formato: 'avif' | 'webp'): string {
    return this.anchos()
      .map((w) => `img/${this.nombre()}-${w}.${formato} ${w}w`)
      .join(', ');
  }
}
