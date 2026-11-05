import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { matchup } from '../src/sim/scenarios';
import { SOAK } from '../src/engine/data/monsters/slagwyrm';

const ready = (weapons: string[] = ['pearlhammer', 'twilightbow']) => {
  const s = E.newSave();
  for (const id of ['gorehorn', 'galeshrike', 'cinderback', 'rimetail', 'bogjaw', 'duskheron', 'emberwhelk', 'mistglass']) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.weapons = Object.fromEntries(weapons.map(id => [id, { lv: 2 }]));
  s.loadout = { ...s.loadout, weapons, target: 'slagwyrm' };
  return s;
};
const dice = (h: E.Hunt, f: string) => { h.dice = [...f].map(face => ({ face, used: null })) as never; };

describe('Tier 3: the Slagwyrm', () => {
  it('its armour soaks the first damage each turn, then refills after its action', () => {
    const h = E.startHunt(ready(['duskblade', 'twilightbow']), 2);
    h.target = 'tail'; dice(h, 'CCCC');
    const a = E.useMove(h, 0)!.dmg, b = E.useMove(h, 0)!.dmg;
    expect(h.mon.armour).toBeLessThan(SOAK); expect(b).toBeGreaterThanOrEqual(a);
    h.intent = 'bite'; E.endTurn(h);
    expect(h.mon.armour).toBe(SOAK);
  });
  it('a heavy Blunt hit shatters it for 2 turns and quenches an Eruption', () => {
    const h = E.startHunt(ready(), 3);
    h.intent = 'eruption'; h.target = 'spine'; h.chargeReady = true; dice(h, 'CTTC');
    E.useMove(h, 2);
    expect(h.mon.shatter).toBe(2); expect(h.intent).toBe('quenched'); expect(h.feats).toContain('shatterslag');
    E.endTurn(h); expect(h.mon.shatter).toBe(1);
  });
  it('Meltdown: no more armour, and only the first melee hit each turn burns you', () => {
    const h = E.startHunt(ready(['pearlhammer', 'twilightbow']), 4);
    h.mon.hp = Math.floor(h.mon.max / 2) + 5; h.target = 'spine'; dice(h, 'CTCC');
    E.useMove(h, 1); // a heavy hit: shatters the armour and crosses half HP
    expect(h.mon.melt).toBe(true);
    const php = h.php; E.useMove(h, 0); E.useMove(h, 0);
    expect(php - h.php).toBe(8);
  });
  it('is a Blunt check (simulated, casual)', () => {
    const run = (w: [string, number][]) => matchup({ weapons: w, armor: 'glassmantle', armorLv: 2, item: 'salve', items: 3, target: 'slagwyrm' }, { skill: 'casual', capture: false }, 200, 17).win;
    const blunt = run([['miremaul', 2], ['wartbow', 2]]), none = run([['bogcleaver', 2], ['wartbow', 2]]); // Stone: its weakness
    expect(blunt).toBeGreaterThan(0.8);
    expect(blunt - none).toBeGreaterThan(0.2);
  });
});
