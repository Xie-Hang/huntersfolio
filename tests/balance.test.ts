// Balance targets from the design doc, checked by simulated hunts on the real engine.
// If a change to numbers breaks one of these, either the change is wrong or the
// target should be revisited deliberately (and the design doc updated).
import { describe, expect, it } from 'vitest';
import { gorehornCampaign, matchup, median, type Setup } from '../src/sim/scenarios';

const N = 400;
const starterSalves = (target: string): Setup => ({ weapons: [['blade', 0], ['maul', 0]], armor: 'jerkin', item: 'salve', target });

describe('Gorehorn (tutorial monster)', () => {
  it('casual players with starter gear and salves almost always win', () => {
    expect(matchup(starterSalves('gorehorn'), { skill: 'casual', capture: true }, N).win).toBeGreaterThanOrEqual(0.9);
  });
  it('skilled players win but still take real damage', () => {
    const r = matchup(starterSalves('gorehorn'), { skill: 'skilled', capture: true }, N);
    expect(r.win).toBeGreaterThanOrEqual(0.98);
    expect(r.hpLeft).toBeGreaterThan(0.45);
    expect(r.hpLeft).toBeLessThan(0.8);
  });
  it('the item slot matters: no item is noticeably riskier for casual players', () => {
    const r = matchup({ ...starterSalves('gorehorn'), item: null }, { skill: 'casual', capture: true }, N);
    expect(r.win).toBeGreaterThan(0.6);
    expect(r.win).toBeLessThan(0.95);
  });
});

describe('Galeshrike (preparation test)', () => {
  it('punishes unprepared starter gear for casual players', () => {
    const r = matchup(starterSalves('galeshrike'), { skill: 'casual', capture: true }, N);
    expect(r.win).toBeGreaterThan(0.45);
    expect(r.win).toBeLessThan(0.85);
  });
  it('rewards bringing a bow', () => {
    const r = matchup({ weapons: [['bow', 0], ['blade', 0]], armor: 'jerkin', item: 'salve', target: 'galeshrike' }, { skill: 'casual', capture: true }, N);
    expect(r.win).toBeGreaterThanOrEqual(0.85);
  });
  it('its own gear makes it comfortable', () => {
    const r = matchup({ weapons: [['windbow', 0], ['gale', 0]], armor: 'coat', item: 'salve', target: 'galeshrike' }, { skill: 'casual', capture: true }, N);
    expect(r.win).toBeGreaterThanOrEqual(0.95);
  });
});

describe('progression pacing (Gorehorn)', () => {
  const C = Array.from({ length: 120 }, (_, i) => gorehornCampaign(i + 1, { skill: 'skilled', capture: true }));
  const at = (k: string) => median(C.map(c => c.t[k]).filter((x): x is number => x != null));
  it('first upgrade (Tuskbreaker) around hunt 2–3', () => { expect(at('tusk')).toBeGreaterThanOrEqual(2); expect(at('tusk')).toBeLessThanOrEqual(3); });
  it('Gorehorn Crusher (needs the rare) around hunt 7–13', () => { expect(at('crusher')).toBeGreaterThanOrEqual(7); expect(at('crusher')).toBeLessThanOrEqual(13); });
  it('everything at +3 around hunt 12–22', () => { expect(at('done')).toBeGreaterThanOrEqual(12); expect(at('done')).toBeLessThanOrEqual(22); });
});

describe('daze', () => {
  // Playtest: with upgraded mauls the Gorehorn was losing half its turns, often back to back.
  it('never stuns two monster actions in a row, and takes at most about a fifth of its turns', async () => {
    const E = await import('../src/engine');
    const { playTurn } = await import('../src/sim/bot');
    let turns = 0, dazes = 0, chains = 0;
    for (let i = 0; i < 300; i++) {
      const s = E.newSave();
      s.weapons = { crusher: { lv: 3 }, bow: { lv: 0 } };
      s.loadout = { weapons: ['crusher', 'bow'], armor: 'jerkin', item: 'salve', target: 'gorehorn' };
      const h = E.startHunt(s, 1 + i * 7919);
      let last = -9;
      while (!h.over && h.turn < 60) {
        playTurn(h, { skill: 'skilled', capture: true, goal: ['tusks'] });
        if (h.intent === 'dazed') { dazes++; if (h.turn - last === 1) chains++; last = h.turn; }
        if (!h.over) E.endTurn(h);
      }
      turns += h.turn;
    }
    expect(chains).toBe(0);
    expect(dazes / turns).toBeLessThan(0.25);
  });
});
