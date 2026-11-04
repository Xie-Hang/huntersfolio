import { it } from 'vitest';
import { matchup } from '../src/sim/scenarios';
const MON = process.env.MON ?? 'monolith';
const SETS: [string, [string, number][], string][] = JSON.parse(process.env.SETS ?? '[]');
it('sim', () => {
  for (const [label, w, armor] of SETS) for (const skill of ['casual', 'skilled'] as const) {
    const r: any = matchup({ weapons: w, armor, armorLv: 2, item: 'salve', items: 3, target: MON }, { skill, capture: false }, 200, 17);
    console.log('S', label.padEnd(22), skill.padEnd(8), String(Math.round(r.win * 100)).padStart(3) + '%', 'turns', r.turns.toFixed(1), 'hp', r.hpLeft.toFixed(2), JSON.stringify(r.partRate));
  }
}, 300000);
