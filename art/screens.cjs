// Store screenshots from the real game: 16:9, rendered at 3840x2160 (1600x900 layout, 2.4x), tips off.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'screens') + '/'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2.4 });
  await p.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.sub .build{display:none!important}'; document.head.appendChild(s); })); // no build version on collateral
  await p.goto('http://localhost:4173/'); await p.waitForTimeout(300);
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(300); // writes a save to start from
  const setup = async (loadout, extra = {}) => {
    await p.evaluate(([loadout, extra]) => {
      const s = JSON.parse(localStorage.getItem('huntersfolio-save'));
      s.coin = 860; s.hunts = 6; s.tips = ['begin', 'aim', 'move', 'guard', 'end', 'reroll'];
      s.record = { gorehorn: { hunts: 4, wins: 3, captures: 1, breaks: { tusks: 2, hide: 3, legs: 1 } }, galeshrike: { hunts: 1, wins: 1, captures: 0, breaks: { wings: 1 } } };
      s.weapons = { blade: { lv: 1 }, tusk: { lv: 1 }, bow: { lv: 0 }, windbow: { lv: 0 }, ridgecleaver: { lv: 0 }, boulder: { lv: 0 } };
      s.armors = { jerkin: { lv: 1 }, vest: { lv: 0 } };
      Object.assign(s.mats, { hide: 5, tusk: 3, pelt: 4, sinew: 2, plume: 3, pinion: 1, heartstone: 1 });
      s.items.salve = 4; s.items.net = 2; s.items.firepot = 2;
      s.loadout = { ...s.loadout, ...loadout }; Object.assign(s, extra);
      localStorage.setItem('huntersfolio-save', JSON.stringify(s));
      localStorage.removeItem('huntersfolio-hunt');
      localStorage.setItem('huntersfolio-settings', JSON.stringify({ music: 0, sfx: 0, fullscreen: false, uiSize: 1, tips: false }));
    }, [loadout, extra]);
    await p.reload(); await p.waitForTimeout(400);
  };
  const shot = async n => { await p.waitForTimeout(1200); await p.mouse.move(2, 2); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}screenshot_${n}.png` }); console.log('shot', n); };
  const ends = async k => { for (let i = 0; i < k; i++) { await p.keyboard.press(' '); await p.waitForTimeout(650); } };

  // 1 · Gorehorn: the Trampling Charge telegraph, mid-turn, a move used and dice on guard
  await setup({ target: 'gorehorn', weapons: ['blade', 'tusk'], armor: 'vest', item: 'salve' });
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(600);
  await p.click('.part:has-text("Hide")');
  // play turns until the charge itself is telegraphed (the cycle moved since this was written: don't count turns)
  for (let t = 0; t < 12 && !(await p.locator('h3.mvname', { hasText: 'Trampling Charge' }).count()); t++) { for (let k = 0; k < 3; k++) { const m = await p.$('.move.ready[data-coach="move"]'); if (m) await m.click(); } await ends(1); }
  { const m = await p.$('.move.ready[data-coach="move"]'); if (m) await m.click(); }
  await p.keyboard.press('1'); await p.keyboard.press('2'); await p.keyboard.press('3'); await p.keyboard.press('4');
  await p.keyboard.press('g'); await shot(1);

  // 2 · Galeshrike in the air, bow in hand
  await setup({ target: 'galeshrike', weapons: ['windbow', 'blade'], armor: 'jerkin', item: 'net' });
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(600);
  for (let i = 0; i < 8 && !(await p.$('.chip:has-text("Airborne")')); i++) await ends(1);
  { const m = await p.$('.move.ready[data-coach="move"]'); if (m) await m.click(); }
  await shot(2);

  // 3 · Rimetail with its ice plating, Cut weapon ready
  await setup({ target: 'rimetail', weapons: ['blade', 'tusk'], armor: 'jerkin', item: 'firepot' });
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(600);
  await p.keyboard.press('1'); await shot(3);

  // 4 · Hunt Board with the bestiary and loadout
  await setup({ target: 'gorehorn', weapons: ['blade', 'tusk'], armor: 'vest', item: 'salve' });
  await p.click('.mrow[data-id="cinderback"]'); await shot(4);

  // 5 · Forge: an upgrade with its damage gain
  await p.click('[data-coach="nav-forge"]'); await p.waitForTimeout(300);
  await p.click('.fnode:has-text("Gorehorn Crusher")'); await shot(5);

  // 6 · Cinderback underground
  await setup({ target: 'cinderback', weapons: ['boulder', 'ridgecleaver'], armor: 'vest', item: 'salve' });
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(600);
  for (let i = 0; i < 8 && !(await p.$('.chip:has-text("Underground")')); i++) await ends(1);
  await shot(6);
  await b.close();
})();
