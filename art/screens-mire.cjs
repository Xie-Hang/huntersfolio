// Store screenshots of the full game beyond the demo: Mirewood and the bounty board. Same format as screens.cjs
// (16:9, 3840x2160 from a 1600x900 layout at 2.4x, tips off). Needs the FULL build on the preview server.
//   npx vite build && npx vite preview --port 4173 · node art/screens-mire.cjs → art/screens/screenshot_7..10.png
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'screens') + '/'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2.4 });
  await p.goto('http://localhost:4173/'); await p.waitForTimeout(300);
  await p.click('[data-coach="begin"]'); await p.waitForTimeout(300); // writes a save to start from
  const T1 = { gorehorn: { tusks: 3, hide: 4, legs: 2 }, galeshrike: { wings: 2, talons: 1 }, cinderback: { plate: 2, claws: 1 }, rimetail: { tail: 2, mantle: 1 } };
  const setup = async (loadout, extra = {}) => {
    await p.evaluate(([loadout, extra, T1]) => {
      const s = JSON.parse(localStorage.getItem('huntersfolio-save'));
      s.coin = 1240; s.hunts = 21; s.tips = ['begin', 'aim', 'move', 'guard', 'end', 'reroll'];
      s.record = Object.fromEntries(Object.entries(T1).map(([k, br]) => [k, { hunts: 4, wins: 3, captures: 1, breaks: br }]));
      s.record.bogjaw = { hunts: 2, wins: 1, captures: 0, breaks: { sac: 1 } };
      s.weapons = { blade: { lv: 1 }, tusk: { lv: 2 }, crusher: { lv: 1 }, bow: { lv: 1 }, windbow: { lv: 1 }, kiln: { lv: 1 }, cinderedge: { lv: 2 }, rimehammer: { lv: 1 }, bogcleaver: { lv: 0 } };
      s.armors = { jerkin: { lv: 1 }, vest: { lv: 2 }, kilnplate: { lv: 1 }, coat: { lv: 1 }, rimehide: { lv: 1 }, bogcoat: { lv: 0 } };
      s.charms = { tuskcharm: true, kilncharm: true, bogcharm: true };
      s.bounties = { gore1: true, gore2: true, gale1: true, cind1: true, rime2: true };
      Object.assign(s.mats, { hide: 6, tusk: 4, bogskin: 5, throatsac: 1, seal: 5 });
      s.items.salve = 4; s.items.smoke = 2;
      s.loadout = { ...s.loadout, ...loadout }; Object.assign(s, extra);
      localStorage.setItem('huntersfolio-save', JSON.stringify(s));
      localStorage.removeItem('huntersfolio-hunt');
      for (const k of ['settings', 'huntersfolio-settings']) localStorage.setItem(k, JSON.stringify({ music: 0, sfx: 0, fullscreen: false, uiSize: 1, tips: false }));
    }, [loadout, extra, T1]);
    await p.reload(); await p.waitForTimeout(400);
  };
  const shot = async n => { await p.waitForTimeout(1200); await p.mouse.move(2, 2); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}screenshot_${n}.png` }); console.log('shot', n); };
  const ends = async k => { for (let i = 0; i < k; i++) { await p.keyboard.press(' '); await p.waitForTimeout(650); } };
  const hunt = async patch => {
    await p.click('[data-coach="begin"]'); await p.waitForTimeout(500);
    if (patch) { await p.evaluate(patch => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); Object.assign(h, patch.h || {}); Object.assign(h.mon, patch.mon || {}); localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); }, patch); await p.reload(); await p.waitForTimeout(500); }
  };

  // 7 · Duskheron: two heads, two telegraphs; the upper head is reeling from a maul blow
  await setup({ target: 'duskheron', weapons: ['crusher', 'bow'], armor: 'coat', item: 'salve', bounty: null });
  await hunt({ h: { intent: 'upper:thrust|lower:thrust', turn: 4, target: 'upper' }, mon: { hp: 352, reel: { upper: 2, lower: 0 }, headDaze: { upper: 0, lower: 30 } } });
  { const m = await p.$('.move.ready[data-coach="move"]'); if (m) await m.click(); }
  await shot(7);

  // 8 · Mistglass: mirror images up, a bounty taken (its goals under Your HP)
  await setup({ target: 'mistglass', weapons: ['cinderedge', 'kiln'], armor: 'rimehide', item: 'salve', bounty: 'mist1' });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); s.record.mistglass = { hunts: 2, wins: 1, captures: 0, breaks: {} }; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(300);
  await hunt({ h: { intent: 'pounce', turn: 5, target: 'eyes' }, mon: { hp: 391, mirage: 2 } });
  { const m = await p.$('.move.ready[data-coach="move"]'); if (m) await m.click(); }
  await shot(8);

  // 9 · Emberwhelk: the gills are healing it, slime is burning you
  await setup({ target: 'emberwhelk', weapons: ['bow', 'tusk'], armor: 'kilnplate', item: 'salve', bounty: null });
  await hunt({ h: { intent: 'rear', turn: 6, target: 'gills', php: 141 }, mon: { hp: 288, slime: 1, enraged: false } });
  await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.mon.parts.gills.hp = 46; h.mon.parts.gills.exposed = 2; localStorage.setItem('huntersfolio-hunt', JSON.stringify(h)); });
  await p.reload(); await p.waitForTimeout(500);
  await shot(9);

  // 10 · Hunt Board: Mirewood open, the Bogjaw's bounties
  await setup({ target: 'bogjaw', weapons: ['bogcleaver', 'tusk'], armor: 'bogcoat', item: 'salve', bounty: 'bog1' });
  await p.evaluate(() => document.querySelector('.bounties')?.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(1200); await p.mouse.move(2, 2); await p.waitForTimeout(150);
  await p.screenshot({ path: `${OUT}screenshot_10.png` }); console.log('shot', 10);
  await b.close();
})();
