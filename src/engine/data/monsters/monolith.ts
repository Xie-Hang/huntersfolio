// The Monolith Warden — T3 Stone colossus of the Stormspire. The Swap check: it needs both weapons.
// While its stone plates stand, every hit deals ×0.4. Blunt breaks the plates best (Cut at half; the daze part). Broken plates expose
// the core for a few turns: only Pierce reaches it, at ×2. Then the plates Reform (telegraphed) at 60% and the
// cycle repeats. So: hammer to crack, swap, bow into the core, swap back.
//   Knuckle Sweep; Boulder Toss (weaker once its arms break); Rumble → Quake (the big hit, every few turns);
//   Reform. Phase 2 at half HP, Crumbling: the core stays out a turn longer, but Quake comes more often.
// Tuned by simulation (5 Nov 2026, casual, Mirewood gear +2): hammer + bow 86%, hammer + blade 58%, Gale blade + bow
// (weakness) 59%; skilled 100% with anything. 12–15 turns.
// Parts: Stone Plates (Blunt; the daze part; reform), Boulder Arms (Cut; weaker Toss), Core (Pierce; only while
// exposed; rare Warden Core).
import type { Hunt, Intent, MonsterDef } from '../../types';
import { choose, remember } from '../../behaviour';
import { carries, carryingName } from '../../util';

export const PLATED_MULT = 0.4, CORE_MULT = 2, REFORM_AT = 0.6;
const coreTurns = (h: Hunt) => (h.mon.crumble ? 3 : 2);
const quakeEvery = (h: Hunt) => (h.mon.crumble ? 3 : 4);
/** the core is out: from the plates breaking until the Reform resolves */
export const coreOut = (h: Hunt) => (h.mon.core ?? 0) > 0 || h.intent === 'reform';

