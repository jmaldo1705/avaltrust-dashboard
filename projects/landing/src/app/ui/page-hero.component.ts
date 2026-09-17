import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Cabecera oscura que abre todas las paginas internas. */
@Component({
  selector: 'at-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="encabezado">
      <div class="at-container">
        @if (insignia(); as etiqueta) {
          <p class="encabezado__insignia">{{ etiqueta }}</p>
        }
        <h1>{{ titulo() }}</h1>
        @if (entrada(); as texto) {
          <p>{{ texto }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .encabezado {
      background: var(--at-gradient-hero);
      color: var(--at-text-on-dark);
      margin-top: calc(var(--at-header-height) * -1 - var(--at-space-3) * 2);
      padding-top: calc(var(--at-header-height) + var(--at-space-16));
      padding-bottom: var(--at-space-12);
    }

    .encabezado__insignia {
      display: inline-block;
      margin-bottom: var(--at-space-4);
      padding: var(--at-space-2) var(--at-space-4);
      border: 1px solid rgb(59 130 246 / 0.5);
      border-radius: var(--at-radius-pill);
      background: rgb(59 130 246 / 0.14);
      color: #bfdbfe;
      font-size: var(--at-text-sm);
      font-weight: var(--at-weight-medium);
    }

    h1 {
      max-width: 22ch;
      color: var(--at-white);
      font-size: var(--at-text-3xl);
      letter-spacing: -0.02em;
    }

    p {
      max-width: 62ch;
      margin-top: var(--at-space-4);
      color: rgb(255 255 255 / 0.84);
      font-size: var(--at-text-lg);
    }
  `,
})
export class PageHeroComponent {
  readonly titulo = input.required<string>();
  readonly entrada = input<string>();
  readonly insignia = input<string>();
}
