#!/usr/bin/env node
// Valida o tema com o validador REAL do Actual (customThemes.ts do master),
// do mesmo jeito que o app faz ao instalar pelo catálogo, e confere se o tema
// cobre todas as variáveis --color-* dos temas embutidos.
//
// Requer Node ≥ 22.18 (type stripping de TypeScript sem flag).

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.env.ACTUAL_REF || 'master';
const raw = p => `https://raw.githubusercontent.com/actualbudget/actual/${ref}/${p}`;

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

const dir = mkdtempSync(join(tmpdir(), 'actual-theme-'));
const modPath = join(dir, 'customThemes.ts');
writeFileSync(
  modPath,
  await get(raw('packages/desktop-client/src/style/customThemes.ts')),
);
const { validateThemeCss, embedThemeFonts } = await import(pathToFileURL(modPath).href);

let failed = false;
const ok = msg => console.log(`✓ ${msg}`);
const fail = msg => {
  console.error(`✗ ${msg}`);
  failed = true;
};

// 1. Instalação pelo repositório: o Actual baixa actual.css e embute as
//    fontes buscando fonts/*.woff2 no próprio repo. Aqui o fetch das fontes
//    é servido do disco.
const themeCss = readFileSync(join(root, 'actual.css'), 'utf8');
const realFetch = globalThis.fetch;
globalThis.fetch = async url => {
  const m = String(url).match(/refs\/heads\/main\/(.+)$/);
  if (!m) return realFetch(url);
  return new Response(readFileSync(join(root, m[1])));
};
try {
  const embedded = await embedThemeFonts(themeCss, 'csantiviago/actual-plus-theme');
  validateThemeCss(embedded);
  ok('actual.css passa no validador (com fontes embutidas)');
} catch (e) {
  fail(`actual.css: ${e.message}`);
} finally {
  globalThis.fetch = realFetch;
}

// 2. Colar em "Additional CSS overrides".
const overrideCss = readFileSync(join(root, 'dist/actual-plus-override.css'), 'utf8');
try {
  validateThemeCss(overrideCss);
  ok('dist/actual-plus-override.css passa no validador');
} catch (e) {
  fail(`dist/actual-plus-override.css: ${e.message}`);
}

// 3. Cobertura: toda variável dos temas embutidos precisa estar definida,
//    senão ela cai no valor do tema-base (dark) e destoa.
const names = css => new Set(css.match(/--color-[A-Za-z0-9]+(?=\s*:)/g));
const ours = names(themeCss);
const base = new Set();
for (const t of ['light', 'dark', 'midnight']) {
  for (const n of names(await get(raw(`packages/component-library/src/themes/${t}.css`)))) {
    base.add(n);
  }
}
const missing = [...base].filter(n => !ours.has(n));
const extra = [...ours].filter(n => !base.has(n));
if (missing.length) fail(`faltam ${missing.length} variáveis: ${missing.join(', ')}`);
else ok(`cobre as ${base.size} variáveis --color-* dos temas embutidos`);
if (extra.length) console.warn(`! variáveis que o Actual não usa mais: ${extra.join(', ')}`);

process.exit(failed ? 1 : 0);
