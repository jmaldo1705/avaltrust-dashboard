# Plan de modernización móvil: AvalTrust Dashboard

> **Alcance:** `projects/dashboard`. La landing solo recibe tokens nuevos.
> **Textos:** no se reescribe ningún texto publicado ni legal. Los mensajes se **mueven tal cual** a snackbar, hoja o modal. Cada texto nuevo (rótulos de botón, `aria-label`) se lista para tu aprobación.

## Resumen

- **Base:** `@angular/cdk@22.2.1` con un kit propio `at-*` (hojas, modales y confirmaciones con los tokens de marca). De `@angular/material@22.2.1`, solo `MatSnackBar`.
- **Una API:** `AtSheet.open()` abre una hoja inferior en el teléfono (también en horizontal) y un modal en tablet y escritorio. `ToastService` mantiene su firma: sus 26 llamadas no cambian.
- **Fase 0, lo roto primero:** NG05105 del toast, hueco de 280 px, Aliados sin menú, logout que no cierra sesión y modales bajo el header.
- **AFIANZADO pronto:** carga diferida (sin código de administración ni SheetJS), tarjetas y PDF probado en dispositivos reales.
- **Entrega segura:** un PR por pantalla, workflow de PR nuevo, guardas para textos legales y `alert`/`confirm`, e interruptores globales.
- **Angular 22.2.1 ya está aplicado** en el árbol de trabajo. Falta el commit.

## Fase 0: correcciones que hoy rompen el móvil

Todo es S, sin dependencias nuevas, un PR por punto y reversible con `git revert`.

**Estado (octubre 2026):** implementada en la rama `feat/movil-fase-0`, un commit por punto. Cada punto se midió antes y después con una auditoría automática (Chrome sin interfaz, 4 roles, 7 tamaños de 360 a 1440 px).

| # | Cambio | Dónde | Aceptación |
|---|---|---|---|
| 0.1 | Commit de la actualización ya hecha: `@angular/*` 22.2.1 exactos, zone.js ~0.16.3, vitest ^5.0.3, @types/node ^24, `buildTarget` de `serve` corregido y `AVALTRUST_API_URL` | `package.json`, lock, `angular.json`, `environment.ts` | Pasan build, `build:landing` y `ng test dashboard --watch=false`. Ojo: estos archivos redespliegan **también la landing** |
| 0.2 | `pr-dashboard.yml`: hoy solo hay despliegues en push a master | `.github/workflows/` | Cada PR corre `npm ci`, build, `build:landing`, tests, `check-ui.mjs` (al inicio solo avisa) y `text-diff.mjs` |
| 0.3 | Quitar `[@slideIn]` | `toast-container.component.ts:15` | `ng serve` sin NG05105 |
| 0.4 | Mover el margen de 280 px a `(min-width: 1025px)`, el corte del sidebar (`sidebar.component.css:270`) y de la hamburguesa (`header.component.css:307`). `calc(100vw - 280px)` y `100vw` pasan a `auto` | `styles.css:142-155`, `estado-cartera.component.css:1489-1492` | Sin hueco entre 769 y 1024 px, incluido 1024 |
| 0.5 | Aliados: enlazar `[isSidebarOpen]`, añadir `.overlay` y quitar el margen de 250/60 px, que su bloque ≤768 px nunca resetea | `aliados.component.html:13`, `.css:13-21` | A 390 px el menú abre y el contenido empieza en x=0 |
| 0.6 | El mismo desfase de 250/60 px, y `.overlay` donde falte | CSS de `curso-form`, `evaluacion-form`, `detalle-curso`, `lista-cursos` y `dashboard-afianzado` | Contenido alineado con el header (64 px) y el sidebar (280 px) |
| 0.7 | Quitar el `padding-top` duplicado | `certificados.component.css:8` y `:509` | El título deja de estar a unos 140 px del borde |
| 0.8 | `onLogout()` pasa a llamar a `AuthService.logout(true)`, que hace todo el cierre (estado local, navegación y petición al servidor) y devuelve `void` | `curso-form.component.ts:223`, `evaluacion-form.component.ts:190`, `auth.service.ts` | Ya no vuelve a `/dashboard` y el cierre llega al servidor desde cualquier página |
| 0.9 | Fondo y color de `body` con `--at-bg`/`--at-text` | `index.html:18` | Sin bandas oscuras en iOS; las pantallas sin fondo propio (p. ej. `evaluacion-curso`) se revisan |
| 0.10 | `.tab-panel { overflow: clip }`, y `overflow-x: clip` en `.dashboard-layout`/`.main-content` solo bajo `.sticky-bars-layout` (portfolio y claims; con la regla general el panel sticky de documentos tapaba sus botones) | `portfolio.component.css:362`, plantillas de portfolio y claims | Las barras Limpiar/Guardar de portfolio y claims vuelven a ser sticky |
| 0.11 | Tokens `--at-z-*`, `--at-tap-min` y `--at-safe-*` en un solo PR, y la escala de §2.6 aplicada | `tokens.css`, `header.component.css:17`, `sidebar.component.css:14/278`, `styles.css:24` y los fondos 998/999 | Los modales actuales quedan sobre el header |
| 0.12 | Ocultar "Actualizar pago" y la columna Acciones a CONSULTA, que es solo lectura (el backend rechaza sus escrituras) | `estado-cartera.component.html` | CONSULTA no ve acciones de escritura; USER y ADMIN no cambian |

