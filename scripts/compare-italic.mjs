#!/usr/bin/env node
// Gera uma folha PNG comparando normal × itálico sintético × itálico real nos
// textos de agendamentos (nomes, acentos, valores), ampliada 3x. Evidência
// visual; os números ficam em test/typography.test.mjs.
//
//   node scripts/compare-italic.mjs [saida.png]     (requer npm install)

import { join } from 'node:path';
import { launch, openPage, renderCase, root } from '../test/lib.mjs';

const out = process.argv[2] || join(root, 'comparacao-italico.png');
const cases = [
  ['payee', 220, ['Netflix', 'Dominion Power', 'Fast Internet', 'Açúcar', 'juros']],
  ['amount', 100, ['1.900,00', '1.234.567,89']],
];
const browser = await launch();
const real = await openPage(browser, 'real');
const synth = await openPage(browser, 'synth');
const cells = [];
for (const [kind, width, texts] of cases) {
  for (const text of texts) {
    const shot = async (page, italic) => {
      await renderCase(page, { kind, width, text, italic });
      const r = await page.evaluate(() => document.getElementById('row').getBoundingClientRect().toJSON());
      return (await page.screenshot({ clip: { x: r.x, y: r.y, width: width + 8, height: 32 } })).toString('base64');
    };
    cells.push({ text, width, imgs: [await shot(real, false), await shot(synth, true), await shot(real, true)] });
  }
}
const sheet = await browser.newPage({ viewport: { width: 2200, height: 100 } });
const labels = ['normal', 'itálico sintético (antes)', 'itálico real (depois)'];
const img = (c, b) =>
  `<img style="image-rendering:pixelated;width:${(c.width + 8) * 3}px" src="data:image/png;base64,${b}">`;
await sheet.setContent(`<body style="margin:12px;background:#0f1420;color:#dde6f2;font:12px sans-serif">${cells
  .map(
    c => `<div style="display:flex;align-items:center;gap:10px;margin:2px 0"><b style="width:100px">${c.text}</b>${c.imgs
      .map((b, i) => `<div><div style="color:#899fbe">${labels[i]}</div>${img(c, b)}</div>`)
      .join('')}</div>`,
  )
  .join('')}</body>`);
await sheet.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
