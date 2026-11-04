// Renders art/monsters/svg/*.svg to transparent PNGs (2x) in art/monsters/png/ and a labelled contact sheet.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const SVG = path.join(__dirname, 'svg'), PNG = path.join(__dirname, 'png'); fs.mkdirSync(PNG, { recursive: true });
const NAMES = { bogjaw: 'Bogjaw', duskheron: 'Duskheron', emberwhelk: 'Emberwhelk', mistglass: 'Mistglass', monolith: 'Monolith Warden', stormroc: 'Stormcrown Roc', slagwyrm: 'Slagwyrm', gorhydra: 'Gorhydra', sovereign: 'Wanderer Sovereign' };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 940, height: 520 }, deviceScaleFactor: 2 });
  const cells = [];
  for (const id of Object.keys(NAMES)) {
    const svg = fs.readFileSync(path.join(SVG, `${id}.svg`), 'utf8');
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(PNG, `${id}.png`), omitBackground: true, clip: { x: 0, y: 0, width: 940, height: 520 } });
    cells.push(`<figure><div class="pl">${svg.replace('width="940" height="520"', 'width="100%"')}</div><figcaption>${NAMES[id]}</figcaption></figure>`);
  }
  await p.setViewportSize({ width: 1500, height: 900 });
  await p.setContent(`<style>body{margin:0;background:#14100d;font:600 18px Barlow,sans-serif;color:#ecdfc8}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:16px}figure{margin:0;background:#1a1511;border:1px solid #3d3229;border-radius:4px;padding:8px}figcaption{padding:4px 6px}</style><div class="g">${cells.join('')}</div>`);
  await p.screenshot({ path: path.join(__dirname, 'sheet.png'), fullPage: true });
  await b.close(); console.log('rendered');
})();
