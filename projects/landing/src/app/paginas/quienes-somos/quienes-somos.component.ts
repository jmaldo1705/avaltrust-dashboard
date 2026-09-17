import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

@Component({
  selector: 'at-quienes-somos',
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quienes-somos.component.html',
  styleUrl: './quienes-somos.component.css',
})
export class QuienesSomosComponent {
  protected readonly valores: readonly string[] = [
    'Innovación',
    'Excelencia',
    'Respeto',
    'Integridad',
    'Responsabilidad',
  ];

  constructor() {
    definirSeo({
      titulo: 'Quiénes Somos | AvalTrust',
      descripcion:
        'Impulsamos la inclusión financiera con garantías innovadoras y seguras para un acceso al crédito más justo.',
      ruta: '/quienes-somos',
    });
  }
}