## 1. Decisión de arquitectura

**Se adopta**
- `@angular/cdk@22.2.1` (`dialog`, `overlay`, `layout`, `a11y`, `menu`, `drag-drop`).
- `@angular/material@22.2.1`, solo `snack-bar`.
- Ambos con `npm i -E`, versión exacta como los `@angular/*`. El resto del workspace usa `^`/`~`.

**Por qué**
- **Accesibilidad incluida.** El `Dialog` del CDK da a los 12 modales propios lo que les falta: roles ARIA, focus trap, `restoreFocus`, ESC, `closePredicate` y bloqueo de scroll.
- **Una sola pieza.** El mismo `Dialog` sirve de hoja y de modal; con Material serían dos servicios y una fachada.
- **Capa superior.** Desde CDK 21, y también en 22.2.1, los overlays usan `usePopover ?? true` y van a la *top layer*, por encima de cualquier `z-index`. El `z-index: 1000` del CDK solo aplica en navegadores sin popover (iOS < 17).
- **Marca propia.** Se usan los tokens `--at-*`, sin una cuarta generación visual.
- **`MatSnackBar` sí compensa.** Trae una región `aria-live` probada, `openFromComponent` y harness para tests.
- **Salida hacia Material.** La API imita la de Material (`open()`, `closed`, `DATA`). Migrar más adelante cambia la fachada, no las pantallas.

**No se adopta:** `ng add`, temas prediseñados, Sass, `MatDialog`, `MatBottomSheet`, `MatFormField`, `MatTable`, `@angular/animations` (se usan CSS y `animate.enter/leave`), HammerJS ni librerías de terceros.

**Bundle (estimado; se mide con `--stats-json` en cada PR)**

| Pieza | JS min | brotli |
|---|---|---|
| CDK (overlay, portal, a11y, dialog, layout, menu) | +45–60 KB | +14–18 KB |
| `MatSnackBar` (incluye `MatButton` y ripple vía `SimpleSnackBar`) | +30–45 KB | +9–13 KB |
| Kit `at-*` | +10–15 KB | +3–5 KB |
| Borrar `toast-container` y el CSS de los modales | −10–20 KB | — |

Antes de F1 el chunk inicial pesaba ≈1,70 MB; tras F1 pesa 1,87 MB (aviso a 1,3 MB, error a 2 MB), así que F2 debe entrar antes de F4. F2 lo recupera con `loadComponent` en las 21 rutas con componente y `xlsx` bajo demanda; la meta es ≤800 KB.

## 2. Componentes y servicios base

**Ubicación:** el TS va en `projects/dashboard/src/app/ui/` y el CSS en `projects/dashboard/src/styles/overlays.css`, cargado entre `tokens.css` y `styles.css`. Nada va a la librería `shared-ui`: `tsconfig.json` la mapea a `./dist/shared-ui`, que el CI no construye, y `deploy-landing.yml` se dispara con `projects/shared-ui/**`.

### 2.1 AtViewport
```ts
export const AT_QUERIES = {
  compact: '(max-width: 767.98px), (max-height: 499.98px) and (pointer: coarse)', // => hoja
  sidebarDocked: '(min-width: 1025px)',
} as const; // AtViewport expone ambas como Signal<boolean> vía BreakpointObserver
```
768 px es el corte que más usa la app hoy. La segunda condición da hoja también al teléfono en horizontal (844×390), y las tablets reciben modal.

