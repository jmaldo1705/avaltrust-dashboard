#!/usr/bin/env node
// Guarda de textos publicados (docs/plan-modernizacion-movil.md, 2.5).
//
// Extrae de projects/dashboard/src y projects/landing/src:
//   - los nodos de texto visibles de las plantillas (.html y template: `...`),
//     los atributos visibles (title, placeholder, alt, aria-label...) y los
//     literales de las interpolaciones;
//   - los literales que se pasan a alert(, confirm( y a los toasts
//     (toast*.success/error/warning/info/show, y el texto de respaldo de
//     toast*.fromHttpError).
// Un texto hecho solo de iconos (emoji o simbolos graficos como ✓ ✕ ⚠ ℹ) no
// cuenta: cambiar un icono de texto por uno de Lucide no toca la copia. La
// puntuacion, las cifras y simbolos como $ % * × o las flechas si cuentan.
// Compara la referencia base con el arbol de trabajo como multiconjuntos por
// archivo:
//   - mover un texto dentro del archivo o a otro archivo no avisa;
//   - cambiar o quitar un texto existente FALLA (sale con 1);
//   - un texto nuevo se lista como aviso para que se apruebe.
// Un texto que aparece como nuevo pero ya estaba tal cual en el codigo de la
// base (.ts y .html, sin specs) se cuenta como movido: es un mensaje que vivia
// en una propiedad (this.successMessage = '...') y ahora se pasa al toast. Si
// tiene partes variables (${...} o {{...}}), todas sus partes fijas tienen que
// estar en un mismo archivo de la base. Se listan aparte, con su archivo.
//
// Uso: node scripts/text-diff.mjs <ref-base> [--approved=archivo]
//   --approved: archivo con un texto aprobado por linea (las lineas con # se
//   ignoran). Esos textos pueden cambiar o desaparecer sin fallar.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['projects/dashboard/src', 'projects/landing/src'];

const args = process.argv.slice(2);
const BASE = args.find(a => !a.startsWith('--'));
const APPROVED_FILE = args.find(a => a.startsWith('--approved='))?.slice('--approved='.length);
if (!BASE) {
  console.error('Uso: node scripts/text-diff.mjs <ref-base> [--approved=archivo]');
  process.exit(2);
}

const git = (gitArgs, input) =>
  execFileSync('git', ['-C', ROOT, ...gitArgs], { input, maxBuffer: 256 * 1024 * 1024 });

let baseSha;
try {
  baseSha = git(['rev-parse', '--verify', '--quiet', `${BASE}^{commit}`]).toString().trim();
} catch {
  console.error(`text-diff: no existe la referencia "${BASE}" (en CI hace falta fetch-depth: 0).`);
  process.exit(2);
}

const isSource = f => /\.(html|ts)$/.test(f) && !/\.spec\.ts$/.test(f);

// ---------- lectura de archivos ----------
function baseFiles() {
  // -z: sin -z git entrecomilla las rutas con tildes o comillas y esos
  // archivos se perderian de la base sin avisar.
  const list = git(['ls-tree', '-r', '-z', '--name-only', baseSha, '--', ...SCAN_DIRS])
    .toString().split('\0').filter(f => f && isSource(f));
  if (!list.length) return new Map();
  // Un solo proceso de git para todos los contenidos.
  const out = git(['cat-file', '--batch'], list.map(f => `${baseSha}:${f}`).join('\n') + '\n');
  const files = new Map();
  let pos = 0;
  for (const f of list) {
    const nl = out.indexOf(0x0a, pos);
    const header = out.subarray(pos, nl).toString();
    const size = Number(/^[0-9a-f]+ blob (\d+)$/.exec(header)?.[1]);
    if (!Number.isInteger(size)) {
      console.error(`text-diff: git no devolvio ${f} de la base (${header}).`);
      process.exit(2);
    }
    files.set(f, out.subarray(nl + 1, nl + 1 + size).toString('utf8'));
    pos = nl + 1 + size + 1;
  }
  return files;
}

