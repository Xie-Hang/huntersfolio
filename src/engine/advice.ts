// What a lost hunt tells you (Nov 2026): the Cragwing promotion ends the demo, and a player who never forges can
// lose it again and again without knowing why. After a loss the result card lists up to three facts about this
// monster against the gear you brought. Facts, not instructions (Mekkman's no-handholding rule): it says what
// reaches the monster and what it's weak to, never what to bring.
import type { Hunt, Save } from './types';
import { MONSTERS } from './data/monsters';

export function lossFacts(h: Hunt, s: Save): string[] {
  const M = MONSTERS[h.mid]; if (!M) return [];
  const types = new Set(h.weps.map(w => w.type)), elems = h.weps.map(w => w.elem);
  const losses = Math.max(0, (s.record[h.mid]?.hunts ?? 0) - (s.record[h.mid]?.wins ?? 0));
  const out: string[] = [];
  if (M.flier && !types.has('Pierce')) out.push('In the air, only Pierce (a bow) reaches it. Neither of your weapons could hit it up there.');
  if (M.burrower && !types.has('Blunt')) out.push('Underground, only Blunt (a maul) reaches it, and a heavy Blunt hit drives it up. Neither of your weapons could.');
  if (M.plated && !types.has('Cut')) out.push(`One Cut hit clears all of its ${M.plateWord ?? 'ice'}; any other hit clears one layer.`);
  if (!M.elemOf && !elems.includes(M.weak)) out.push(`It’s weak to ${M.weak}: a ${M.weak} weapon deals ×1.5.${elems.includes(M.resist) ? ` It resists ${M.resist}: ×0.75.` : ''}`);
  if (losses >= 2 && elems.every(e => !e)) out.push('Neither of your weapons carries an element. Weapons forged from monster materials at the Forge do.');
  if (M.elemental?.length && h.arm.resist !== M.elem && !M.elemOf) out.push(`Armor that resists ${M.elem} cuts its ${M.elemental.join(' and ')} by 30%.`);
  return out.slice(0, 3);
}