### 2.2 ToastService sobre MatSnackBar
```ts
// services/toast.service.ts: misma ruta y firma que hoy
show(message: string, type: 'success'|'error'|'warning'|'info' = 'info', duration?: number): void;
success | error | warning | info(m: string, d?: number); remove(id?: string);
fromHttpError(err: unknown, fallback: string): Promise<void>; // nuevo: error JSON dentro de un Blob
```
- **Contenido:** `AtSnackComponent`, con ícono Lucide y botón de cerrar de 44 px.
- **Anuncio y duración:** `assertive` y 8 s para errores; `polite` y 4–6 s para el resto. El temporizador es propio (`duration: 0`) para pausarlo con hover o foco.
- **Prioridad:** un éxito no tapa a un error en sus primeros 2 s, y se descartan los duplicados de 3 s.
- **Posición:** abajo al centro, con `margin-bottom: calc(8px + env(safe-area-inset-bottom) + var(--at-bottom-bar, 0px))`. En móvil, si hay una hoja abierta, sale **arriba**.
- **Top layer:** el backdrop de un overlay nuevo taparía el snackbar, así que al abrirse una hoja el facade lo reabre con su tiempo restante.
- **Tema:** sin tema no existen las `--mat-sys-*`, así que `overlays.css` define las `--mat-snack-bar-*` con tokens `--at-*` e Inter.

### 2.3 AtSheet
```ts
open<R, D>(content: ComponentType<unknown> | TemplateRef<unknown>, cfg?: {
  data?: D; size?: 'sm'|'md'|'lg'|'xl';   // modal: 400/560/800/min(1100px,100vw-48px)
  mobile?: 'sheet'|'fullscreen'; role?: 'dialog'|'alertdialog'; labelledBy?: string;
  dismissible?: boolean; autoFocus?: string; viewContainerRef?: ViewContainerRef;
  canClose?: () => boolean | Promise<boolean>;
}): AtSheetRef<R>;  // { mode, closed: Observable<R|undefined>, close(r?) }
// tokens: AT_SHEET_DATA, AT_OVERLAY_DEFAULTS { compact: 'sheet'|'dialog', historyBack, swipe }
```
**Estructura:** cabecera con título y botón de cerrar de 44 px; cuerpo con el único scroll (`overscroll-behavior: contain`); acciones apiladas a todo el ancho en la hoja (la principal abajo) y a la derecha en el modal.

**Comportamiento**
- **Apertura:** `Dialog.open()` con `container: AtSheetContainer` (extiende `CdkDialogContainer`), `ariaModal: true` y `closeOnNavigation: false`. El marcado actual se envuelve en `<ng-template>` y se abre con el `viewContainerRef` de la página, así que `ngModel`/`formGroup` siguen enlazados.
- **Modo:** se decide al abrir. **Interruptor de emergencia:** `compact: 'dialog'` convierte todas las hojas en modales.
- **Rotación y resize:** no se destruye nada (formulario, scroll y foco). El CSS adapta cada modo: la hoja no pasa de 640 px y se centra; el modal limita alto a `calc(var(--at-vvh,100dvh) - 32px)` y ancho a `calc(100vw - 32px)`. Girar un teléfono no cambia el modo. El cambio en caliente queda para F8, si los dispositivos lo piden.
- **Foco:** hoja `autoFocus: 'dialog'` (no salta el teclado); modal `'first-tabbable'`; confirmación destructiva en Cancelar (`data-at-autofocus`); siempre `restoreFocus`.
- **ESC y fondo:** cierran salvo `dismissible: false`. `canClose` síncrono va a `closePredicate`; si es asíncrono, se usa `disableClose` con `keydownEvents()`/`backdropClick()` y AtConfirm.
- **Scroll:** estrategia `block` del CDK.
- **Atrás (`AtOverlayHistory`):** al abrir hace `pushState({...history.state, atOverlay: id})` con la misma URL. `popstate` cierra solo el overlay de arriba (respetando `canClose`); cerrar desde la UI llama a `history.back()`; `NavigationStart` cierra todo sin tocar el historial.
- **Gesto:** arrastrar hacia abajo desde el asa o la cabecera (o el cuerpo con `scrollTop === 0`) cierra al pasar del 30 % o de 0,5 px/ms. El asa (`aria-hidden`) solo aparece con el gesto activo.
- **Safe area y teclado:** se añade `interactive-widget=resizes-content` al `viewport-fit=cover` existente. La hoja usa `max-height: calc(var(--at-vvh,100dvh) - max(24px, env(safe-area-inset-top)))` y las acciones `padding-bottom: max(16px, env(safe-area-inset-bottom))`. `--at-vvh` sale de `visualViewport`, porque iOS ignora `interactive-widget`.

### 2.4 AtConfirm
```ts
ask(o: { message: string; title?: string; confirmText: string; cancelText: string;
         tone?: 'default'|'danger'; details?: TemplateRef<unknown> }): Promise<boolean>; // ESC/fondo/atrás => false
```
Usa AtSheet con `sm` y `alertdialog`. No trae textos por defecto.

