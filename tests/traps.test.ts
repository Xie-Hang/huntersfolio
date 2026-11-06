// Traps (Nov 2026): a Tripline catches rushes, a Stakebed catches dives and bursts up. Set free (your item action);
// only the move it's built for springs it; held 2 turns; a held monster weak enough to capture is captured; any
// other move wastes the trap.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

const hunt = (mid: string, item: 'tripline' | 'stakebed') => {
  const s = E.newSave(); for (const id of Object.keys(E.MONSTERS)) s.record[id] = { hunts: 1, wins: 1, captures: 0, breaks: {} };
  s.items = { ...s.items, [item]: 2 }; s.loadout = { ...s.loadout, item, target: mid };
  const h = E.startHunt(s, 3); h.php = h.pmax = 999; return h;
};

describe('traps', () => {
  it('a Tripline catches the Gorehorn’s charge: no damage, held 2 turns, then it fights again', () => {
    const h = hunt('gorehorn', 'tripline'); h.intent = 'charge';
    expect(E.incoming(h)?.net).toBeGreaterThan(0);
    expect(E.useItem(h)).toBe(true); expect(E.incoming(h)?.net ?? 0).toBe(0);
    const php = h.php; E.endTurn(h);
    expect(h.php).toBe(php); expect(h.intent).toBe('trapped'); expect(h.mon.trapped).toBe(2);
    E.endTurn(h); expect(h.intent).toBe('trapped');
    E.endTurn(h); expect(h.intent).not.toBe('trapped');
  });
  it('set on any other move, the trap is wasted and the hit lands', () => {
    const h = hunt('gorehorn', 'tripline'); h.intent = 'jab';
    const left = h.itemCharges; E.useItem(h); expect(h.itemCharges).toBe(left - 1);
    const php = h.php; E.endTurn(h);
    expect(h.php).toBeLessThan(php); expect(h.intent).not.toBe('trapped');
  });
  it('a held monster weak enough to capture is captured', () => {
    const h = hunt('gorehorn', 'tripline'); h.intent = 'charge'; h.mon.hp = Math.floor(h.mon.max * 0.15);
    E.useItem(h); E.endTurn(h);
    expect(h.over).toBe('win'); expect(h.captured).toBe(true);
  });
  it('a Stakebed catches a dive and the flier lands', () => {
    const h = hunt('galeshrike', 'stakebed'); h.mon.air = true; h.intent = 'dive';
    E.useItem(h); E.endTurn(h);
    expect(h.mon.air).toBe(false); expect(h.intent).toBe('trapped');
  });
  it('the damage preview shows the trap: no damage this turn', () => {
    const h = hunt('cragwing', 'tripline'); h.intent = 'charge'; E.useItem(h);
    const tp = E.turnPreview(h)!; expect(tp.attack).toBe(0);
  });
  it('each monster’s page can say what a trap catches, straight from its move list', () => {
    expect(E.trapMoves('gorehorn').trapRush).toContain('Trampling Charge');
    expect(E.trapMoves('cragwing').trapLand).toEqual(expect.arrayContaining(['Talon Dive', 'Rockburst']));
    expect(E.trapMoves('stormroc').trapLand).toContain('Stoop Dive');
    expect(E.trapMoves('duskheron')).toEqual({ trapRush: [], trapLand: [] });
  });
});
