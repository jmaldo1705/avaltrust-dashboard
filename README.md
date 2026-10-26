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

El dashboard espera el backend en `http://localhost:8080`. Si ese puerto está
ocupado y el backend corre en otro, se puede apuntar sin tocar el código:

```bash
npx ng serve dashboard --port 4300 --define AVALTRUST_API_URL="'http://localhost:8081'"
```

En ese caso el backend debe aceptar el origen nuevo en CORS
(`APP_CORS_ALLOWED_ORIGINS=http://localhost:4300`).

## Build

```bash
npm run build          # dashboard -> dist/avaltrust-dashboard/browser
npm run build:landing  # landing   -> dist/landing/browser (HTML ya prerenderizado)
```

La landing usa `@angular/ssr` con `outputMode: "static"`: el prerender ocurre
en el build y el resultado es HTML plano por ruta. **No hay servidor Node en
producción** — se publica en Firebase Hosting igual que el dashboard, y los
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

Cada push a `master` despliega a Firebase Hosting con `firebase deploy`. GitHub
Actions se autentica con Workload Identity Federation (sin llaves estáticas):
el workflow toma el proveedor y la cuenta de despliegue de las variables del
repo `GCP_WIF_PROVIDER` y `GCP_DEPLOY_SA`. Hay un workflow por aplicación,
filtrado por `paths:` y con disparo manual (`workflow_dispatch`):

- `.github/workflows/deploy-dashboard.yml` → target `app` (app.avaltrust.co)
- `.github/workflows/deploy-landing.yml` → target `landing` (avaltrust.co)

Un cambio en `projects/shared-ui/`, en `package.json` o en `firebase.json`
dispara los dos.

`firebase.json` tiene la configuración de los dos sitios y `.firebaserc` liga
cada target con su sitio:

- **app**: SPA. Toda ruta que no es un archivo devuelve `index.html` con 200.
- **landing**: HTML prerenderizado. `/ruta` se sirve desde `/ruta/index.html`,
  `/ruta/` redirige a `/ruta`, las URLs `.html` del sitio anterior redirigen
  con 301 a su ruta nueva y una URL que no existe devuelve la portada con 404
  (`404.html` lo genera `scripts/landing-404.mjs` antes de cada despliegue).
  `index.csr.html` no se publica.
- En los dos, el HTML no se cachea y los bundles con hash se cachean un año
  (`immutable`).

Para probar la configuración en local, después de los builds:

```bash
node scripts/landing-404.mjs
npx firebase-tools@latest emulators:start --only hosting --project avaltrust-prod
```

No hace falta `firebase login`. La landing queda en http://localhost:5000 y el
dashboard en http://localhost:5005. En Windows el emulador no aplica las reglas `source` de `redirects` y
`headers` (las rutas de glob salen con `\`); en Linux, macOS o un contenedor
sí.

## Plan de trabajo

`docs/plan-modernizacion-movil.md` describe la migración del dashboard a
snackbar, hojas inferiores en móvil y modales en escritorio.
