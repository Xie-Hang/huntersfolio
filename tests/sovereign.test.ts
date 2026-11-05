// The apex: the Wanderer Sovereign (6 Nov 2026).
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';
import { STANCE_PART, STANCES } from '../src/engine/data/monsters/sovereign';

const hunt = (weapons: [string, number][] = [['monolithhammer', 1], ['stormbow', 1]], armor = 'slagplate') => {
  const s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(([id, lv]) => [id, { lv }]));
  s.armors = { ...s.armors, [armor]: { lv: 0 } };
  s.loadout = { ...s.loadout, weapons: weapons.map(w => w[0]), armor, target: 'sovereign' };
  const h = E.startHunt(s, 11); h.php = 9999; return h;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('Wanderer Sovereign', () => {
  it('opens after the Stormspire', () => {
    const s = E.newSave(); expect(E.isUnlocked(s, 'sovereign')).toBe(false);
    for (const id of ['monolith', 'stormroc', 'slagwyrm', 'gorhydra']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
    expect(E.isUnlocked(s, 'sovereign')).toBe(true);
  });
  it('its element and weakness follow the stance', () => {
    const h = hunt();
    h.mon.stance = 'stone'; expect(E.elemsNow('sovereign', h).weak).toBe('Gale'); expect(E.elemMult('Gale', 'sovereign', h)).toBe(1.5);
    h.mon.stance = 'frost'; expect(E.monElem(h)).toBe('Frost'); expect(E.elemMult('Ember', 'sovereign', h)).toBe(1.5); expect(E.elemMult('Gale', 'sovereign', h)).toBe(0.75);
  });
  it('shifts at random into a stance it still has, never the one it is in, and says which a turn ahead', () => {
    const h = hunt(); const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const before = h.mon.stance; E.endTurn(h); h.php = 9999;
      if (h.intent === 'shift') { expect(h.mon.nextStance).not.toBe(before); expect(E.intentInfo(h).name).toMatch(/^Shifting to/); seen.add(h.mon.nextStance!); }
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
  it('tearing out a stance\'s part ends it on the spot and for good', () => {
    const h = hunt();
    h.mon.stance = 'gale'; h.mon.stanceStep = 1; h.intent = 'takeoff'; h.target = 'wings'; h.mon.parts.wings.hp = 1; // the wings break on the ground only
    h.weapon = 0; dice(h, 'CCCC'); E.useMove(h, 0);
    expect(h.mon.parts.wings.broken).toBe(true); expect(h.mon.air).toBe(false); expect(h.intent).toBe('shift'); expect(h.mon.nextStance).not.toBe('gale');
    for (let i = 0; i < 60; i++) { E.endTurn(h); h.php = 9999; expect(h.mon.stance).not.toBe('gale'); }
  });
  it('a broken wind-up takes the charge with it', () => {
    const h = hunt(); h.mon.stance = 'stone'; h.mon.stanceStep = 2; h.intent = 'dazed';
    E.endTurn(h); expect(h.intent).not.toBe('charge');
  });
  it('each stance uses the rule of the monster it borrowed from', () => {
    const h = hunt();
    h.mon.air = true; expect(E.canHit(h, h.weps[1])).toBe(true); expect(E.canHit(h, h.weps[0])).toBe(false);
    h.mon.air = false; h.mon.under = true; expect(E.canHit(h, h.weps[0])).toBe(true); expect(E.canHit(h, h.weps[1])).toBe(false);
    h.mon.under = false; h.mon.stance = 'frost'; h.intent = 'coat'; E.endTurn(h); expect(h.mon.plating).toBe(2);
  });
  it('every stance has its own part, and part HP adds up to more than its HP (you pick what to break)', () => {
    const M = E.MONSTERS.sovereign;
    for (const s of STANCES) expect(M.parts.some(p => p.id === STANCE_PART[s])).toBe(true);
    expect(M.parts.reduce((t, p) => t + p.hp, 0)).toBeGreaterThan(M.hp);
  });
  it('the Sovereign Mantle resists whichever element it attacks with', () => {
    const h = hunt(undefined, 'sovmantle');
    for (const [stance, intent] of [['stone', 'charge'], ['ember', 'erupt'], ['frost', 'sweep']] as const) {
      h.mon.stance = stance; h.intent = intent;
      const r = E.afterResist(h); expect(r.resisted).toBe(true);
    }
  });
  it('12 apex weapons: blade, maul and bow in every element, each needing its element\'s part', () => {
    const apex = Object.values(E.WEAPONS).filter(w => w.tier === 4);
    expect(apex.length).toBe(12);
    const part = { Stone: 'sovtusk', Gale: 'sovwing', Ember: 'sovvent', Frost: 'sovtail' } as const;
    for (const w of apex) { expect(w.mult).toBe(2.1); expect(E.WEAPONS[w.from!]).toBeTruthy(); expect(w.cost![part[w.elem!]]).toBeGreaterThan(0); }
  });
  it('is the final exam (simulated): a planned pair wins, a strong player wins with any pair', () => {
    const run = (w: [string, number][], skill: 'casual' | 'skilled') => matchup({ weapons: w, armor: 'slagplate', armorLv: 1, item: 'salve', items: 3, target: 'sovereign' }, { skill, capture: false }, 80, 3).win;
    expect(run([['slaghammer', 1], ['monolithbow', 1]], 'casual')).toBeGreaterThan(0.5);
    expect(run([['hydrablade', 1], ['stormbow', 1]], 'skilled')).toBeGreaterThan(0.75);
  });
});