### 2.5 Apoyo
- **`DownloadService`.** Añade el `<a>` al DOM, revoca la URL con retraso y lee el error dentro del Blob. Sustituye los **10** `createObjectURL` de 9 archivos: `cursos.service:38`, `detalle-curso:110`, `evaluacion-curso:309`, `dashboard-afianzado:97`, `certificados.service:82`, `claims:366`, `estado-cartera:565`, `portfolio:609/621` y `reports.service:114`.
- **`[atBottomBar]`.** Publica en `--at-bottom-bar` sobre `<html>` el espacio que ocupa una barra de acciones desde el borde inferior de la ventana: su alto si está pegada abajo y hasta su borde superior si queda un poco por encima (final del formulario o pie de un modal que llena la pantalla). Si deja libre la franja que ocupa el aviso (72 px hasta que se pinta y luego su alto real), no reserva nada. Se mide al cambiar de tamaño, al entrar o salir de pantalla, al detenerse un scroll y al abrir y pintar un aviso. En F1 la llevan las barras de portfolio y claims y el pie de los modales que muestran avisos sin cerrarse (los cuatro de estado-cartera, la vista previa de certificados y eliminar curso).
- **`.at-table--stack`.** Tarjetas por debajo de 768 px, con `data-label` igual a la cabecera.
- **`atFilters`.** Filtros en línea en escritorio; en móvil, el mismo `TemplateRef` en una hoja.
- **`check-ui.mjs`.** Solo permite `@angular/material/snack-bar` y cuenta `alert(`, `confirm(` y `modal-overlay`.
- **`text-diff.mjs`.** Compara contra master el conjunto de textos: nodos de plantilla y literales de `alert`/`confirm`/toast (también el texto de respaldo de `fromHttpError`). Mover un texto no avisa; cambiarlo o crear uno sí. Desde F1 cuenta también los literales que un componente asigna a una propiedad que su plantilla interpola (`this.successMessage = '...'`, `this.success.set('...')`), así que pasar un mensaje de un banner al toast no cambia nada y cambiarlo por el camino falla. Un texto nuevo que ya era, entero, un texto visible de la base en otro archivo se lista aparte como reutilizado, con su archivo de origen; un comentario, un identificador o un trozo de otro texto no cuentan. Un texto hecho solo de iconos (emoji, ✕ o el × suelto de cerrar) no cuenta.

### 2.6 Escala de capas
| Token | Valor | Reemplaza |
|---|---|---|
| `--at-z-sticky` | 10 | barras fijas |
| `--at-z-header` | 100 | 1002 |
| `--at-z-drawer-scrim` | 190 | `.overlay` 1000, 998, 999 |
| `--at-z-drawer` | 200 | 1001/1100 |
| `--at-z-overlay` | 1000 | CDK sin popover |

Los 1000/2000 de los modales viejos, el 9999 y el 10000 desaparecen al migrar cada pieza.

**Regla del fondo y el header (aprendida en F0.11).** El fondo del menú lateral también se activa con el menú de usuario. Si quedara sobre el header, taparía el desplegable ("Cerrar sesión") y la hamburguesa. Por eso los fondos empiezan bajo el header (`top: var(--at-header-height)`), y mientras el menú de usuario está abierto el header sube a `calc(var(--at-z-drawer-scrim) + 1)` (clase `user-menu-open`). Cuando el menú de usuario pase a hoja o `cdkMenu` (F7), esta excepción se puede retirar.

## 3. Fases

**Reglas:** un PR por pantalla o pieza, que borra el código viejo; build, tests, `check-ui` y `text-diff` en verde; capturas a 390 y 1440 px; rollback con `git revert` (como `index.html` va con `no-cache`, el revert llega en minutos).

**F0 · Correcciones (S).** Ver la tabla inicial.

**F1 · Snackbar (M, 5 PRs)**
- **Objetivo:** un solo canal de feedback y 14 `alert()` menos.
- **1a:** instalar CDK y Material (redespliega también la landing), `overlays.css`, `AtSnackComponent` y el facade. Se borra `toast-container`.
- **1b–1e, un PR por área:** cursos admin, reports, banners y resultados de portfolio/claims. Errores al snackbar; validaciones en el formulario, con el mismo texto, `aria-invalid`/`aria-describedby` y foco en el primer error.
- **Aceptación:** las 26 llamadas funcionan, solo quedan los 6 `alert` de afianzado, el snackbar se anuncia una vez y nada lo tapa.
- **Envío:** 1a solo cambia el toast.

