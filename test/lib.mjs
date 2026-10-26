// Utilitários dos testes tipográficos: carrega a fixture com o CSS do tema
// (completo, ou "antes" = sem as faces itálicas) e mede tinta cortada.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureUrl = pathToFileURL(join(root, 'test/fixture/index.html')).href;

// 'real'  = actual.css como publicado (faces normal + italic)
// 'synth' = o mesmo CSS sem as faces itálicas (estado anterior: o navegador sintetiza)
export function themeCss(variant) {
  let css = readFileSync(join(root, 'actual.css'), 'utf8');
  if (variant === 'synth') {
    css = css.replace(/@font-face\s*\{[^}]*font-style:\s*italic[^}]*\}\s*/g, '');
  }
  return css.replace(/url\('fonts\//g, `url('${pathToFileURL(join(root, 'fonts')).href}/`);
}

export const launch = () =>
  chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text'] });

export async function openPage(browser, variant, { scale = 1 } = {}) {
  const page = await browser.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: scale });
  await page.goto(fixtureUrl);
  await page.addStyleTag({ content: themeCss(variant) });
  await page.evaluate(() => (document.body.className = 'theme-font'));
  return page;
}

// Renderiza uma célula e devolve métricas; `synthesis: false` desliga a
// síntese de itálico (se a face real não existir, sai texto reto).
export async function renderCase(page, opts) {
  await page.evaluate(
    async ({ opts }) => {
      document.body.style.fontSynthesis = opts.synthesis === false ? 'none' : '';
      window.renderRow({ ...opts, visible: false });
      const style = opts.italic ? 'italic' : 'normal';
      await document.fonts.load(`${style} 13px "Plus Jakarta Sans"`, opts.text);
      await document.fonts.ready;
    },
    { opts },
  );
}

export const loadedFaces = page =>
  page.evaluate(() =>
    [...document.fonts]
      .filter(f => f.status === 'loaded')
      .map(f => `${f.style}-${f.weight}`),
  );

// Fotografa a célula recortada e com overflow visível; compara no navegador.
// Retorna píxeis de tinta que só existem sem o recorte (= cortados) e a
// largura de texto/caixa para saber se houve reticências.
export async function measureClip(page, opts) {
  await renderCase(page, opts);
  const geo = await page.evaluate(() => {
    const r = document.getElementById('row').getBoundingClientRect();
    const t = document.getElementById('txt');
    return {
      x: r.x, y: r.y,
      truncated: t.scrollWidth > t.clientWidth,
      textW: t.scrollWidth, boxW: t.clientWidth,
    };
  });
  const clip = { x: geo.x - 4, y: geo.y + 3, width: opts.width + 40, height: 26 };
  const a = await page.screenshot({ clip });
  await page.evaluate(() => {
    document.getElementById('txt').classList.add('visible');
    const w = document.getElementById('payee-wrap');
    if (w) { w.style.overflow = 'visible'; w.style.textOverflow = 'clip'; }
  });
  const b = await page.screenshot({ clip });
  const cut = await page.evaluate(
    async ({ a, b }) => {
      const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const { naturalWidth: w, naturalHeight: h } = ia;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const px = i => { ctx.clearRect(0, 0, w, h); ctx.drawImage(i, 0, 0); return ctx.getImageData(0, 0, w, h).data; };
      const da = px(ia), db = px(ib);
      let n = 0, maxX = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) { n++; maxX = Math.max(maxX, x); }
      }
      return { n, maxX };
    },
    { a: a.toString('base64'), b: b.toString('base64') },
  );
  return { ...geo, cutPixels: cut.n, a, b };
}

// Diferença de píxeis entre duas capturas PNG (mesmo tamanho).
export function pixelDiff(page, a, b) {
  return page.evaluate(
    async ({ a, b }) => {
      const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const { naturalWidth: w, naturalHeight: h } = ia;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const px = i => { ctx.clearRect(0, 0, w, h); ctx.drawImage(i, 0, 0); return ctx.getImageData(0, 0, w, h).data; };
      const da = px(ia), db = px(ib);
      let n = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) n++;
      return n;
    },
    { a: a.toString('base64'), b: b.toString('base64') },
  );
}
