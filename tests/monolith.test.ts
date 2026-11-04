import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const MIRE = ['bogjaw', 'duskheron', 'emberwhelk', 'mistglass'];
const ready = (weapons: string[] = ['facethammer', 'mirrorbow']) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', ...MIRE]) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(id => [id, { lv: 2 }]));
  s.loadout = { ...s.loadout, weapons, target: 'monolith' };
  return s;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('Tier 3: the Monolith Warden', () => {
  it('opens once every Mirewood monster is beaten', () => {
    const s = E.newSave();
    expect(E.isUnlocked(s, 'monolith')).toBe(false);
    expect(E.unlockHint('monolith')).toBe('Beat every monster in the Mirewood first');
    expect(E.isUnlocked(ready(), 'monolith')).toBe(true);
  });
  it('plated: every hit deals ×0.4; breaking the plates exposes the core to Pierce ×2, then it reforms', () => {
    const h = E.startHunt(ready(), 2);
    h.target = 'arms'; h.weapon = 0; dice(h, 'CCCC');
    const plated = E.useMove(h, 0)!.dmg;
    h.mon.parts.plates.hp = 1; h.target = 'plates'; dice(h, 'CCCC');
    E.useMove(h, 0);
    expect(h.mon.parts.plates.broken).toBe(true); expect(h.mon.core).toBe(2);
    h.weapon = 1; h.target = 'core'; dice(h, 'CCCC');
    const core = E.useMove(h, 0)!.dmg;
    expect(core).toBeGreaterThan(plated * 3);
    h.intent = 'sweep'; E.endTurn(h); E.endTurn(h);
    expect(h.intent).toBe('reform');
    E.endTurn(h);
    expect(h.mon.parts.plates.broken).toBe(false);
    expect(h.mon.parts.plates.hp).toBe(Math.ceil(90 * 0.6));
  });
  it('a broken-then-reformed plate still pays its material', () => {
    const s = ready(), h = E.startHunt(s, 3);
    h.mon.parts.plates.cracks = 1; h.mon.hp = 0; h.over = 'win';
    E.settleHunt(s, h);
    expect(h.reward!.mats.wardenplate).toBeGreaterThan(0);
  });
  it('a daze on the Reform turn still brings the plates back', () => {
    const h = E.startHunt(ready(), 4);
    h.mon.parts.plates.broken = true; h.mon.core = 0; h.intent = 'dazed';
    E.endTurn(h);
    expect(h.intent).toBe('reform');
  });
  it('Wardenstone Mail: the first swap each turn is free', () => {
    const s = ready(); s.armors = { wardenmail: { lv: 0 } } as never; s.loadout.armor = 'wardenmail';
    const h = E.startHunt(s, 5);
    expect(E.swap(h, [])).toBe(true);
    expect(E.swap(h, [])).toBe(false);
    expect(h.dice.every(d => !d.used)).toBe(true);
  });
  it('is a check for a plate-cracker plus a core weapon (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'glassmantle', armorLv: 2, item: 'salve', items: 3, target: 'monolith' }, { skill: 'casual', capture: false }, 200, 17).win;
    const both = run([['facethammer', 2], ['mirrorbow', 2]]), noCore = run([['facethammer', 2], ['mirrorblade', 2]]);
    expect(both).toBeGreaterThan(0.8);
    expect(both - noCore).toBeGreaterThan(0.2);
  });
});
