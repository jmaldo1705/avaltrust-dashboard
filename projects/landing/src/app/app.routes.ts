import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

/**
 * Las rutas internas se cargan por demanda: quien entra a la home no
 * descarga el codigo del resto del sitio. Todas se prerenderizan en el
 * build, asi que cada una entrega su propio HTML estatico.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'AvalTrust - Revolucionando el Acceso al Crédito en Colombia',
  },
  {
    path: 'quienes-somos',
    loadComponent: () =>
      import('./paginas/quienes-somos/quienes-somos.component').then(
        (m) => m.QuienesSomosComponent,
      ),
    title: 'Quiénes Somos | AvalTrust',
  },
  {
    path: 'servicio',
    loadComponent: () =>
      import('./paginas/servicio/servicio.component').then((m) => m.ServicioComponent),
    title: 'Nuestro Servicio | AvalTrust - Soluciones Innovadoras de Aval',
  },
  {
    path: 'afianzados',
    loadComponent: () =>
      import('./paginas/afianzados/afianzados.component').then((m) => m.AfianzadosComponent),
    title: 'Afianzados | AvalTrust',
  },
  {
    path: 'blog',
    loadComponent: () => import('./paginas/blog/blog.component').then((m) => m.BlogComponent),
    title: 'Blog | AvalTrust - Insights Financieros y Tendencias Fintech',
  },
  {
    path: 'blog/fianzas-en-la-ley',
    loadComponent: () =>
      import('./paginas/blog/articulo-fianzas.component').then((m) => m.ArticuloFianzasComponent),
    title: 'Fianzas en la ley | Blog AvalTrust',
  },
  {
    path: 'calculadora',
    loadComponent: () =>
      import('./calculadora/calculadora.component').then((m) => m.CalculadoraComponent),
    title: 'Calculadora de Cobertura | AvalTrust - Estimación en 30 Minutos',
  },
  {
    path: 'contacto',
    loadComponent: () => import('./contacto/contacto.component').then((m) => m.ContactoComponent),
    title: 'Contáctanos | AvalTrust',
  },
  {
    path: 'politica-privacidad',
    loadComponent: () =>
      import('./paginas/legal/politica-privacidad.component').then(
        (m) => m.PoliticaPrivacidadComponent,
      ),
    title: 'Política de Privacidad | AvalTrust',
  },
  {
    path: 'terminos-condiciones',
    loadComponent: () =>
      import('./paginas/legal/terminos-condiciones.component').then(
        (m) => m.TerminosCondicionesComponent,
      ),
    title: 'Términos y Condiciones | AvalTrust',
  },
  { path: '**', redirectTo: '' },
];
