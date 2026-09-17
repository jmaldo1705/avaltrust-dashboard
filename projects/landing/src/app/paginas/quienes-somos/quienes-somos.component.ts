import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAward,
  LucideEye,
  LucideHandshake,
  LucideScale,
  LucideShieldCheck,
  LucideSparkles,
  LucideTarget,
} from '@lucide/angular';
import { FotoComponent } from '../../ui/foto.component';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { definirSeo } from '../../ui/seo';

@Component({
  selector: 'at-quienes-somos',
  imports: [
    PageHeroComponent,
    FotoComponent,
    RouterLink,
    // Cada icono de Lucide es un componente con su propio selector.
    LucideEye,
    LucideTarget,
    LucideSparkles,
    LucideAward,
    LucideHandshake,
    LucideShieldCheck,
    LucideScale,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quienes-somos.component.html',
  styleUrl: './quienes-somos.component.css',
})
export class QuienesSomosComponent {
  constructor() {
    definirSeo({
      titulo: 'Quiénes Somos | AvalTrust',
      descripcion:
        'Impulsamos la inclusión financiera con garantías innovadoras y seguras para un acceso al crédito más justo.',
      ruta: '/quienes-somos',
    });
  }
}
