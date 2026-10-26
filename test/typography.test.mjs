// Regressão tipográfica no Chromium: usa o actual.css publicado numa fixture
// derivada do DOM/CSS do Actual v26.10.0 (não é o app completo).
//
// document.fonts.check() NÃO serve de prova: devolve true também quando o
// navegador sintetiza o itálico. As provas aqui são (1) a face itálica ficar
// com status "loaded", (2) com font-synthesis: none o itálico diferir do
// normal e (3) píxeis de tinta cortados pelo overflow:hidden das células.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openPage, renderCase, measureClip, loadedFaces, pixelDiff } from './lib.mjs';

const PAYEES = ['Netflix', 'Dominion Power', 'Fast Internet', 'Açúcar', 'juros', 'Stuff'];
const AMOUNTS = ['1.900,00', '1.234.567,89', '120,00'];

let browser, real, synth;
before(async () => {
  browser = await launch();
  real = await openPage(browser, 'real');
  synth = await openPage(browser, 'synth'); // antes: sem as faces itálicas
});
after(() => browser?.close());

test('face itálica real é carregada (e não existe no estado "antes")', async () => {
  await renderCase(real, { kind: 'payee', width: 220, text: 'Netflix', italic: true });
  await renderCase(synth, { kind: 'payee', width: 220, text: 'Netflix', italic: true });
  assert.ok((await loadedFaces(real)).includes('italic-400'), 'italic-400 não carregou');
  assert.deepEqual((await loadedFaces(synth)).filter(f => f.startsWith('italic')), []);
});

test('sem síntese, itálico real difere do normal; sintético não (o teste discrimina)', async () => {
  const shot = async (page, italic) => {
    await renderCase(page, { kind: 'payee', width: 260, text: 'Netflix Açúcar juros', italic, synthesis: false });
    return page.screenshot({ clip: { x: 30, y: 40, width: 300, height: 40 } });
  };
  assert.ok((await pixelDiff(real, await shot(real, false), await shot(real, true))) > 100);
  assert.equal(await pixelDiff(synth, await shot(synth, false), await shot(synth, true)), 0);
});

test('estilo normal não muda com as faces novas', async () => {
  for (const text of [...PAYEES, 'Dívida União']) {
    const a = await measureClip(real, { kind: 'payee', width: 220, text, italic: false });
    const b = await measureClip(synth, { kind: 'payee', width: 220, text, italic: false });
    assert.ok(a.a.equals(b.a), `${text}: renderização normal mudou`);
  }
});

test('valores em itálico: o último dígito não é mais cortado', async () => {
  for (const text of ['1.900,00', '120,00']) {
    const r = await measureClip(real, { kind: 'amount', width: 100, text, italic: true });
    const s = await measureClip(synth, { kind: 'amount', width: 100, text, italic: true });
    assert.equal(r.cutPixels, 0, `${text}: face real ainda corta ${r.cutPixels} px`);
    assert.ok(s.cutPixels > 0, `${text}: o "antes" deveria reproduzir o corte`);
  }
});

test('nomes e acentos em itálico: face real não corta mais que a sintética (±1 px de antisserrilhado)', async () => {
  let sumReal = 0, sumSynth = 0;
  const rows = [];
  for (const text of [...PAYEES, 'Ação União']) {
    for (const width of [120, 220]) {
      const r = await measureClip(real, { kind: 'payee', width, text, italic: true });
      const s = await measureClip(synth, { kind: 'payee', width, text, italic: true });
      rows.push(`${text}@${width}: sintético ${s.cutPixels}px, real ${r.cutPixels}px`);
      assert.ok(r.cutPixels <= s.cutPixels + 1, `${text}@${width}: real ${r.cutPixels} > sintético ${s.cutPixels} + 1`);
      sumReal += r.cutPixels;
      sumSynth += s.cutPixels;
    }
  }
  console.log(rows.join('\n'));
  assert.ok(sumReal < sumSynth, `real ${sumReal} não é menor que sintético ${sumSynth}`);
});

test('coluna estreita: o truncamento por largura (reticências) é igual com a face real', async () => {
  for (const italic of [false, true]) {
    const r = await measureClip(real, { kind: 'amount', width: 80, text: '1.234.567,89', italic });
    const s = await measureClip(synth, { kind: 'amount', width: 80, text: '1.234.567,89', italic });
    assert.equal(r.truncated, true);
    assert.equal(r.truncated, s.truncated);
    assert.ok(Math.abs(r.textW - s.textW) <= 2, `largura do texto mudou: ${r.textW} x ${s.textW}`);
  }
});