**Estado de F1 (octubre 2026):** implementada en la rama `feat/movil-f1`, que sale de `feat/movil-fase-0`. Hay un commit por subpunto, más cuatro ajustes de `text-diff`, un arreglo y dos correcciones de la revisión.

| # | Commit | Qué cambia |
|---|---|---|
| 1a | `cc58018` | CDK y Material 22.2.1, `overlays.css`, `AtSnackComponent`, `ToastService` sobre `MatSnackBar`, `[atBottomBar]`; se borra `toast-container` |
| guarda | `fa6820b`, `9f9529d`, `f17fc2a`, `19f5d0c` | `text-diff`: textos que ya estaban en la base, `fromHttpError`, el × suelto como icono y el archivo de origen correcto |
| 1b | `d5f3fd4` | Cursos admin: 12 `alert` menos; validaciones de curso y evaluación en el formulario |
| 1c | `075245d` | Reports con `fromHttpError`; banners de certificados y auditoría al snackbar; validaciones de certificados en el formulario |
| 1d | `8188713` | Banners de users, aliados y perfil al snackbar (los errores de formulario siguen en su modal); el dashboard deja el banner de carga y quita el toast repetido; éxitos de auth en un snackbar que sigue tras la redirección |
| arreglo | `f90be9c` | "Exportar" del dashboard ya no se queda en "Exportando" |
| 1e | `630e694` | Resultado de portfolio y claims al snackbar; los errores por fila siguen en la tarjeta; aviso al descargar la plantilla |
| revisión | `958c81e` | `text-diff` cuenta los mensajes que un componente guarda en una propiedad que su plantilla muestra (cambiarlos al pasarlos al toast falla) y solo da por reutilizado un texto visible entero de la base, no un comentario, un identificador ni un trozo |
| revisión | `f92b1ae` | `fromHttpError` lee el JSON en un `ArrayBuffer` y nunca muestra el texto de un error de red o de JavaScript (`TypeError`, `DOMException`, eventos) |

**Resultado**
- **Diálogos nativos:** `alert(` baja de 20 a 6 (solo afianzado, que es F3) y `confirm(` sigue en 3 (F4).
- **Avisos:** 64 llamadas directas a `ToastService` en 17 archivos, más 6 que pasan por `announceUploadResult`. De las 26 originales quedan 24: las 2 que repetían el banner del dashboard se quitaron.
- **Textos:** `text-diff` da 0 cambiados o eliminados y 0 nuevos, con 9 textos movidos entre archivos y 5 reutilizados ("Plantilla descargada exitosamente" y "Error al descargar la plantilla" en portfolio y claims, y "Cerrar" en el snackbar). Los mensajes que vivían en propiedades se cuentan en su archivo, en la base y ahora.
- **Pruebas:** 96 tests (eran 7 antes de F1). Además, 21 flujos a 390×844 y 1440×900 en Chrome contra el backend local, sin escrituras: 52 snackbars medidos, todos centrados, a 8 px del borde, sobre los modales y con cierre de 44 px.
- **Auditoría:** la completa (168 visitas) no muestra overflow, errores de consola, recortes ni fallos de menú nuevos frente a F0.
- **Bundle inicial:** 1.873.566 B, 361 KB con brotli: +122 KB sobre F0 (+23 KB con brotli). En el JS, el CDK suma 39 KB, `MatSnackBar` 15 KB, `MatButton` y el ripple 42 KB (entran por `SimpleSnackBar` aunque no se usen), Angular 8 KB, el código propio 7 KB y los 5 iconos Lucide 6 KB; los estilos, 4 KB. En F2, el facade puede cargar `MatSnackBar` bajo demanda en el primer aviso y sacar unos 100 KB del chunk inicial.

**Pendiente de aprobación**
- **"Operacion exitosa":** el título sigue en la tarjeta de portfolio y claims, pero la tarjeta ya no aparece en los éxitos. ¿Se quita?
- **Textos reutilizados:** portfolio y claims avisan la plantilla con "Plantilla descargada exitosamente" y "Error al descargar la plantilla", los textos que ya usa estado-cartera.
- **Guarda:** `text-diff` ya no cuenta como texto el × suelto de los botones de cerrar (como la regla de iconos de 1a).
- **Avisos sin texto:** eliminar o reordenar un curso con éxito y el fallo al cargar una evaluación siguen sin aviso, porque no hay un texto que reutilizar.

