// The damage preview tells the truth (Nov 2026 bug hunt). A telegraph game lives on this: the number on screen
// must be the number you take. Found by fuzzing: armor that reduces every hit wasn't counted, and damage riding on
// the end of the turn (a Spark going off, slime, an infection that starts and ticks at once) wasn't shown at all.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';
import { playTurn } from '../src/sim/bot';

const allBeaten = () => {
  const s = E.newSave();
  for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  return s;
};

describe('the damage preview', () => {
  it('counts armor that reduces every hit (Slagforged Plate)', () => {
    const s = allBeaten(); s.armors = { slagplate: { lv: 0 } };
    s.loadout = { ...s.loadout, armor: 'slagplate', target: 'bogjaw' };
    const h = E.startHunt(s, 7);
    for (let i = 0; i < 20 && !E.intentInfo(h).dmg; i++) { h.guard = 999; E.endTurn(h); }
    const inc = E.incoming(h)!; expect(inc.ward).toBe(6);
    const { taken } = E.endTurn(h);
    expect(taken).toBe(inc.net);
  });

  it('shows a Spark about to go off on top of the attack', () => {
    const s = allBeaten(); s.loadout = { ...s.loadout, target: 'archeron' };
    const h = E.startHunt(s, 99);
    for (let i = 0; i < 40 && !h.intent.includes('thrust'); i++) { h.guard = 999; E.endTurn(h); h.php = h.pmax; }
    h.mon.pSpark = 2;
    const tp = E.turnPreview(h)!;
    expect(tp.extra).toBeGreaterThan(0);
    expect(tp.why).toContain('your **Spark**');
    const php = h.php; E.endTurn(h);
    expect(h.php).toBe(tp.hpAfter);
    expect(php - h.php).toBe(tp.attack + tp.extra);
  });

  it('matches the real end of the turn, turn after turn, for every monster', () => {
    for (const mid of Object.keys(E.MONSTERS)) for (const seed of [1, 2]) {
      const s = allBeaten(); s.loadout = { ...s.loadout, target: mid };
      const h = E.startHunt(s, seed * 7919); h.php = h.pmax = 2000;
      for (let t = 0; t < 30 && !h.over; t++) {
        playTurn(h, { skill: 'skilled', capture: false });
        if (h.over) break;
        const inc = E.incoming(h), tp = E.turnPreview(h)!, t0 = h.stats.taken;
        const { taken } = E.endTurn(h);
        expect(taken, `${mid} turn ${t}: attack`).toBe(inc?.net ?? 0);
        expect(tp.attack + tp.extra, `${mid} turn ${t}: total`).toBe(h.stats.taken - t0);
        expect(tp.hpAfter, `${mid} turn ${t}: HP after`).toBe(h.over === 'lose' ? 0 : h.php);
      }
    }
  });

  it('leaves the real hunt untouched', () => {
    const s = allBeaten(); s.loadout = { ...s.loadout, target: 'fenmother' };
    const h = E.startHunt(s, 3), before = JSON.stringify(h);
    E.turnPreview(h);
    expect(JSON.stringify(h)).toBe(before);
  });
});
