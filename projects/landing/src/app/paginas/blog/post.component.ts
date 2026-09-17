import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../ui/page-hero.component';
import { POSTS, buscarPost } from './posts';

const BASE = 'https://avaltrust.co';

@Component({
  selector: 'at-post',
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post.component.html',
  styleUrl: './post.component.css',
})
export class PostComponent {
  /** Llega de la ruta /blog/:slug gracias a withComponentInputBinding. */
  readonly slug = input<string>();

  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly post = computed(() => buscarPost(this.slug() ?? null));

  /** Otras dos publicaciones, para no dejar el articulo sin salida. */
  protected readonly relacionados = computed(() =>
    POSTS.filter((p) => p.slug !== this.slug()).slice(0, 2),
  );

  constructor() {
    // El SEO se fija cuando ya se sabe que post se esta mostrando, tanto en
    // el prerender como al navegar entre articulos.
    queueMicrotask(() => this.definirMetadatos());
  }

  private definirMetadatos(): void {
    const post = this.post();
    if (!post) {
      void this.router.navigate(['/blog']);
      return;
    }

    const titulo = `${post.titulo} | Blog AvalTrust`;
    const url = `${BASE}/blog/${post.slug}`;

    this.title.setTitle(titulo);
    this.meta.addTags([
      { name: 'description', content: post.resumen },
      { name: 'author', content: post.autor },
      { property: 'article:published_time', content: post.fecha },
      { property: 'og:type', content: 'article' },
      { property: 'og:locale', content: 'es_CO' },
      { property: 'og:site_name', content: 'AvalTrust' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: titulo },
      { property: 'og:description', content: post.resumen },
      { property: 'og:image', content: `${BASE}/img/${post.imagen}-800.webp` },
      { name: 'twitter:card', content: 'summary_large_image' },
    ]);
  }
}
