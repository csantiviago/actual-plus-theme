#!/usr/bin/env node
// Regenera fonts/plus-jakarta-sans-italic-{400..800}.woff2 a partir da fonte
// variável oficial (Google Fonts), fixando o eixo wght e recortando para
// Latin + Latin-1 + Latin Estendido-A + pontuação comum.
//
//   node scripts/make-italic-fonts.mjs <PlusJakartaSans-Italic[wght].ttf>
//
// Origem, versão e SHA-256 do TTF: fonts/FONTS.md. Requer `npm install`.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) {
  console.error('uso: node scripts/make-italic-fonts.mjs <PlusJakartaSans-Italic[wght].ttf>');
  process.exit(2);
}

const ttf = readFileSync(src);
console.log(`sha256 ${createHash('sha256').update(ttf).digest('hex')}`);

const ranges = [
  [0x20, 0x7e], [0xa0, 0xff], [0x100, 0x17f], [0x131, 0x131], [0x2c6, 0x2c6],
  [0x2da, 0x2da], [0x2dc, 0x2dc], [0x2013, 0x2014], [0x2018, 0x201a],
  [0x201c, 0x201e], [0x2020, 0x2022], [0x2026, 0x2026], [0x2030, 0x2030],
  [0x2039, 0x203a], [0x20ac, 0x20ac], [0x2122, 0x2122], [0x2212, 0x2212],
];
let text = '';
for (const [a, b] of ranges) for (let c = a; c <= b; c++) text += String.fromCodePoint(c);

for (const w of [400, 500, 600, 700, 800]) {
  const out = await subsetFont(ttf, text, { targetFormat: 'woff2', variationAxes: { wght: w } });
  writeFileSync(join(root, 'fonts', `plus-jakarta-sans-italic-${w}.woff2`), out);
  console.log(`italic ${w}  ${(out.length / 1024).toFixed(1)} KB`);
}
