// Store description clips: staged moments from the real game, played through the keyboard and recorded.
// Run with the preview server up (npm run build && npx vite preview --port 4173):
//   node art/clips.cjs art/clips gorehorn cinderback rimetail
// Then cut each webm (start ≈ the "start" time printed; crop is the monster panel + telegraph + dice):
//   MP4 (Steam description video, ≤12 s, 780 wide):
//     ffmpeg -ss 2.4 -t 14.6 -i in.webm -an -vf "crop=982:720:40:128,setpts=PTS/1.25,fps=30,scale=780:-2,format=yuv420p" -c:v libx264 -crf 20 out.mp4
//   GIF fallback (616 wide): same crop/speed, fps=15,scale=616:-1, then palettegen/paletteuse.
// Speed-ups used: gorehorn 1.25 (from 2.4 s, 14.6 s long), cinderback 1.4 (2.3 s, 16.4 s), rimetail 1 (2.3 s, 8.6 s).
const dice = s => [...s].map(f => ({ face: f, used: null }));
const CLIPS = {
  gorehorn: { setup: { intent: 'windup', dice: 'CCTB', script: { 3: 'TTTB', 4: 'CCTT' }, turn: 3, target: 'hide' },
    steps: ['wait1800', 'e', 'wait900', '4', 'wait300', 'g', 'wait1200', ' ', 'wait3000', '1', 'wait250', '2', 'wait250', '3', 'wait250', '4', 'wait500', 'g', 'wait2200', ' ', 'wait3500'] },
  cinderback: { setup: { intent: 'burrow', dice: 'CCTB', script: { 3: 'CTTB', 4: 'CCTT' }, turn: 3, target: 'plate' },
    steps: ['wait1500', 'e', 'wait900', ' ', 'wait3600', '4', 'wait300', 's', 'wait1200', 'w', 'wait1000', 'q', 'wait500', 'e', 'wait3500', ' ', 'wait3500'] },
  rimetail: { setup: { intent: 'pounce', dice: 'CCTT', script: { 3: 'CCTB' }, turn: 3, target: 'tail', mon: { plating: 2 } },
    steps: ['wait1800', 'q', 'wait1800', 'e', 'wait1800', ' ', 'wait3000'] }
};
(async () => {
  const dir = process.argv[2]; const which = process.argv.slice(3);
  const b = await chromium.launch();
  for (const mon of which) {
    const c = CLIPS[mon];
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: `${dir}/st-${mon}`, size: { width: 1440, height: 900 } } });
    const T0 = Date.now(); const p = await ctx.newPage(); const mark = n => console.log(mon, n, ((Date.now() - T0) / 1000).toFixed(2));
    await p.goto('http://localhost:4173/'); await p.waitForTimeout(300); await p.click('.coach-skip');
    await p.click('[data-coach="nav-forge"]'); await p.click('[data-coach="track"]');
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('huntersfolio-save')); s.record.gorehorn = { hunts: 1, wins: 1, captures: 0, breaks: {} }; localStorage.setItem('huntersfolio-save', JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(300);
    await p.click(`.mrow[data-id="${mon}"]`); await p.click('[data-coach="begin"]'); await p.waitForTimeout(500);
    await p.evaluate(([su, d]) => {
      const h = JSON.parse(localStorage.getItem('huntersfolio-hunt'));
      h.intent = su.intent; h.dice = d; h.turn = su.turn; h.target = su.target; h.log = [];
      h.script = []; for (const [k, v] of Object.entries(su.script)) h.script[+k - 1] = [...v];
      Object.assign(h.mon, su.mon || {});
      localStorage.setItem('huntersfolio-hunt', JSON.stringify(h));
    }, [c.setup, dice(c.setup.dice)]);
    await p.reload(); await p.waitForTimeout(600); mark('start');
    for (const s of c.steps) { if (s.startsWith('wait')) await p.waitForTimeout(+s.slice(4)); else { await p.keyboard.press(s); } }
    mark('end');
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('huntersfolio-hunt')));
    console.log(mon, 'now', st.turn, st.intent, JSON.stringify(st.log.slice(0, 8).map(l => l.text || l)));
    await ctx.close();
  }
  await b.close();
})();
