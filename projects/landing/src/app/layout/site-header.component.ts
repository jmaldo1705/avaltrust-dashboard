import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';

interface EnlaceNav {
  etiqueta: string;
  destino: string;
}

@Component({
  selector: 'at-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
})
export class SiteHeaderComponent {
  protected readonly menuAbierto = signal(false);
  protected readonly compacto = signal(false);

  /** Mientras la landing vive en una sola pagina, el menu apunta a sus secciones. */
  protected readonly enlaces: readonly EnlaceNav[] = [
    { etiqueta: 'Qué es AvalTrust', destino: '#que-es' },
    { etiqueta: 'Servicios', destino: '#servicios' },
    { etiqueta: 'Para fintechs', destino: '#fintech' },
    { etiqueta: 'Preguntas', destino: '#preguntas' },
  ];

  protected readonly accesoPortal = 'https://app.avaltrust.co/login';

  @HostListener('window:scroll')
  protected alScrollear(): void {
    this.compacto.set(window.scrollY > 24);
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
