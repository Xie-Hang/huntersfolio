// Captures the in-game woodcut plates in chosen poses as transparent PNGs (for achievement icons and other art).
//   node art/ach2/capture.cjs   (preview server on :4173)   → art/ach2/poses/<name>.png
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, 'poses'); fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv.slice(2);
const POSES = {
  gore_down: ['gorehorn', { intent: 'jab', over: 'win' }],
  gore_dazed: ['gorehorn', { intent: 'dazed' }],
  gore_tense: ['gorehorn', { intent: 'charge' }],
  gale_stuck: ['galeshrike', { intent: 'stuck' }],
  cinder_dazed: ['cinderback', { intent: 'unearthed' }],
  cinder_broken: ['cinderback', { intent: 'swipe', seq: 0, broke: ['plate', 'claws', 'vents'] }],
  rime_bare: ['rimetail', { intent: 'pounce', mon: { plating: 0 } }],
  rime_ice: ['rimetail', { intent: 'pounce', mon: { plating: 2 } }],
  bog_digest: ['bogjaw', { intent: 'digest', mon: { gut: 2, gutHp: 30 } }],
  dusk_reel: ['duskheron', { intent: 'upper:peck|lower:peck', mon: { reel: { upper: 2, lower: 2 } } }],
  whelk_idle: ['emberwhelk', { intent: 'spit' }],
  mist_images: ['mistglass', { intent: 'rake', mon: { mirage: 2 } }]
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await p.goto('http://localhost:4173/'); await p.waitForTimeout(300); await p.click('.coach-skip');
  await p.click('[data-coach="nav-forge"]'); await p.click('[data-coach="track"]'); await p.click('[data-coach="track"]');
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} }; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); });
  const cdp = await p.context().newCDPSession(p); await cdp.send('Animation.enable');
  for (const [name, [mon, st]] of Object.entries(POSES)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    await p.evaluate(() => localStorage.removeItem('huntersfolio-hunt'));
    await p.reload(); await p.waitForTimeout(250);
    await p.click(`.mrow[data-id="${mon}"]`); await p.click('[data-coach="begin"]'); await p.waitForTimeout(300);
    await p.evaluate(st => {
      const h = JSON.parse(localStorage.getItem('huntersfolio-hunt')); h.intent = st.intent; h.target = '__none';
      Object.assign(h.mon, st.mon || {}); for (const k of st.broke || []) h.mon.parts[k].broken = true;
      if (st.over) { h.over = st.over; h.mon.hp = 0; }
      localStorage.setItem('huntersfolio-hunt', JSON.stringify(h));
    }, st);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await p.reload(); await p.waitForTimeout(1600);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await p.addStyleTag({ content: '.plate{background:transparent!important;border-color:transparent!important} body,html{background:transparent!important} svg.wc > path:first-of-type{opacity:0} svg.scene{display:none!important}' });
    const el = await p.$('.plate svg.wc');
    await el.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: true });
    console.log(name);
  }
  await b.close();
})();
