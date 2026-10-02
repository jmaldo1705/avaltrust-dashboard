#!/usr/bin/env node
// Cuenta los patrones de interfaz que el plan movil quiere retirar
// (docs/plan-modernizacion-movil.md, 2.5):
//   - alert( y confirm( nativos
//   - modales propios (modal-overlay, modal-backdrop, preview-modal...)
//   - imports de @angular/material distintos de @angular/material/snack-bar
//
// En la Fase 0 solo informa: siempre sale con 0. Cuando una fase deje un
// contador en cero, se vuelve bloqueante con --block, por ejemplo:
//   node scripts/check-ui.mjs --block=alert,confirm
// Categorias: alert, confirm, modal, material.
//
// Uso local: node scripts/check-ui.mjs [--block=...] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['projects/dashboard/src', 'projects/landing/src'];

const args = process.argv.slice(2);
const opt = name => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const BLOCK = new Set((opt('block') || '').split(',').map(s => s.trim()).filter(Boolean));
const AS_JSON = args.includes('--json');

const CATEGORIES = {
  alert: 'alert( nativo',
  confirm: 'confirm( nativo',
  modal: 'Modales propios',
  material: 'Imports de @angular/material (fuera de snack-bar)',
};
for (const b of BLOCK) {
  if (!CATEGORIES[b]) {
    console.error(`Categoria desconocida en --block: ${b}. Validas: ${Object.keys(CATEGORIES).join(', ')}`);
    process.exit(2);
  }
}

// Clases que marcan la raiz de un modal hecho a mano.
const MODAL_CLASS = /^(?:[a-z0-9-]*modal-overlay|modal-backdrop|preview-modal|session-warning-overlay)$/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Quita comentarios de TS/JS/CSS sin tocar strings ni plantillas, y conserva
// los saltos de linea para que los numeros de linea sigan valiendo.
function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      out += c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') { out += src[i++]; }
        out += src[i++] ?? '';
      }
      out += src[i++] ?? '';
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// Cambia los comentarios por espacios: asi los indices siguen apuntando al original.
const stripHtmlComments = src => src.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
const lineOf = (src, index) => src.slice(0, index).split('\n').length;

const findings = Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, []]));
const add = (cat, file, src, index, snippet) =>
  findings[cat].push({ file, line: lineOf(src, index), snippet: snippet.trim().slice(0, 100) });

function scanTs(file, raw) {
  const src = stripComments(raw);
  for (const [cat, re] of [
    ['alert', /(?<![\w$.])(?:window\.)?alert\s*\(/g],
    ['confirm', /(?<![\w$.])(?:window\.)?confirm\s*\(/g],
  ]) {
    for (const m of src.matchAll(re)) add(cat, file, src, m.index, src.slice(m.index).split('\n')[0]);
  }
  for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)(['"])(@angular\/material(?:\/[^'"]*)?)\1/g)) {
    if (m[2] !== '@angular/material/snack-bar') add('material', file, src, m.index, m[0]);
  }
  // Plantillas en linea: template: `...`
  for (const m of src.matchAll(/template\s*:\s*`/g)) {
    const start = m.index + m[0].length;
    let end = start;
    while (end < src.length && src[end] !== '`') end += src[end] === '\\' ? 2 : 1;
    scanTemplate(file, src, start, src.slice(start, end));
  }
}

function scanTemplate(file, whole, offset, tpl) {
  const clean = stripHtmlComments(tpl);
  for (const m of clean.matchAll(/\bclass\s*=\s*(["'])([^"']*)\1/g)) {
    const hit = m[2].split(/\s+/).find(c => MODAL_CLASS.test(c));
    if (hit) add('modal', file, whole, offset + m.index, `class="${m[2]}"`);
  }
}

function scanCss(file, raw) {
  const src = stripComments(raw);
  for (const m of src.matchAll(/@(?:import|use|forward)\s+(['"])(?:~)?(@angular\/material(?:\/[^'"]*)?)\1/g)) {
    if (!m[2].startsWith('@angular/material/snack-bar')) add('material', file, src, m.index, m[0]);
  }
}

for (const dir of SCAN_DIRS) {
  for (const abs of walk(path.join(ROOT, dir))) {
    const file = path.relative(ROOT, abs).split(path.sep).join('/');
    if (/\.spec\.ts$/.test(file)) continue;
    const ext = path.extname(file);
    if (!['.ts', '.html', '.css'].includes(ext)) continue;
    const raw = fs.readFileSync(abs, 'utf8');
    if (ext === '.ts') scanTs(file, raw);
    else if (ext === '.html') scanTemplate(file, raw, 0, raw);
    else scanCss(file, raw);
  }
}

const blocked = [...BLOCK].filter(cat => findings[cat].length > 0);

if (AS_JSON) {
  console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v.length])), findings, blocked }, null, 2));
} else {
  console.log('check-ui: patrones de interfaz a retirar (plan movil)\n');
  for (const [cat, label] of Object.entries(CATEGORIES)) {
    const list = findings[cat];
    const mode = BLOCK.has(cat) ? 'bloquea' : 'solo informa';
    console.log(`${label}: ${list.length} (${mode})`);
    for (const f of list) console.log(`  ${f.file}:${f.line}  ${f.snippet}`);
    console.log('');
  }
  if (blocked.length) console.log(`FALLA: ${blocked.join(', ')} debe quedar en 0.`);
  else console.log(BLOCK.size ? 'OK: las categorias bloqueantes estan en 0.' : 'Modo informativo: no bloquea.');
}

// En GitHub Actions deja un resumen en la pagina del job y anota cada hallazgo.
if (process.env.GITHUB_ACTIONS === 'true') {
  for (const [cat, list] of Object.entries(findings)) {
    const level = BLOCK.has(cat) ? 'error' : 'warning';
    for (const f of list) console.log(`::${level} file=${f.file},line=${f.line}::${CATEGORIES[cat]}`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = Object.entries(CATEGORIES).map(([cat, label]) =>
      `| ${label} | ${findings[cat].length} | ${BLOCK.has(cat) ? 'bloquea' : 'informa'} |`);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      ['### check-ui', '', '| Patron | Total | Modo |', '|---|---|---|', ...rows, ''].join('\n') + '\n');
  }
}

process.exit(blocked.length ? 1 : 0);