function workFiles() {
  const files = new Map();
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else {
        const rel = path.relative(ROOT, abs).split(path.sep).join('/');
        if (isSource(rel)) files.set(rel, fs.readFileSync(abs, 'utf8'));
      }
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d));
  return files;
}

// ---------- normalizacion ----------
const NAMED = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", copy: '©', reg: '®', trade: '™',
  middot: '·', bull: '•', hellip: '…', ndash: '–', mdash: '—', laquo: '«', raquo: '»',
  iexcl: '¡', iquest: '¿', rarr: '→', larr: '←', uarr: '↑', darr: '↓', times: '×', deg: '°',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
};
const decodeEntities = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') {
    const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : m;
  }
  return NAMED[e] ?? m;
});
const unescapeJs = s => s.replace(/\\(u\{[0-9a-f]+\}|u[0-9a-f]{4}|x[0-9a-f]{2}|[\s\S])/gi, (m, e) => {
  if (/^u\{/i.test(e)) return String.fromCodePoint(parseInt(e.slice(2, -1), 16));
  if (/^[ux]/i.test(e) && e.length > 1) return String.fromCodePoint(parseInt(e.slice(1), 16));
  return { n: ' ', t: ' ', r: ' ', '\n': '' }[e] ?? e;
});
const PH = '{{…}}';
const norm = s => s.replace(/\s+/g, ' ').trim();
const hasVisible = s => norm(s.split(PH).join('')).length > 0;
// Icono: pictograma o "otro simbolo" Unicode desde U+2000 (asi © y ® siguen
// contando), mas el selector de variacion y el ZWJ de los emoji compuestos.
const isIconChar = ch => ch === '\uFE0F' || ch === '\u200D' ||
  (ch.codePointAt(0) >= 0x2000 && /[\p{So}\p{Extended_Pictographic}]/u.test(ch));
const isIconOnly = s => {
  const chars = [...s.split(PH).join('').replace(/\s+/g, '')];
  return chars.length > 0 && chars.every(isIconChar);
};

// ---------- literales dentro de expresiones ----------
// Devuelve los literales de cadena de una expresion de plantilla o de TS.
// Con template=true se descartan los que no se ven: operandos de una
// comparacion, claves entre corchetes y argumentos de pipes.
function literals(expr, { template = false } = {}) {
  const found = [];
  let pipeAt = -1;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      let raw = '';
      let depth = 0;
      while (j < expr.length) {
        const d = expr[j];
        if (d === '\\') { raw += d + (expr[j + 1] ?? ''); j += 2; continue; }
        if (c === '`' && d === '$' && expr[j + 1] === '{') {
          // ${...}: se sustituye por un marcador
          depth = 1; j += 2;
          while (j < expr.length && depth) {
            if (expr[j] === '{') depth++;
            else if (expr[j] === '}') depth--;
            j++;
          }
          raw += '${…}';
          continue;
        }
        if (d === c) break;
        raw += d;
        j++;
      }
      found.push({ start: i, end: j, text: unescapeJs(raw) });
      i = j;
    } else if (template && c === '|' && expr[i + 1] !== '|' && expr[i - 1] !== '|' && pipeAt < 0) {
      pipeAt = i;
    }
  }
  return found.filter(({ start, end, text }) => {
    if (!norm(text)) return false;
    if (/^(success|error|warning|info)$/.test(text)) return false; // tipo de toast
    if (!template) return true;
    if (pipeAt >= 0 && start > pipeAt) return false;
    const before = expr.slice(0, start).trimEnd();
    const after = expr.slice(end + 1).trimStart();
    if (/[!=]==?$/.test(before) || /^[!=]==?/.test(after)) return false;
    if (before.endsWith('[') && after.startsWith(']')) return false;
    return true;
  }).map(l => norm(l.text));
}

// ---------- plantillas ----------
const VISIBLE_ATTRS = new Set([
  'title', 'placeholder', 'alt', 'label', 'aria-label', 'aria-description',
  'aria-roledescription', 'aria-placeholder', 'aria-valuetext',
]);

