// Records the trailer shots from the real game (run with the preview server up on :4173):
//   node art/trailer/record.cjs <dir> [shot names...]   → <dir>/<shot>.mp4, 3840×2160 30 fps masters
// The page renders at 2.4× zoom (CSS 1600×900) and runs 4× slower (CSS animations, Web Animations and setTimeout),
// so the CDP screencast's ~15 fps becomes 60; the footage is sped back up. A 1 px animated pixel keeps frames coming on still screens.
// Records trailer shots from the real game at 3840×2160 (1920×1080 at 2×) with the CDP screencast,
// then turns each shot into a constant 30 fps master. Prints a timeline of marks per shot for the edit.
const { chromium } = require('playwright');
const fs = require('fs'); const { execFileSync } = require('child_process');
const OUT = require('path').resolve(process.argv[2]); const ONLY = process.argv.slice(3);
const K = 4; // the page runs K× slower while recording; the footage is sped back up
const dice = s => [...s].map(f => ({ face: f, used: null }));
const hunt = (mon, su) => ({ mon, su });
const huntSteps = n => { const a = []; for (let i = 0; i < n; i++) a.push('1', 'w150', '2', 'w150', '3', 'w150', '4', 'w500', 'g', 'w900', 'mark', ' ', 'w2600'); return a; };
const SHOTS = {
  gore: { hunt: hunt('gorehorn', { intent: 'windup', dice: 'CCTB', turn: 3, target: 'hide', script: { 4: 'CCTT' } }),
    steps: ['w3000', 'mark', 'e', 'w1100', '4', 'w300', 'g', 'w1400', 'mark', ' ', 'w3200', 'mark', '1', 'w250', '2', 'w250', '3', 'w250', '4', 'w600', 'g', 'w2000', 'mark', ' ', 'w3500'] },
  brk: { hunt: hunt('gorehorn', { intent: 'jab', dice: 'CCTB', turn: 6, target: 'hide', parts: { hide: 30 }, script: { 7: 'CCTB' } }),
    steps: ['w1800', 'mark', '4', 'w600', 'r', 'w1600', 'mark', 'e', 'w3500', 'g', 'w600', 'mark', ' ', 'w2500'] }, // guard the spare die: ending with dice unspent now asks to confirm
  gale: { hunt: hunt('galeshrike', { intent: 'takeoff', dice: 'CCTB', turn: 3, target: 'wings', php: 180, script: {} }),
    steps: ['w2500', ...huntSteps(5), 'w1500'] },
  cinder: { hunt: hunt('cinderback', { intent: 'burrow', dice: 'CCTB', turn: 3, target: 'plate', script: { 4: 'CCTT' } }),
    steps: ['w2000', 'mark', 'e', 'w1000', 'mark', ' ', 'w3800', 'mark', '4', 'w300', 's', 'w1300', 'mark', 'w', 'w3800', 'mark', ' ', 'w3000'] },
  rime: { hunt: hunt('rimetail', { intent: 'pounce', dice: 'CCTT', turn: 3, target: 'tail', mon: { plating: 2 }, script: { 4: 'CCTB' } }),
    steps: ['w2200', 'mark', 'q', 'w2200', 'mark', '2', 'w200', '3', 'w200', '4', 'w400', 'g', 'w1400', 'mark', ' ', 'w3000'] }, // guard the spare dice (see brk)
  forge: { forge: true, steps: ['w1200', 'click:.fnode:has-text("Tuskbreaker")', 'w1800', 'mark', 'click:[data-coach="forge-act"]', 'w3000'] },
  board: { board: true, steps: ['w800', 'mark', 'click:.mrow[data-id="gorehorn"]', 'w700', 'mark', 'click:.mrow[data-id="galeshrike"]', 'w700', 'mark', 'click:.mrow[data-id="cinderback"]', 'w700', 'mark', 'click:.mrow[data-id="rimetail"]', 'w1200'] }
};
(async () => {
  const b = await chromium.launch();
  for (const [name, sh] of Object.entries(SHOTS)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    const ctx = await b.newContext({ viewport: { width: 3840, height: 2160 } }); const p = await ctx.newPage();
    await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.sub .build{display:none!important}'; document.head.appendChild(s); })); // no build version on collateral
    await p.addInitScript(K => { const st = window.setTimeout; window.__slow = 1; window.setTimeout = (f, d, ...a) => st(f, (d || 0) * window.__slow, ...a); const z = () => { document.documentElement.style.zoom = '2.4'; }; if (document.documentElement) z(); document.addEventListener('DOMContentLoaded', () => { z(); const k = document.createElement('div'); k.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;background:#000;z-index:99999;pointer-events:none;animation:kf 0.1s linear infinite alternate'; const st2 = document.createElement('style'); st2.textContent = '@keyframes kf{to{opacity:.02}}'; document.head.append(st2); document.body.append(k); }); }, K);
    await p.goto('http://localhost:4173/'); await p.waitForTimeout(400); await p.click('[data-coach="begin"]').catch(() => {}); await p.waitForTimeout(300);
    // a save past the tutorial (every tip seen), quiet settings (6 Nov 2026: the old menu path to get here is gone)
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('huntersfolio-save'));
      s.tips = ['begin','g-next','g-hp','aim','move','g-blank','guard','end','g-pick','reroll','g-free','windup','charge','swap','open','mud','enraged','item','capture','forge','track','bounties','broke','sell']; s.loadout = { ...s.loadout, bounty: null };
      localStorage.setItem('huntersfolio-save', JSON.stringify(s)); localStorage.removeItem('huntersfolio-hunt');
      localStorage.setItem('huntersfolio-settings', JSON.stringify({ music: 0, sfx: 0, fullscreen: false, uiSize: 1, tips: false })); });
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); s.record.gorehorn = { hunts: 3, wins: 2, captures: 1, breaks: {} }; s.record.galeshrike = { hunts: 1, wins: 1, captures: 0, breaks: {} }; s.mats = { ...s.mats, tusk: 3, hide: 2, sinew: 1 }; s.coin = 640; s.tracked = null; s.hunts = 4; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(400);
    if (sh.hunt) {
      await p.click('[data-coach="nav-board"]').catch(() => {});
      await p.click(`.mrow[data-id="${sh.hunt.mon}"]`); await p.click('[data-coach="begin"]'); await p.waitForTimeout(500);
      await p.evaluate(([su, d]) => {
        const h = JSON.parse(localStorage.getItem('huntersfolio-hunt'));
        h.intent = su.intent; h.dice = d; h.turn = su.turn; h.target = su.target; h.log = []; if (su.php) h.php = su.php;
        h.script = []; for (const [k, v] of Object.entries(su.script)) h.script[+k - 1] = [...v];
        Object.assign(h.mon, su.mon || {}); for (const [k, v] of Object.entries(su.parts || {})) h.mon.parts[k].hp = v;
        localStorage.setItem('huntersfolio-hunt', JSON.stringify(h));
      }, [sh.hunt.su, dice(sh.hunt.su.dice)]);
    }
    if (sh.forge) { await p.click('[data-coach="nav-forge"]'); }
    if (sh.board) { await p.click('[data-coach="nav-board"]').catch(() => {}); }
    await p.reload(); await p.waitForTimeout(700); await p.mouse.move(3830, 2150);
    if (sh.forge) await p.click('[data-coach="nav-forge"]').catch(() => {});
    const dir = `${OUT}/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const cdp = await ctx.newCDPSession(p); const frames = []; let t0 = null;
    cdp.on('Page.screencastFrame', async f => {
      const ts = f.metadata.timestamp; if (t0 == null) t0 = ts;
      const fn = `${dir}/f${String(frames.length).padStart(5, '0')}.jpg`; fs.writeFileSync(fn, Buffer.from(f.data, 'base64')); frames.push([fn, ts]);
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / K }); await p.evaluate(K => (window.__slow = K), K);
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 3840, maxHeight: 2160 });
    await p.waitForTimeout(300);
    const marks = []; const now = () => (Date.now() / 1000);
    const wallStart = now(); await p.waitForTimeout(50);
    for (const s of sh.steps) {
      if (s === 'mark') marks.push(+(now() - wallStart).toFixed(2));
      else if (/^w\d+$/.test(s)) await p.waitForTimeout(+s.slice(1) * K);
      else if (s.startsWith('click:')) await p.$eval(s.slice(6), e => e.click());
      else if (s.startsWith('hover:')) await p.hover(s.slice(6));
      else await p.keyboard.press(s);
    }
    await cdp.send('Page.stopScreencast'); await p.waitForTimeout(200);
    // the first frame arrives ~when the screencast starts; offset the marks by the gap between wallStart and the first frame
    const off = wallStart - t0;
    const list = frames.map(([fn, ts], i) => `file '${fn}'\nduration ${((frames[i + 1]?.[1] ?? ts + 1 / 30) - ts).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1)[0]}'\n`;
    fs.writeFileSync(`${dir}/list.txt`, list);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', `setpts=PTS/${K},fps=30,format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', `${OUT}/${name}.mp4`]);
    if (name === 'forge') console.log('weapons', await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('huntersfolio-save')).weapons)), await p.evaluate(() => document.querySelector('[data-coach="forge-act"]')?.outerHTML.slice(0, 200)));
    const st = await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('huntersfolio-hunt') || 'null'); return h ? `${h.turn} ${h.intent} | ${h.log.slice(0, 6).map(l => l.t).join(' / ')}` : 'no hunt'; });
    console.log(name, 'frames', frames.length, 'len', ((frames.at(-1)[1] - t0) / K).toFixed(1), 'marks', marks.map(m => +((m + off) / K).toFixed(2)).join(','), '|', st);
    fs.rmSync(dir, { recursive: true, force: true });
    await ctx.close();
  }
  await b.close();
})();
