// The Gustmarmot — the Foothills, steps 9 and 11 (the tutorial island, Nov 2026). A marmot whose whistle calls the
// wind. It teaches wind-ups and Charge: it whistles (a safe turn: nothing hits you), then gusts hard the turn after,
// so the whistle is the moment to Charge. Below half HP it's Enraged and its gust hits harder. Its second hunt always
// drops a Gale Gland (rare), the last thing the Whistling Blade needs. Gale; weak to Stone.
import type { Intent, MonsterDef } from '../../types';

export const gustmarmot: MonsterDef = {
  id: 'gustmarmot',
  name: 'The Gustmarmot',
  short: 'Gustmarmot',
  kind: 'Whistling marmot',
  elem: 'Gale',
  weak: 'Stone',
  resist: 'Frost',
  hp: 170,
  tier: 0.5,
  requires: 'tuskling',
  island: { dice: 4, faces: ['C', 'C', 'T', 'T', 'B', 'B'] },
  head: 'cheeks',
  common: 'marmotfur',
  rarePart: 'cheeks',
  rare: 'galegland',
  habits: 'Nips twice, then whistles: the wind it calls hits hard the turn after. Hurt badly, it gets angry and the gust hits harder.',
  intro: 'A Gustmarmot sits up on a rock and whistles. The grass flattens.',
  enrageText: 'It puffs up its cheeks, furious. The Gustmarmot is enraged!',
  parts: [
    { id: 'cheeks', name: 'Cheeks', eff: { Cut: 0.5, Blunt: 1, Pierce: 0.5 }, hint: 'Break it for a Gale Gland (rare)', mat: 'marmotfur', hp: 70, brk: 'Its cheeks deflate with a squeak.' },
    { id: 'fur', name: 'Fur', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Break it for its fur', mat: 'marmotfur', hp: 80, brk: 'A tuft of fur tears away.' }
  ],

  intent(h, type): Intent {
    const enr = h.mon.enraged;
    switch (type) {
      case 'nip': return { name: 'Nip', text: 'It darts in and nips.', dmg: 16, threat: 1 };
      case 'whistle': return { name: 'Whistle', text: 'It puffs its cheeks and whistles. The wind gathers.', dmg: 0, threat: 0, note: 'Gusts next turn. Nothing hits you this turn: a safe turn to Charge' };
      case 'gust': return { name: enr ? 'Howling Gust' : 'Gust', text: enr ? 'The wind howls straight at you.' : 'A wall of wind hits you.', dmg: enr ? 50 : 40, threat: 3 };
      case 'dazed': return { name: 'Dazed', text: 'It wobbles, dizzy.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },
  next(_h, prev) {
    if (prev === 'whistle') return 'gust';
    const t = ['nip', 'nip', 'whistle'][_h.mon.seq % 3]; _h.mon.seq++; return t;
  },
  resolve(_h, type) { return type === 'whistle' ? 'The wind gathers around it.' : null; }
};
