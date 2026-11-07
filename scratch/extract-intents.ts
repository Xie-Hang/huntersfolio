// Every monster move as the next-move card shows it: name, story line, note, tip. Usage: npx tsx scratch/extract-intents.ts out.json
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import * as E from '../src/engine';
const save = JSON.parse(readFileSync('qa/fixtures/midgame.json', 'utf8')).save;
const rows: any[] = []; const seen = new Set<string>();
for (const [id, M] of Object.entries(E.MONSTERS) as any) {
  const src = readdirSync('src/engine/data/monsters').filter(f => f === id + '.ts').map(f => readFileSync('src/engine/data/monsters/' + f, 'utf8'))[0] ?? '';
  const types = [...new Set([...src.matchAll(/case '(\w+)'/g)].map(m => m[1]))];
  for (const enr of [false, true]) for (const air of [false, true]) {
    const s = structuredClone(save); s.loadout.target = id;
    let h: any; try { h = E.startHunt(s, 3); } catch { continue; }
    h.mon.enraged = enr; if (air) { h.mon.air = true; h.mon.tailwind = true; h.mon.plating = 2; h.mon.charges = 2; h.mon.wind = 2; }
    for (const t of types) {
      let i: any, tip: any = null;
      try { i = M.intent(h, t); } catch { continue; }
      if (!i || !i.name) continue;
      h.intent = t; try { tip = M.tip?.(h, t) ?? null; } catch {}
      const key = [id, i.name, i.text, i.note ?? '', tip ?? ''].join('|');
      if (seen.has(key)) continue; seen.add(key);
      rows.push({ mon: M.name, id, type: t, enraged: enr, name: i.name, text: i.text, note: i.note ?? '', tip: tip ?? '' });
    }
  }
}
writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
console.log(rows.length, 'rows,', new Set(rows.map(r => r.note).filter(Boolean)).size, 'distinct notes,', new Set(rows.map(r => r.tip).filter(Boolean)).size, 'distinct tips');
