# AvalTrust · workspace web

Workspace de Angular con las dos aplicaciones web de AvalTrust y la librería
de marca que comparten. El backend es Spring Boot y vive en otro repositorio
(`AvalTrustBack`).

```
projects/
├── dashboard/    aplicación privada (app.avaltrust.co) — SPA con login por rol
├── landing/      sitio público (avaltrust.co) — prerenderizado a HTML estático
└── shared-ui/    tokens de marca y componentes comunes a las dos
```

## Requisitos

- Node **≥ 22.22.3** (Angular 22 no arranca con Node 20)
- npm 11

## Desarrollo

```bash
npm install
npm start            # dashboard en http://localhost:4200
npm run start:landing # landing en http://localhost:4200
```

## Build

```bash
npm run build          # dashboard -> dist/avaltrust-dashboard/browser
npm run build:landing  # landing   -> dist/landing/browser (HTML ya prerenderizado)
```

La landing usa `@angular/ssr` con `outputMode: "static"`: el prerender ocurre
en el build y el resultado es HTML plano por ruta. **No hay servidor Node en
producción** — se publica en S3 + CloudFront igual que el dashboard, y los
buscadores reciben el HTML completo en lugar de un `<div>` vacío.

## Tests

```bash
npm test               # dashboard (Vitest)
npm run test:landing
npx ng test shared-ui
```

Karma quedó atrás: el runner es el builder `@angular/build:unit-test` sobre
Vitest, con jsdom como entorno DOM.

## Tokens de marca

`projects/shared-ui/styles/tokens.css` es la fuente de verdad del color, la
tipografía y el ritmo visual. Se carga desde `angular.json` antes del
`styles.css` de cada aplicación, así que ambas parten de la misma paleta.
Al escribir estilos, usar las variables (`var(--at-accent)`) en lugar de
repetir valores hexadecimales.

## Despliegue

`.github/workflows/deploy.yml` despliega el **dashboard** a S3 + CloudFront en
cada push a `master`, autenticándose con un rol OIDC (sin llaves estáticas).
La landing se despliega desde su propio repositorio hasta el cutover.
