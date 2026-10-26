// Testes estáticos (sem navegador): o CSS gerado declara as faces normal e
// itálica reais, e os arquivos de fonte existem e são WOFF2 válidos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(root, f), 'utf8');
const weights = [400, 500, 600, 700, 800];

const faces = css =>
  [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => ({
    style: /font-style:\s*(\w+)/.exec(m[1])?.[1],
    weight: Number(/font-weight:\s*(\d+)/.exec(m[1])?.[1]),
    src: /url\('([^']+)'\)/.exec(m[1])?.[1],
  }));

for (const file of ['actual.css', 'dist/actual-plus-override.css']) {
  test(`${file}: declara normal e italic para ${weights.join('/')}`, () => {
    const f = faces(read(file));
    for (const style of ['normal', 'italic']) {
      for (const weight of weights) {
        assert.equal(
          f.filter(x => x.style === style && x.weight === weight).length,
          1,
          `falta @font-face ${style} ${weight}`,
        );
      }
    }
    assert.equal(f.length, weights.length * 2);
  });
}

test('actual.css aponta para arquivos locais em fonts/ que existem e são WOFF2', () => {
  for (const f of faces(read('actual.css'))) {
    assert.match(f.src, /^fonts\/plus-jakarta-sans-(italic-)?\d{3}\.woff2$/);
    assert.equal(f.src.includes('italic') , f.style === 'italic', `${f.src} x ${f.style}`);
    assert.ok(existsSync(join(root, f.src)), `${f.src} não existe`);
    assert.equal(readFileSync(join(root, f.src)).subarray(0, 4).toString(), 'wOF2');
  }
});

test('dist embute as faces como data URI WOFF2 idênticos aos arquivos', () => {
  for (const f of faces(read('dist/actual-plus-override.css'))) {
    assert.match(f.src, /^data:font\/woff2;base64,/);
    const bytes = Buffer.from(f.src.split(',')[1], 'base64');
    const file = f.style === 'italic'
      ? `fonts/plus-jakarta-sans-italic-${f.weight}.woff2`
      : `fonts/plus-jakarta-sans-${f.weight}.woff2`;
    assert.ok(bytes.equals(readFileSync(join(root, file))), `${file} difere do embutido`);
  }
});

test('fontes itálicas têm origem, versão e licença registradas', () => {
  assert.match(read('fonts/FONTS.md'), /google\/fonts/);
  assert.match(read('fonts/FONTS.md'), /sha-?256/i);
  assert.match(read('fonts/OFL.txt'), /SIL Open Font License/);
});

test('paleta principal preservada', () => {
  const css = read('actual.css');
  for (const [k, v] of Object.entries({
    pageBackground: '#0f1420',
    tableBackground: '#161d2e',
    pageText: '#dde6f2',
    buttonPrimaryBackground: '#6f8bfa',
    numberPositive: '#4ade80',
    numberNegative: '#f87171',
    tableTextSubdued: '#899fbe',
  })) {
    assert.match(css, new RegExp(`--color-${k}:\\s*${v};`), k);
  }
});

test('actual.css só contém @font-face e :root (formato nativo do Actual)', () => {
  const css = read('actual.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const stripped = css.replace(/@font-face\s*\{[^}]*\}/g, '').replace(/:root\s*\{[^}]*\}/g, '').trim();
  assert.equal(stripped, '');
});

test('variáveis settings* (Actual pós-26.10.0) mapeadas sem sintaxe rejeitada pelo validador', () => {
  const css = read('actual.css');
  const names = ['CardBackground', 'CardBorder', 'CardText', 'CardTextSubdued', 'NavItemText',
    'NavItemBackgroundHover', 'NavItemAccentSelected', 'NavItemTextSelected', 'NavItemBackgroundSelected'];
  for (const n of names) assert.match(css, new RegExp(`--color-settings${n}:\\s*[^;]+;`), n);
  assert.doesNotMatch(css, /color-mix\(/);
});
