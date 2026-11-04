// QA: every screen at common PC resolutions (and the Steam Deck), at 100% and 130% interface size.
// Reports sideways scrolling, text cut off inside its box, and things that run off the window; saves screenshots.
//   node qa/screens.cjs [outdir]
const { chromium } = require('playwright'); const fs = require('fs');
const OUT = process.argv[2] || 'qa/out/screens'; fs.mkdirSync(OUT, { recursive: true });
const SIZES = [[1280, 720], [1280, 800], [1366, 768], [1920, 1080], [2560, 1440]];
const ZOOMS = [1, 1.3];
const report = [];
const measure = p => p.evaluate(() => {
  const de = document.documentElement, out = [];
  if (de.scrollWidth > de.clientWidth + 1) out.push(`page scrolls sideways by ${de.scrollWidth - de.clientWidth}px`);
  for (const el of document.querySelectorAll('button, .btn, h1, h2, h3, .label, .kicker, .tag, .nm, .mrow, .fnode, .move, .die, td, th, .stat span')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || !el.offsetParent) continue;
    if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') out.push(`cut off: <${el.tagName.toLowerCase()} class="${el.className}"> "${(el.textContent || '').trim().slice(0, 40)}"`);
    const r = el.getBoundingClientRect(); if (r.right > innerWidth + 1) out.push(`runs off the right edge: "${(el.textContent || '').trim().slice(0, 40)}"`);
  }
  return [...new Set(out)];
});
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of SIZES) for (const z of ZOOMS) {
    // Interface size in the desktop app is Electron page zoom: the layout sees a smaller window at a higher pixel density
    const p = await b.newPage({ viewport: { width: Math.round(w / z), height: Math.round(h / z) }, deviceScaleFactor: z });
    await p.goto('http://localhost:4173/'); await p.waitForTimeout(300);
    await p.click('.coach-skip').catch(() => {});
    await p.click('[data-coach="nav-forge"]'); await p.click('[data-coach="track"]'); await p.click('[data-coach="track"]');
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); s.record.gorehorn = { hunts: 1, wins: 1, captures: 0, breaks: {} }; s.mats = { tusk: 3, hide: 2 }; s.coin = 900; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(300);
    const tag = `${w}x${h}@${z * 100}`;
    const shots = {
      board: async () => p.click('[data-coach="nav-board"]'),
      forge: async () => { await p.click('[data-coach="nav-forge"]'); await p.click('.fnode:has-text("Tuskbreaker")'); },
      shop: async () => p.click('[data-coach="nav-shop"]'),
      hunt: async () => { await p.click('[data-coach="nav-board"]'); await p.click('.mrow[data-id="cinderback"]'); await p.click('[data-coach="begin"]'); },
      danger: async () => { await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.intent = 'erupt'; h.mon.under = true; localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); }); await p.reload(); },
      settings: async () => p.click('button[aria-label="Settings"]'),
      help: async () => { await p.keyboard.press('Escape'); await p.click('button[aria-label="How to play"]'); }
    };
    for (const [name, go] of Object.entries(shots)) {
      try { await go(); await p.waitForTimeout(350); } catch (e) { report.push(`${tag} ${name}: couldn't open (${e.message.split('\n')[0]})`); continue; }
      await p.evaluate(() => window.scrollTo(0, 0)); const found = await measure(p);
      for (const f of found) report.push(`${tag} ${name}: ${f}`);
      await p.screenshot({ path: `${OUT}/${tag}-${name}.png` });
    }
    await p.close();
  }
  fs.writeFileSync(`${OUT}/report.txt`, report.join('\n') + '\n');
  console.log(report.length ? report.join('\n') : 'no problems found');
  await b.close();
})();
