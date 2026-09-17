import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface EnlaceNav {
  etiqueta: string;
  ruta: string;
}

@Component({
  selector: 'at-site-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
})
export class SiteHeaderComponent {
  protected readonly menuAbierto = signal(false);
  protected readonly compacto = signal(false);

  protected readonly enlaces: readonly EnlaceNav[] = [
    { etiqueta: 'Quiénes Somos', ruta: '/quienes-somos' },
    { etiqueta: 'Nuestro Servicio', ruta: '/servicio' },
    { etiqueta: 'Afianzados', ruta: '/afianzados' },
    { etiqueta: 'Calculadora', ruta: '/calculadora' },
    { etiqueta: 'Blog', ruta: '/blog' },
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
