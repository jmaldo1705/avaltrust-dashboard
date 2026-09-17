import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

@Component({
  selector: 'at-terminos-condiciones',
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terminos-condiciones.component.html',
  styleUrl: './legal.css',
})
export class TerminosCondicionesComponent {
  constructor() {
    definirSeo({
      titulo: 'Términos y Condiciones | AvalTrust',
      descripcion:
        'Términos y Condiciones de Uso de AvalTrust SAS - Plataforma de garantías crediticias para el ecosistema Fintech colombiano.',
      ruta: '/terminos-condiciones',
    });
  }
}
