import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';

const ready = () => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = { tusk: { lv: 2 }, bow: { lv: 2 } };
  s.loadout = { ...s.loadout, weapons: ['tusk', 'bow'], target: 'emberwhelk' };
  return s;
};

describe('Tier 2: the Emberwhelk', () => {
  it('heals every turn until its gills break', () => {
    const h = E.startHunt(ready(), 2);
    h.mon.hp = 300; h.intent = 'rear'; E.endTurn(h);
    expect(h.mon.hp).toBe(318);
    h.mon.parts.gills.broken = true; h.mon.parts.gills.hp = 0;
    E.endTurn(h); // the lunge
    expect(h.mon.hp).toBe(318);
  });
  it('Molten Slime burns you for 2 more turns, and never knocks you out', () => {
    const h = E.startHunt(ready(), 3);
    h.intent = 'slime'; E.endTurn(h);
    expect(h.mon.slime).toBe(2);
    h.intent = 'rear'; const before = h.php; E.endTurn(h);
    expect(before - h.php).toBe(8);
    h.php = 1; h.intent = 'retreat'; E.endTurn(h);
    expect(h.php).toBe(1); expect(h.over).toBeFalsy();
  });
  it('Shell Retreat halves your hits until its next action', () => {
    const h = E.startHunt(ready(), 4);
    h.mon.hp = 300; h.intent = 'retreat'; E.endTurn(h);
    expect(h.mon.shell).toBe(1);
    expect(E.monsterOf(h).hitMod!(h, 'gills', E.currentWeapon(h))!.mult).toBe(0.5);
    h.intent = 'spit'; E.endTurn(h);
    expect(h.mon.shell).toBe(0);
  });
  it('Rears Back always leads to the Shell Lunge', () => {
    const h = E.startHunt(ready(), 5);
    h.intent = 'rear'; E.endTurn(h);
    expect(h.intent).toBe('lunge');
  });
  it('the Whelk Charm makes Expose last 3 turns', () => {
    const s = ready(); s.charms = { whelkcharm: 1 } as never; s.loadout = { ...s.loadout, charm: 'whelkcharm' };
    const h = E.startHunt(s, 6);
    h.weapon = 1; h.target = 'gills';
    h.dice = [{ face: 'T', used: null }, { face: 'T', used: null }, { face: 'C', used: null }, { face: 'C', used: null }];
    const i = E.currentWeapon(h).moves.findIndex(m => m.expose);
    E.useMove(h, i);
    expect(h.mon.parts.gills.exposed).toBe(3);
  });
  it('is a Pierce check on element-neutral gear (simulated, casual)', () => {
    const pierce = matchup({ weapons: [['tusk', 2], ['bow', 2]], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'emberwhelk' }, { skill: 'casual', capture: false }, 200, 17);
    const none = matchup({ weapons: [['blade', 3], ['tusk', 2]], armor: 'vest', armorLv: 2, item: 'salve', items: 3, target: 'emberwhelk' }, { skill: 'casual', capture: false }, 200, 17);
    expect(pierce.win).toBeGreaterThan(0.8);
    expect(pierce.win - none.win).toBeGreaterThan(0.3);
  });
});