export const monolith: MonsterDef = {
  id: 'monolith',
  name: 'The Monolith Warden',
  short: 'Monolith Warden',
  kind: 'Phased colossus',
  elem: 'Stone',
  weak: 'Gale',
  resist: 'Ember',
  hp: 700,
  tier: 3,
  requires: ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'],
  head: 'plates',
  common: 'wardenstone',
  rarePart: 'core',
  rare: 'wardencore',
  habits: 'A hunched colossus that walks on its knuckles, plated in slabs of mountain. Its plates turn aside most of every blow; a hammer cracks them, and then its core shows through the crack, for a little while. Bring a hammer and a bow, and know when to swap.',
  intro: 'The ridge shrugs. What you took for a crag turns its head, and a crack of light opens in its chest.',
  enrageText: 'Rubble pours from its shoulders. The Monolith Warden is enraged!',
  parts: [
    { id: 'plates', name: 'Stone Plates', eff: { Cut: 0.5, Blunt: 1, Pierce: 0 }, hint: 'Blunt cracks them best. Broken, they expose the core', mat: 'wardenplate', hp: 90, brk: 'The plates split and fall away. Its core blazes out!' },
    { id: 'arms', name: 'Boulder Arms', eff: { Cut: 1, Blunt: 0.5, Pierce: 0.5 }, hint: 'Break to weaken its Boulder Toss', mat: 'wardenarm', hp: 220, brk: 'Its arm crumbles at the elbow. It can barely throw now.' },
    { id: 'core', name: 'Core', eff: { Cut: 0.5, Blunt: 0, Pierce: 1 }, hint: 'Only while exposed. Pierce deals double', mat: 'coreshard', hp: 180, brk: 'The core cracks. Light leaks from it like water.' }
  ],

  intent(h, type): Intent {
    const m = h.mon, enr = m.enraged;
    switch (type) {
      case 'sweep': return { name: 'Knuckle Sweep', text: 'It swings a fist like a falling wall.', dmg: enr ? 30 : 26, threat: 2 };
      case 'toss': return { name: 'Boulder Toss', text: 'It tears a boulder from its own arm and hurls it.', dmg: m.parts.arms.broken ? 26 : enr ? 46 : 40, threat: m.parts.arms.broken ? 2 : 3 };
      case 'rumble': return { name: 'Rumble', text: 'It plants both fists. The ground starts to shake.', dmg: 0, threat: 0, note: 'Quake next turn. Daze it to stop it' };
      case 'quake': return { name: 'Quake', text: 'It brings the mountain down on you!', dmg: enr ? 70 : 62, threat: 4 };
      case 'reform': return { name: 'Reform', text: 'Stone slides back over the glowing core.', dmg: 0, threat: 0, note: 'Its plates come back. Last turn to hit the core' };
      case 'dazed': return { name: 'Dazed', text: 'It sways, grinding, light flickering in its chest.', dmg: 0, threat: 0, note: 'Its action is lost' };
    }
    return { name: '…', text: '', dmg: 0, threat: 0 };
  },

  next(h, prev) {
    const m = h.mon;
    if (prev === 'rumble') { m.lastChain = h.turn; return remember(h, 'quake'); }
    if (prev === null) return remember(h, 'sweep');
    if ((m.core ?? 0) > 0) { m.core!--; if (m.core === 0) return remember(h, 'reform'); }
    // a daze can eat the Reform turn: the plates still come back on its next action
    else if (m.parts.plates.broken && prev !== 'reform') return remember(h, 'reform');
    const since = h.turn - (m.lastChain ?? 0);
    return remember(h, choose(h, [
      ['sweep', 3],
      ['toss', 2],
      ['rumble', since >= quakeEvery(h) ? 5 : 0]
    ], a => this.intent(h, a).threat));
  },

  resolve(h, type) {
    const m = h.mon, P = m.parts.plates;
    if (type === 'reform') {
      P.broken = false; P.hp = Math.ceil(P.max * REFORM_AT); m.core = 0;
      return 'Its plates grind back into place.';
    }
    if (type === 'dazed') return 'It shakes the daze off with a sound like a rockslide.';
    return null;
  },

  onBreak(h, partId) {
    if (partId !== 'plates') return null;
    h.mon.core = coreTurns(h);
    return `Core exposed! For ${coreTurns(h) + 1} turns Pierce hits on the core deal double. Swap to your bow.`;
  },

  onPhase(h) {
    h.mon.crumble = true;
    return 'It is crumbling: its core will stay out longer, but it quakes more often.';
  },

  reachable(h, partId) {
    return partId !== 'core' || coreOut(h);
  },

  hitMod(h, partId, w) {
    if (!coreOut(h)) return { mult: PLATED_MULT, note: 'plated ×0.4' };
    if (partId === 'core' && w.type === 'Pierce') return { mult: CORE_MULT, note: 'into the core ×2' };
    return null;
  },

  meter(h) {
    const P = h.mon.parts.plates;
    if (coreOut(h)) {
      const left = h.intent === 'reform' ? 1 : (h.mon.core ?? 0) + 1;
      return { label: 'Core exposed', value: left, max: coreTurns(h) + 1, tone: 'ember', pips: true, note: `${left} turn${left > 1 ? 's' : ''} left` };
    }
    return { label: 'Stone plates · every hit ×0.4', value: P.hp, max: P.max, tone: 'stone' };
  },

  tip(h, type) {
    if (type === 'rumble') return carries(h, 'Blunt') ? `A Quake is coming. Daze it through the plates with your ${carryingName(h, 'Blunt')} to stop it.` : 'A Quake is coming. Guard everything you can.';
    if (coreOut(h)) return carries(h, 'Pierce') ? `The core is open. Aim at it and hit it with your ${carryingName(h, 'Pierce')}: double damage.` : 'The core is open, but only Pierce reaches it.';
    if (!carries(h, 'Blunt')) return carries(h, 'Cut') ? `Its plates turn aside 60% of every hit. Your ${carryingName(h, 'Cut')} cracks them slowly; a hammer does it twice as fast.` : 'Its plates turn aside 60% of every hit, and a bow can’t crack them. Bring a hammer or a blade.';
    return h.target === 'plates' ? null : `Aim at the plates with your ${carryingName(h, 'Blunt')} to crack them open.`;
  }
};