**F2 · Carga diferida y despliegue seguro (S/M, 3 PRs, en paralelo con F1)**
- **2a, primero:** `deploy-dashboard.yml` deja de borrar con `--delete` los chunks con hash anteriores (se podan los de más de 30 días). Además, `withNavigationErrorHandler` recarga una vez si falla un chunk.
- **2b:** `loadComponent` en las 21 rutas con componente; las 2 redirecciones no cambian.
- **2c:** `import('xlsx')` en `dashboard.ts:42`, `estado-cartera.ts:5`, `portfolio.ts:31`, `excel-template.service.ts:2` y `claims-template.service.ts:2`, y bajar el presupuesto.
- **Aceptación:** el AFIANZADO no descarga admin ni SheetJS, Excel funciona y una pestaña vieja sobrevive dos despliegues.

**F3 · AFIANZADO en el teléfono (M, 2 PRs)**
- **Tabla** (`dashboard-afianzado.html:94`): pasa a tarjetas con "Descargar PDF" a ancho completo y de 44 px o más.
- **Descargas:** `DownloadService` en los 4 sitios de afianzado (los otros 6 entran con el PR de su pantalla). Sus 6 `alert` van al snackbar y `cursos.service.ts:56` deja de pintar UI.
- **`evaluacion-curso.ts:249`:** aviso en línea, con scroll y foco en la pregunta pendiente.
- **Quiz** (`:63-73`): radios nativos.
- **Aceptación:** 0 `alert(` (el gate pasa a bloquear), sin scroll horizontal a 360 px y PDF descargado en iPhone Safari y Chrome Android reales.

**F4 · Hojas y confirmaciones (M, 3 PRs)**
- **4a:** `AtViewport`, `AtSheet`, `AtConfirm` y specs, con un primer consumidor: eliminar curso.
- **4b:** los 3 `confirm()`, activar/desactivar usuarios y `session-warning`.
- **4c:** atrás y gesto, tras un spike en dispositivos. Hasta entonces quedan apagados.
- **Aceptación:** 0 `confirm(` (gate bloqueante); ESC o fondo equivalen a cancelar; el foco empieza en Cancelar y vuelve a su origen.
- **Envío:** el kit entra con un solo consumidor de poco tráfico (ADMIN).

**F5 · Modales de formulario (L, un PR por pantalla)**
- **Orden:** actualización de pago → exportar / carga masiva / eliminar por fecha → detalle del dashboard → users → aliados → vistas previas e historial → contraseña del perfil. Cada PR borra el CSS y el z-index del modal viejo.
- **Aceptación:** hoja a 360, 390 y 844×390 y modal desde 768; rotar no borra datos; atrás cierra (con 4c activo); avisa si hay cambios sin guardar; si falla el guardado, sigue abierta.
- **Envío:** si una hoja falla en algún dispositivo, `compact: 'dialog'` la convierte en modal sin revertir la pantalla.

**F6 · Tablas y filtros (L)**
- **Tablas:** estado-cartera, users, aliados, auditoría (3), admin-cursos (`cdkDropList`, funciona al tacto) y la vista previa de reports.
- **Filtros:** `atFilters` en users y auditoría.
- **Aceptación:** sin scroll horizontal a 360 px y acciones de 44 px o más.

**F7 · Shell y navegación (M-L, 3 PRs)**
- **`AppShellComponent`:** ruta padre `''` con `authGuard`; las hijas conservan guard y `data.roles`. Las páginas pendientes conviven porque el Router prueba luego las rutas de primer nivel.
- **Sidebar:** `routerLink` y `ariaCurrentWhenActive`; el drawer (<1025 px) lleva `cdkTrapFocus`, ESC e `inert` en `<main>`. Menú de usuario como hoja o `cdkMenu`; filtro-aliados como hoja u overlay anclado; un solo logout.
- **Aceptación:** `<app-header` solo en el shell, todo usable con teclado y probado con un usuario local por rol.
- **Envío:** 3 PRs de 5–6 páginas; las que faltan siguen funcionando como hoy.

**F8 · Pulido (M)**
- Inputs ≥16 px, `inputmode` (`portfolio.html:214`, `claims.html:382-446`), áreas de 44 px, `100dvh`, hover solo con `(hover: hover)`, hex → tokens y borrar `estado-cartera.html:115-172`.
- **Opcional:** cambio de modo en caliente y editores de curso/evaluación en `fullscreen`.

## 4. Mapeo pantalla por pantalla

