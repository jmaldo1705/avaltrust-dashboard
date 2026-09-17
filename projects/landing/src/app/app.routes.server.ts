import { RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './paginas/blog/posts';

export const serverRoutes: ServerRoute[] = [
  {
    // Cada publicacion se prerenderiza a su propio index.html.
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => POSTS.map((post) => ({ slug: post.slug })),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
