import { inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const BASE = 'https://avaltrust.co';
const IMAGEN = `${BASE}/image/og-avaltrust.jpg`;

/**
 * Fija title, description, canonical y Open Graph de una pagina.
 * Se ejecuta tambien durante el prerender, asi que las etiquetas quedan
 * dentro del HTML estatico que reciben los buscadores.
 */
export function definirSeo(opciones: { titulo: string; descripcion: string; ruta: string }): void {
  const url = `${BASE}${opciones.ruta}`;

  inject(Title).setTitle(opciones.titulo);
  inject(Meta).addTags([
    { name: 'description', content: opciones.descripcion },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'es_CO' },
    { property: 'og:site_name', content: 'AvalTrust' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: opciones.titulo },
    { property: 'og:description', content: opciones.descripcion },
    { property: 'og:image', content: IMAGEN },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]);
}