| Pantalla | Elemento | Hoy | Destino |
|---|---|---|---|
| Global | Toast (`toast-container.component.ts:10`) | Arriba a la derecha, z 9999, sin `aria-live`, falla en dev | Snackbar (F0.3, F1) |
| Global | `session-warning.component.ts:9` | z 10000, sin semántica | AtConfirm `alertdialog` (F4) |
| Global | Menú de usuario (`header.component.html:36`) | Desplegable sin ESC | Hoja en móvil, `cdkMenu` en escritorio (F7) |
| Global | Sidebar (`sidebar.component.html:1`, `aliados.html:13`) y `.overlay` (`styles.css:14`) | Repetido en 16 páginas; en Aliados no abre | F0.5 y escala z (F0); drawer accesible (F7) |
| Dashboard | Detalle (`html:487`) | Modal 86vh | AtSheet `lg` (F5) |
| Dashboard | filtro-aliados (`filtro-aliados.component.ts:37`) | Popover z 9999 | Hoja u overlay anclado (F7) |
| Dashboard | Banners `html:102/354`; toasts `ts:552/643/969` | Duplicados | Banner solo para el error de carga; snackbar con dedupe (F1) |
| Dashboard | Grid de mora (`html:361`) | Tarjetas | 44 px (F8) |
| Estado cartera | Pago (`actualizacion-pago-modal.component.ts:28`) | Modal | AtSheet `md`; `ts:490` en el formulario; `ts:530/540` → snackbar (F5) |
| Estado cartera | Carga masiva (`html:384`, `:395`) | Modal | `fullscreen`/`lg`; `ts:619/626/643` en el formulario (F5) |
| Estado cartera | Eliminar por fecha (`html:518`) | Modal z 2000 | AtSheet `sm` danger; `ts:744/749` → snackbar (F5) |
| Estado cartera | Exportar (`html:611`); `ts:348/430/571/575` | Modal; toasts | AtSheet `sm`; snackbar (F5) |
| Estado cartera | Tabla de 11 columnas (`html:277`) | Scroll lateral | Tarjetas (F6) |
| Portfolio y claims | Resultado (`portfolio.html:76`, `ts:373/581`; `claims.html:78`, `ts:352`) | Tarjeta | Snackbar; los errores por fila se quedan (F1) |
| Portfolio y claims | Limpiar (`portfolio.html:384`, `claims.html:509`) | Sin confirmación | AtConfirm, si apruebas el texto (F4) |
| Reports | `alert` `ts:230/276` | Nativo | Snackbar (F1) |
| Reports | Historial (`html:363`) | Panel lateral | Hoja o modal `md` (F5) |
| Reports | Vista previa (`html:401`) y tabla (`:434`) | Modal y tabla | `fullscreen`/`xl`; tarjetas (F5, F6) |
| Certificados | Error (`html:35`), vista previa (`:142`) y montos (`:168`) | Banner; modal 90/95vh | Snackbar (F1); `fullscreen`/`lg`, la tabla se mantiene (F5) |
| Users | Banners (`html:37/40`), filtros (`:44`) y tabla (`:101`) | En la página; barra; scroll lateral | Snackbar (F1); `atFilters` y tarjetas (F6) |
| Users | Crear/editar (`html:244`) | Modal 85vh | AtSheet `md` + `canClose` (F5) |
| Users | Activar/desactivar (`html:386`) | Modal | AtConfirm con `details` (F4) |
| Aliados | Banners `html:27/32`; tabla `:62` | En la página; scroll lateral | Snackbar (F1); tarjetas (F6) |
| Aliados | Crear/editar (`html:138`) | Modal 90vh | `fullscreen`/`lg` + `canClose` (F5) |
| Aliados | `confirm` `ts:197` | Nativo | AtConfirm danger (F4) |
| Admin cursos | Eliminar (`html:261`); `alert` `ts:193/266` | Modal z 2000; nativo | AtConfirm (F4); snackbar (F1) |
| Admin cursos | Catálogo (`html:148`) | Arrastre HTML5 | Tarjetas + `cdkDropList` (F6) |
| Curso form | `alert` `ts:71/117`, `ts:93/97`; `confirm` `ts:151` | Nativos | Snackbar; en el formulario; AtConfirm (F1, F4) |
| Evaluación form | `alert` `ts:66/72/76/81`, `ts:100/150`; `confirm` `ts:125` | Nativos | En el formulario; snackbar; AtConfirm (F1, F4) |
| Curso y evaluación form | Acordeones (`curso-form.html:121`, `evaluacion-form.html:56`) | Acordeón | Se mantienen; `fullscreen` opcional (F8) |
| Afianzado | Obligaciones (`html:94`); `alert` `ts:90/107` | 10 columnas; nativo | Tarjetas + DownloadService (F3) |
| Escuela | `alert` en `cursos.service.ts:56`, `detalle-curso.ts:123`, `evaluacion-curso.ts:322` | Nativo | Snackbar (F3) |
| Escuela | Quiz `evaluacion-curso.ts:63/249/32/80` | `div` clicables; `alert`; caja de error; Cancelar sin preguntar | Radios; aviso en línea; snackbar + Volver; AtConfirm si apruebas el texto (F3, F4) |
| Auditoría | `html:90`; filtros `:121`; tablas `:183/274/357` | Banner; barra; scroll | Snackbar (F1); `atFilters` y tarjetas (F6) |
| Perfil | `html:45/141`; contraseña `:148` | En la página; desplegable | Snackbar (F1); AtSheet `sm` (F5) |
| Auth | Éxito en `change-password.ts:28`, `reset-password.ts:27`, `login.html:13` | Banner + redirección | Snackbar que sobrevive a la navegación (F1) |
| Login | Términos (`html:50`); errores (`:74/105`) | En la página | Sin cambios (texto legal) |

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Código propio sin tests | Kit pequeño: el snackbar es de Material, el modo se fija al abrir y el gesto y el historial van aparte. Specs ≥80 % en `ui/` |
| Snackbar sin tema o bajo un backdrop | `overlays.css` define `--mat-snack-bar-*`; se reabre al abrir un overlay |
| El historial choca con el Router | Spike en dispositivos e interruptor `historyBack: false` |
| Navegador sin popover | El CDK usa su contenedor a 1000, sobre toda la escala |
| `--delete` borra chunks en uso | 2a antes de `loadComponent`, más recarga única |
| La landing se redespliega | `build:landing` en el PR; tokens en un solo PR |
| El teclado de iOS tapa la UI | `--at-vvh`, inputs de 16 px y prueba en un iPhone |
| Cambia un texto legal | `text-diff` en cada PR y textos nuevos aprobados |
| Cada push a master despliega | PRs pequeños, interruptores y `git revert` |

