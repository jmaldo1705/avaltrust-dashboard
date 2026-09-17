import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

@Component({
  selector: 'at-blog',
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
})
export class BlogComponent {
  protected readonly etiquetas: readonly string[] = ['Fintech', 'Colombia', 'Tendencias'];

  protected readonly temas: readonly string[] = [
    'Innovación fintech',
    'Educación financiera',
    'Avales digitales',
    'Tendencias crediticias',
  ];

  constructor() {
    definirSeo({
      titulo: 'Blog | AvalTrust - Insights Financieros y Tendencias Fintech',
      descripcion:
        'Descubre las últimas tendencias en fintech, consejos financieros y análisis del mercado crediticio colombiano en el blog de AvalTrust.',
      ruta: '/blog',
    });
  }
}
