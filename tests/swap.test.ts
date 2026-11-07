import { describe, it, expect } from 'vitest';
import { matchup } from '../src/sim/scenarios';

// Swapping to fit the roll is rewarded, not required (Mekkman, Nov 2026): skilled players who do it finish sooner,
// and nobody has to. Measured at about half a turn a hunt. Never hinted: players find the patterns themselves.
describe('swapping to fit the roll', () => {
  it('saves skilled players turns, on average', () => {
    const S: [string, object][] = [
      ['gorehorn', { weapons: [['blade', 1], ['maul', 1]], armor: 'jerkin', item: 'salve', items: 3 }],
      ['galeshrike', { weapons: [['sinewbow', 1], ['tusk', 1]], armor: 'vest', armorLv: 1, item: 'salve', items: 3 }],
      ['monolith', { weapons: [['facethammer', 2], ['twilightbow', 2]], armor: 'glassmantle', armorLv: 2, item: 'salve', items: 3 }]
    ];
    let saved = 0;
    for (const [t, o] of S) {
      const sw = matchup({ ...o, target: t } as never, { skill: 'skilled', capture: false }, 150, 5);
      const no = matchup({ ...o, target: t } as never, { skill: 'skilled', capture: false, noRollSwap: true }, 150, 5);
      expect(sw.win).toBeGreaterThanOrEqual(no.win - 0.02);
      saved += no.turns - sw.turns;
    }
    expect(saved / S.length).toBeGreaterThan(0.2);
  });
});