function scanTemplate(tpl, push) {
  let s = tpl.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  let buf = '';
  const flush = () => {
    const t = norm(decodeEntities(buf));
    if (t && hasVisible(t)) push(t, 'texto');
    buf = '';
  };
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '<' && /[A-Za-z/!]/.test(s[i + 1] || '')) {
      flush();
      let j = i + 1;
      let q = null;
      for (; j < s.length; j++) {
        const d = s[j];
        if (q) { if (d === q) q = null; } else if (d === '"' || d === "'") q = d; else if (d === '>') break;
      }
      scanTag(s.slice(i, j + 1), push);
      i = j + 1;
    } else if (c === '{' && s[i + 1] === '{') {
      const end = s.indexOf('}}', i + 2);
      const expr = s.slice(i + 2, end < 0 ? s.length : end);
      for (const l of literals(expr, { template: true })) push(l, 'interpolacion');
      buf += ` ${PH} `;
      i = end < 0 ? s.length : end + 2;
    } else if (c === '@' && /[a-z]/.test(s[i + 1] || '')) {
      // Bloque de control: @if (...) {, } @else if (...) {, @for (...) {, @let x = ...;
      flush();
      let j = i + 1;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const word = s.slice(i + 1, j);
      if (word === 'let') {
        const end = s.indexOf(';', j);
        i = end < 0 ? s.length : end + 1;
        continue;
      }
      let k = j;
      while (/\s/.test(s[k] || '')) k++;
      if (s.startsWith('if', k) && /[\s(]/.test(s[k + 2] || '')) { k += 2; while (/\s/.test(s[k] || '')) k++; }
      if (s[k] === '(') {
        let depth = 0;
        let q = null;
        for (; k < s.length; k++) {
          const d = s[k];
          if (q) { if (d === '\\') k++; else if (d === q) q = null; continue; }
          if (d === '"' || d === "'" || d === '`') q = d;
          else if (d === '(') depth++;
          else if (d === ')' && --depth === 0) break;
        }
        j = k + 1;
      }
      i = j;
    } else if (c === '{' || c === '}') {
      flush();
      i++;
    } else {
      buf += c;
      i++;
    }
  }
  flush();
}

function scanTag(tag, push) {
  if (/^<[/!]/.test(tag)) return;
  const name = /^<([A-Za-z][\w-]*)/.exec(tag)?.[1]?.toLowerCase() ?? '';
  const body = tag.slice(name.length + 1).replace(/\/?>$/, '');
  const attrs = [];
  for (const m of body.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs.push({ name: m[1], value: m[2] ?? m[3] ?? m[4] ?? '' });
  }
  const type = attrs.find(a => a.name.toLowerCase() === 'type')?.value.toLowerCase();
  for (const { name: attr, value } of attrs) {
    const lower = attr.toLowerCase();
    const bound = /^\[(?:attr\.)?([^\]]+)\]$/.exec(lower)?.[1];
    if (bound) {
      if (VISIBLE_ATTRS.has(bound) || bound === 'arialabel') {
        for (const l of literals(value, { template: true })) push(l, `[${bound}]`);
      }
      continue;
    }
    const visible = VISIBLE_ATTRS.has(lower) ||
      (lower === 'value' && name === 'input' && ['submit', 'button', 'reset'].includes(type));
    if (!visible) continue;
    let text = '';
    let rest = value;
    for (;;) {
      const a = rest.indexOf('{{');
      if (a < 0) { text += rest; break; }
      const b = rest.indexOf('}}', a + 2);
      text += rest.slice(0, a) + ` ${PH} `;
      for (const l of literals(rest.slice(a + 2, b < 0 ? rest.length : b), { template: true })) push(l, lower);
      rest = b < 0 ? '' : rest.slice(b + 2);
    }
    const t = norm(decodeEntities(text));
    if (t && hasVisible(t)) push(t, lower);
  }
}

