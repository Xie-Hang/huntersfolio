// One layer per hunt (Nov 2026 playtest: "overwhelming"). The engine side: the first hunt (lesson 1) is a gentler
// Gorehorn with no mud and no stance that aims for you; the last-turn recap replaces the on-screen log.
import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

describe('lessons', () => {
  it('lesson 1: less HP, softer hits, aimed at the part the first weapon breaks best', () => {
    const s = E.newSave(); const h = E.startHunt(s, 5, undefined, 1); const g = E.startHunt(E.newSave(), 5);
    expect(h.mon.max).toBe(Math.round(E.MONSTERS.gorehorn.hp * E.LESSON1.hp));
    expect(h.target).toBe('hide');
    expect(E.intentInfo(h).dmg).toBeLessThan(E.intentInfo(g).dmg);
  });
  it('the first hunts have no mud and no stance; from lesson 4 they’re back', () => {
    for (const [lesson, want] of [[1, false], [3, false], [undefined, true]] as const) {
      const h = E.startHunt(E.newSave(), 7, undefined, lesson); h.php = h.pmax = 9999; const seen = new Set<string>();
      for (let i = 0; i < 20 && !h.over; i++) { seen.add(h.intent); if (i === 3) h.mon.hp = Math.floor(h.mon.max * 0.6); E.endTurn(h); }
      expect(seen.has('bristle') || seen.has('wallow'), String(lesson)).toBe(want);
    }
  });
  it('a basic player wins the first hunt', () => {
    let wins = 0;
    for (let i = 0; i < 100; i++) {
      const h = E.startHunt(E.newSave(), 11 + i * 7919, undefined, 1);
      while (!h.over && h.turn < 40) {
        const w = E.currentWeapon(h), order = w.moves.map((m, j) => [m.dmg, j]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
        for (let k = 0; k < 8 && !h.over; k++) { const j = order.find(x => E.canUseMove(h, x)); if (j === undefined) break; E.useMove(h, j); }
        if (!h.over && E.freeDice(h).length) E.guard(h, E.freeDice(h));
        if (!h.over) E.endTurn(h);
      }
      if (h.over === 'win') wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(95);
  });
  it('the recap holds last turn: what you dealt and what it did', () => {
    const h = E.startHunt(E.newSave(), 3); h.php = h.pmax = 999; h.intent = 'jab';
    h.dice = [{ face: 'C', used: null }, { face: 'C', used: null }, { face: 'T', used: null }, { face: 'B', used: null }] as never;
    const hp = h.mon.hp; E.useMove(h, 1); E.endTurn(h);
    expect(h.recap?.turn).toBe(1); expect(h.recap?.dealt).toBe(hp - h.mon.hp);
    expect(h.recap?.lines.some(l => /hits you/.test(l.t))).toBe(true);
    expect(h.recap?.lines.some(l => /You set out/.test(l.t))).toBe(false);
  });
});
