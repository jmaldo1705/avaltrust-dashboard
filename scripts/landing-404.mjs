#!/usr/bin/env node
// Prepara la pagina de error de la landing para Firebase Hosting.
//
// Firebase sirve dist/landing/browser/404.html con estado 404 cuando una URL
// no existe. CloudFront respondia esos casos con /index.html (la portada
// prerenderizada) y estado 404: en el navegador la ruta comodin de Angular
// ('**' -> '') lleva a la portada, y los buscadores reciben el 404. Copiar
// index.html como 404.html conserva ese comportamiento.
//
// Corre como predeploy del target "landing" en firebase.json, despues de
// npm run build:landing. Uso manual: node scripts/landing-404.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'dist', 'landing', 'browser');
const indice = path.join(salida, 'index.html');

if (!fs.existsSync(indice)) {
  console.error(`No existe ${path.relative(raiz, indice)}: corre antes npm run build:landing.`);
  process.exit(1);
}

fs.copyFileSync(indice, path.join(salida, '404.html'));
console.log('404.html listo (copia de index.html).');