// ---------- TypeScript ----------
// Quita comentarios sin tocar strings ni plantillas.
function stripComments(src) {
  let out = '';
  for (let i = 0; i < src.length;) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '/' && n === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      out += ' ';
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// Texto de los argumentos de una llamada que empieza en open (el parentesis).
function callArgs(src, open) {
  let depth = 0;
  let q = null;
  for (let k = open; k < src.length; k++) {
    const d = src[k];
    if (q) { if (d === '\\') k++; else if (d === q) q = null; continue; }
    if (d === '"' || d === "'" || d === '`') q = d;
    else if (d === '(') depth++;
    else if (d === ')' && --depth === 0) return src.slice(open + 1, k);
  }
  return src.slice(open + 1);
}

function scanTs(raw, push) {
  const src = stripComments(raw);
  for (const m of src.matchAll(/\btemplate\s*:\s*`/g)) {
    const start = m.index + m[0].length;
    let end = start;
    while (end < src.length && src[end] !== '`') end += src[end] === '\\' ? 2 : 1;
    scanTemplate(src.slice(start, end), push);
  }
  const calls = [
    [/(?<![\w$.])(?:window\.)?(alert|confirm)\s*\(/g, m => m[1]],
    [/\b([A-Za-z_$][\w$]*)\s*\.\s*(success|error|warning|info|show|fromHttpError)\s*\(/g, m => (/toast/i.test(m[1]) ? 'toast' : null)],
  ];
  for (const [re, kindOf] of calls) {
    for (const m of src.matchAll(re)) {
      const kind = kindOf(m);
      if (!kind) continue;
      const open = m.index + m[0].length - 1;
      for (const l of literals(callArgs(src, open))) push(l, kind);
    }
  }
}

function extract(file, content) {
  const items = [];
  const push = (text, kind) => { if (!isIconOnly(text)) items.push({ text, kind }); };
  if (file.endsWith('.html')) scanTemplate(content, push);
  else scanTs(content, push);
  return items;
}

// ---------- comparacion ----------
const count = items => items.reduce((m, it) => m.set(it.text, (m.get(it.text) || 0) + 1), new Map());

const approved = new Set();
if (APPROVED_FILE) {
  for (const line of fs.readFileSync(path.resolve(APPROVED_FILE), 'utf8').split(/\r?\n/)) {
    if (line.trim() && !line.trim().startsWith('#')) approved.add(norm(line));
  }
}

const before = baseFiles();
const after = workFiles();
const removed = []; // { file, text, n }
const added = [];
let totalBase = 0;
let totalNow = 0;
for (const file of new Set([...before.keys(), ...after.keys()])) {
  const a = count(before.has(file) ? extract(file, before.get(file)) : []);
  const b = count(after.has(file) ? extract(file, after.get(file)) : []);
  for (const n of a.values()) totalBase += n;
  for (const n of b.values()) totalNow += n;
  for (const [text, n] of a) if (n > (b.get(text) || 0)) removed.push({ file, text, n: n - (b.get(text) || 0) });
  for (const [text, n] of b) if (n > (a.get(text) || 0)) added.push({ file, text, n: n - (a.get(text) || 0) });
}

// Lo que sale de un archivo y entra en otro es un movimiento.
const moved = [];
const pool = new Map();
for (const r of added) pool.set(r.text, (pool.get(r.text) || 0) + r.n);
for (const r of removed) {
  const avail = pool.get(r.text) || 0;
  const take = Math.min(avail, r.n);
  if (take) { pool.set(r.text, avail - take); r.n -= take; moved.push({ ...r, n: take }); }
}
const takenFromAdded = new Map(moved.reduce((m, r) => m.set(r.text, (m.get(r.text) || 0) + r.n), new Map()));
for (const r of added) {
  const t = Math.min(takenFromAdded.get(r.text) || 0, r.n);
  if (t) { takenFromAdded.set(r.text, takenFromAdded.get(r.text) - t); r.n -= t; }
}

// Los nuevos que ya estaban tal cual en el codigo de la base son movimientos.
const BASE_PATHSPECS = [
  ...SCAN_DIRS.flatMap(d => [`${d}/*.ts`, `${d}/*.html`]),
  ':(exclude)*.spec.ts',
];
const fixedParts = text => text.split(/\$\{…\}|\{\{…\}\}/).map(s => s.trim()).filter(Boolean);
const baseHits = new Map();
function inBaseSource(text) {
  if (baseHits.has(text)) return baseHits.get(text);
  const parts = fixedParts(text);
  let file = null;
  if (parts.length) {
    // -F literal, --all-match: todas las partes en un mismo archivo.
    const patterns = parts.flatMap(p => ['-e', p]);
    try {
      file = git(['grep', '-l', '-F', '-I', '--all-match', ...patterns, baseSha, '--', ...BASE_PATHSPECS])
        .toString().split('\n').find(Boolean)?.replace(`${baseSha}:`, '') ?? null;
    } catch {
      file = null; // git grep sale con 1 si no hay coincidencias
    }
  }
  baseHits.set(text, file);
  return file;
}
const movedFromSource = []; // { file, text, n, from }
for (const r of added) {
  if (r.n <= 0) continue;
  const from = inBaseSource(r.text);
  if (from) { movedFromSource.push({ ...r, from }); r.n = 0; }
}

const failing = removed.filter(r => r.n > 0 && !approved.has(r.text));
const approvedHits = removed.filter(r => r.n > 0 && approved.has(r.text));
const notices = added.filter(r => r.n > 0);

const byFile = list => list.reduce((m, r) => m.set(r.file, [...(m.get(r.file) || []), r]), new Map());
const show = (list, sign) => {
  for (const [file, rows] of byFile(list)) {
    console.log(`  ${file}`);
    for (const r of rows) console.log(`    ${sign} ${JSON.stringify(r.text)}${r.n > 1 ? ` x${r.n}` : ''}`);
  }
};

console.log(`text-diff: ${BASE} (${baseSha.slice(0, 7)}) contra el arbol de trabajo`);
console.log(`Textos: ${totalBase} en la base, ${totalNow} ahora (${before.size} y ${after.size} archivos).\n`);
console.log(`Textos cambiados o eliminados: ${failing.length}${failing.length ? ' (FALLA)' : ''}`);
show(failing, '-');
if (approvedHits.length) {
  console.log(`\nCambios aprobados en ${APPROVED_FILE}: ${approvedHits.length}`);
  show(approvedHits, '~');
}
console.log(`\nTextos nuevos (piden aprobacion): ${notices.length}`);
show(notices, '+');
console.log(`\nTextos movidos entre archivos: ${moved.reduce((n, r) => n + r.n, 0)}`);
console.log(`Textos que ya estaban en el codigo de la base (movidos al toast o a la plantilla): ${movedFromSource.length}`);
for (const [file, rows] of byFile(movedFromSource)) {
  console.log(`  ${file}`);
  for (const r of rows) console.log(`    = ${JSON.stringify(r.text)}${r.n > 1 ? ` x${r.n}` : ''}  (base: ${r.from})`);
}
console.log(failing.length ? '\nFALLA: hay textos publicados que cambian o desaparecen.' : '\nOK: ningun texto existente cambia.');

if (process.env.GITHUB_ACTIONS === 'true') {
  const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  for (const r of failing) console.log(`::error file=${r.file}::${esc(`Texto cambiado o eliminado: ${JSON.stringify(r.text)}`)}`);
  for (const r of notices) console.log(`::notice file=${r.file}::${esc(`Texto nuevo, pide aprobacion: ${JSON.stringify(r.text)}`)}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ['### text-diff', '', `Base: \`${baseSha.slice(0, 7)}\``, '',
      `- Cambiados o eliminados: **${failing.length}**`, `- Nuevos (piden aprobacion): **${notices.length}**`,
      `- Movidos entre archivos: ${moved.reduce((n, r) => n + r.n, 0)}`,
      `- Ya estaban en el codigo de la base: ${movedFromSource.length}`, ''];
    for (const r of failing) lines.push(`- Cambia o desaparece en \`${r.file}\`: ${JSON.stringify(r.text)}`);
    for (const r of notices) lines.push(`- Nuevo en \`${r.file}\`: ${JSON.stringify(r.text)}`);
    for (const r of movedFromSource) lines.push(`- Ya estaba en \`${r.from}\`, ahora en \`${r.file}\`: ${JSON.stringify(r.text)}`);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n\n');
  }
}

process.exit(failing.length ? 1 : 0);