## 6. Cómo se prueba

**Tests unitarios.** Vitest y jsdom, con `OVERLAY_DEFAULT_CONFIG {usePopover:false}` y `BreakpointObserver` simulado (jsdom no tiene `matchMedia`).
- **`ToastService`** (`MatSnackBarHarness`): `politeness`, duraciones, prioridad, dedupe, posición arriba con hoja abierta y `fromHttpError`.
- **`AtSheet`:** modo e interruptor, `dismissible` y `canClose`, foco inicial y restaurado, `aria-labelledby`, centinela del historial y umbrales del gesto.
- **`AtConfirm`:** devuelve `true`/`false`, ESC da `false` y el foco empieza en Cancelar.
- **`DownloadService`:** lee el error que viene dentro del Blob.
- **Resto:** rutas con `loadComponent` y sus roles, recarga ante un fallo de chunk, logout de F0 y una spec de abrir y cerrar por pantalla migrada.

**Tamaños:** 360×740, 390×844, 844×390, 768×1024, 1024×768 y 1440×900. En cada uno: `scrollWidth ≤ innerWidth`, modo correcto, rotar sin perder datos, teclado y snackbar sin tapar acciones, y zoom al 200 %. Además, en iPhone con Safari, en un Android de gama media con Chrome y, si se consigue, en iOS < 17.

**Accesibilidad:** axe sin hallazgos graves; con teclado, el foco queda atrapado, ESC cierra y el foco vuelve; VoiceOver y TalkBack leen el título y el snackbar una vez; se respeta `prefers-reduced-motion`; contraste ≈4,7:1 (`--at-blue-500` sobre `--at-navy-700`); áreas táctiles ≥44 px e inputs ≥16 px.

## 7. Fuera de alcance y decisiones abiertas

**Fuera de alcance:** landing, modo oscuro, paginación en servidor, zoneless/OnPush, unificar las tres generaciones visuales, KPI duplicados en móvil y enlaces `.html` de los textos legales del login. La seguridad de sesión se trata en un frente aparte.

**Decisiones para ti**
1. **Textos nuevos:** rótulos de confirmación (propongo reutilizar "Cancelar" y "Eliminar"), `aria-label` "Cerrar", "Filtros (n)" y las confirmaciones de Limpiar y del quiz.
2. **Tablets de 768 a 1024 px:** ¿modal (propuesto) u hoja?
3. **Atrás en escritorio:** ¿también cierra los overlays?
4. **Errores del snackbar:** ¿8 s o hasta que se cierren?
5. **Master:** ¿protección de rama con PR obligatorio?
6. **Playwright y axe:** ¿los usamos para capturas automáticas?
7. **"Configuración":** apunta a `/user/settings`, que no existe. ¿Se oculta o se crea?
8. **Staging:** ¿entorno de staging o vista previa por PR?