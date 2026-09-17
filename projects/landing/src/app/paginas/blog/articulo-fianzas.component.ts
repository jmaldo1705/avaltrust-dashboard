import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

@Component({
  selector: 'at-articulo-fianzas',
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './articulo-fianzas.component.html',
  styleUrl: './articulo-fianzas.component.css',
})
export class ArticuloFianzasComponent {
  constructor() {
    definirSeo({
      titulo: 'Fianzas en la ley | Blog AvalTrust',
      descripcion:
        'En AvalTrust aplicamos el principio legal de la fianza para respaldar obligaciones crediticias con avales digitales. Actuamos como fiadores profesionales bajo normas claras.',
      ruta: '/blog/fianzas-en-la-ley',
    });
  }
}
