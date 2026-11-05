// Cuts the trailer from the recorded shots and the cards, on a 90 BPM grid (one bar = 2.667 s).
//   node art/trailer/edit.mjs <dir with shots/*.mp4 and cards/*.png> <out.mp4>
// Crops are in the 3840×2160 source (the page renders at 2.4× zoom, so CSS px × 2.4).
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [DIR, OUT] = process.argv.slice(2).map(p => resolve(p));
const SEG = join(DIR, 'seg'); mkdirSync(SEG, { recursive: true });
const BAR = 8 / 3;
// Re-measured 6 Nov 2026 for the current hunt layout (plate top-left of the stage, telegraph beside it), each 16:9:
//   plate = the monster art, tele = the telegraph panel, wide = the play area below the header, page = with the header.
const C = {
  plate: [828, 486, 884, 498], tele: [1659, 448, 990, 557], wide: [288, 290, 3264, 1836], page: [288, 43, 3264, 1836]
};
// [kind, source, in, out, crop, zoomFrom, zoomTo]; card: ['card', name, seconds]
const EDIT = [
  ['shot', 'gore', 0.2, 0.2 + BAR, 'plate', 1.0, 1.08],            // cold open: it's winding up
  ['shot', 'gore', 0.3, 0.3 + BAR, 'tele', 1.0, 1.05],             // ...and says so
  ['card', 'c1', BAR],
  ['shot', 'gore', 5.6, 5.6 + 3 * BAR, 'wide', 1.0, 1.06],         // the charge: −70, guard every die, −38
  ['card', 'c2', BAR],
  ['shot', 'brk', 1.4, 1.4 + 2.5 * BAR, 'wide', 1.0, 1.05],        // reroll, Rend, the hide tears
  ['card', 'c3', BAR],
  ['shot', 'forge', 1.0, 1.0 + 1.5 * BAR, 'page', 1.0, 1.04],      // the Maul becomes the Tuskbreaker
  ['card', 'c5', BAR],
  ['shot', 'gale', 2.4, 5.0, 'wide', 1.02, 1.0],                   // Galeshrike takes off...
  ['shot', 'gale', 13.0, 14.7, 'wide', 1.0, 1.0],                  // ...circles, lines up a dive...
  ['shot', 'gale', 17.2, 17.2 + 2.5 * BAR - 4.3, 'wide', 1.0, 1.04], // ...hits, beak stuck in the ground
  ['shot', 'cinder', 1.8, 4.6, 'wide', 1.0, 1.0],                  // Cinderback digs in
  ['shot', 'cinder', 5.6, 5.6 + 2.5 * BAR - 2.8, 'wide', 1.0, 1.05], // the ground glows; swap, Smash, up it comes
  ['shot', 'rime', 1.9, 1.9 + 2 * BAR, 'wide', 1.0, 1.05],         // one Cut and the ice is gone
  ['shot', 'board', 0.7, 0.7 + BAR, 'page', 1.0, 1.03],            // four monsters
  ['card', 'end', 3 * BAR]
];
const parts = [];
EDIT.forEach((e, i) => {
  const out = join(SEG, `s${String(i).padStart(2, '0')}.mp4`); parts.push(out);
  const enc = ['-an', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', out];
  if (e[0] === 'card') {
    const d = e[2], end = e[1] === 'end';
    const vf = `scale=1920:1080,fade=t=in:st=0:d=${end ? 0.6 : 0.25},fade=t=out:st=${(d - (end ? 1.4 : 0.2)).toFixed(3)}:d=${end ? 1.4 : 0.2}`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-t', d.toFixed(4), '-i', join(DIR, 'cards', `${e[1]}.png`), '-vf', vf, ...enc]);
  } else {
    const [, src, a, b, crop, z0, z1] = e, d = b - a, [x, y, w, h] = C[crop];
    const Z = `(${z0}+(${z1 - z0})*t/${d.toFixed(4)})`;
    const vf = `crop=${w}:${h}:${x}:${y},scale=w='trunc(1920*${Z}/2)*2':h='trunc(1080*${Z}/2)*2':eval=frame:flags=lanczos,crop=1920:1080:(in_w-1920)/2:(in_h-1080)/2,setsar=1` + (i === 0 ? ',fade=t=in:st=0:d=0.5' : '');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', a.toFixed(4), '-t', d.toFixed(4), '-i', join(DIR, `${src}.mp4`), '-vf', vf, ...enc]);
  }
});
writeFileSync(join(SEG, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(SEG, 'list.txt'), '-c', 'copy', OUT]);
let t = 0; for (const e of EDIT) { const d = e[0] === 'card' ? e[2] : e[3] - e[2]; console.log(t.toFixed(2).padStart(6), e[0], e[1], d.toFixed(2)); t += d; }
console.log('total', t.toFixed(2));
