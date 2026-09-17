import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

@Component({
  selector: 'at-politica-privacidad',
  imports: [PageHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './politica-privacidad.component.html',
  styleUrl: './legal.css',
})
export class PoliticaPrivacidadComponent {
  constructor() {
    definirSeo({
      titulo: 'Política de Privacidad | AvalTrust',
      descripcion:
        'Política de Privacidad y Tratamiento de Datos Personales de AvalTrust SAS - Protección de datos conforme a la Ley 1581 de 2012.',
      ruta: '/politica-privacidad',
    });
  }
}
