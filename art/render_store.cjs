const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => { const b = await chromium.launch(); fs.mkdirSync(path.join(__dirname, 'store', 'png'), { recursive: true }); const dir = path.join(__dirname, 'store', 'svg');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8'); const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/).map(Number);
    const p = await b.newPage({ viewport: { width: w, height: h } }); const jpg = f.startsWith('app_icon_184'); await p.setContent(`<body style="margin:0;background:${jpg ? '#14100d' : 'transparent'}">${svg}</body>`);
    await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: path.join(__dirname, 'store', 'png', f.replace('.svg', jpg ? '.jpg' : '.png')), omitBackground: !jpg, type: jpg ? 'jpeg' : 'png', quality: jpg ? 95 : undefined }); await p.close();
  } await b.close(); })();
