// Plays real hunts with the sim bot until each store screenshot's moment, and writes the hunt + save to JSON.
import * as E from '../../src/engine';
import { playTurn } from '../../src/sim/bot';
import { writeFileSync } from 'fs';
type Shot = { name: string; target: string; weapons: [string, number][]; armor: string; item: string; when: (h: E.Hunt) => boolean };
const SHOTS: Shot[] = [
  { name: '1-gorehorn-windup', target: 'gorehorn', weapons: [['crusher', 2], ['saber', 2]], armor: 'vest', item: 'salve', when: h => h.intent === 'windup' && h.turn >= 4 && Object.values(h.mon.parts).some(p => p.broken) },
  { name: '2-galeshrike-air', target: 'galeshrike', weapons: [['windbow', 2], ['gale', 2]], armor: 'coat', item: 'net', when: h => h.mon.air && h.intent === 'gust' && h.turn >= 4 },
  { name: '3-duskheron-rear', target: 'duskheron', weapons: [['rimehammer', 3], ['rimeshot', 3]], armor: 'duskcoat', item: 'salve', when: h => h.intent === 'rear' && h.turn >= 4 },
  { name: '4-gorhydra', target: 'gorhydra', weapons: [['whelkedge', 3], ['pearlhammer', 3]], armor: 'hydracoat', item: 'salve', when: h => h.turn >= 5 && h.mon.hp < h.mon.max * 0.8 && h.intent.includes('|') },
  { name: '5-sovereign', target: 'sovereign', weapons: [['slaghammer', 2], ['monolithbow', 2]], armor: 'sovmantle', item: 'salve', when: h => h.turn >= 6 && h.mon.stance !== 'bare' && Object.values(h.mon.parts).some(p => p.broken) && h.mon.hp < h.mon.max * 0.7 },
  { name: '6-rotcap-bloom', target: 'rotcap', weapons: [['rotmaul', 1], ['tempestbow', 2]], armor: 'vest', item: 'purge', when: h => (h.intent === 'bloom' || h.intent === 'burst') && ((h.mon.pInf ?? 0) > 0 || (h.mon.sm?.Infect ?? 0) > 0) },
];
const ALL = Object.keys(E.MONSTERS);
for (const sh of SHOTS) {
  let found: E.Hunt | null = null;
  for (let seed = 1; seed < 400 && !found; seed++) {
    const s = E.newSave();
    for (const id of ALL) s.record[id] = { hunts: 3, wins: 2, captures: 0, breaks: {} };
    s.weapons = Object.fromEntries(sh.weapons.map(([id, lv]) => [id, { lv }]));
    s.armors = { [sh.armor]: { lv: 2 } }; s.items = { ...s.items, [sh.item]: 2, salve: 2 };
    s.loadout = { ...s.loadout, weapons: sh.weapons.map(w => w[0]), armor: sh.armor, item: sh.item, target: sh.target, bounty: null };
    const h = E.startHunt(s, seed * 101);
    for (let t = 0; t < 30 && !h.over; t++) {
      if (sh.when(h) && h.php > h.pmax * 0.4 && h.mon.hp > h.mon.max * 0.35 && h.mon.hp < h.mon.max * 0.85) { found = h; break; }
      playTurn(h, { skill: 'skilled', capture: false }); if (!h.over) E.endTurn(h);
    }
    if (found) { writeFileSync(`art/store/${sh.name}.json`, JSON.stringify({ hunt: found, save: s })); console.log(sh.name, 'seed', seed, 'turn', found.turn, found.intent, `${found.mon.hp}/${found.mon.max}`, `you ${found.php}/${found.pmax}`); }
  }
  if (!found) console.log(sh.name, 'NOT FOUND');
}
