// What a lost hunt tells you (Nov 2026): the Cragwing promotion ends the demo, and a player who never forges can
// lose it again and again without knowing why. After a loss the result card lists up to three facts about this
// monster against the gear you brought. Facts, not instructions (Mekkman's no-handholding rule): it says what
// reaches the monster and what it's weak to, never what to bring.
import type { Element, Hunt, Save, WeaponInst } from './types';
import { MONSTERS } from './data/monsters';
import { plateBreak } from './combat';

const TYPES = ['Cut', 'Blunt', 'Pierce'] as const;
const ELEMS: Element[] = ['Stone', 'Gale', 'Ember', 'Frost'];

/** How its plating breaks, from the monster's own rule (Nov 2026 bug hunt: this used to say "Cut clears all of it"
 *  for every plated monster, which is wrong for the Ashtail). null when your weapons already clear it in one hit. */
function platingFact(h: Hunt): string | null {
  const M = MONSTERS[h.mid], n = M.plated ?? 0; if (!n) return null;
  const word = M.plateWord === 'scale' ? 'scales' : M.plateWord ?? 'ice', mine = Math.max(...h.weps.map(w => plateBreak(h, w)));
  if (mine >= n) return null;
  const probe = (type: WeaponInst['type'], elem: Element | null) => plateBreak(h, { ...h.weps[0], type, elem });
  const base = Math.min(...TYPES.map(t => probe(t, null)));
  const whole: string[] = [], more: string[] = [];
  for (const t of TYPES) { const k = probe(t, null); if (k >= n) whole.push(t); else if (k > base) more.push(`a ${t} hit clears ${k}`); }
  for (const e of ELEMS) if (TYPES.every(t => probe(t, e) >= n) && !TYPES.every(t => probe(t, null) >= n)) whole.push(e);
  const how = [whole.length ? `One ${whole.join(' or ')} hit clears all of ${word.endsWith('s') ? 'them' : 'it'}` : null, ...more].filter(Boolean).join('; ');
  return `Its ${word} ${word.endsWith('s') ? 'have' : 'has'} ${n} layers. ${how ? `${how}; ` : ''}any other hit clears ${base}. Your weapons clear ${mine} layer${mine === 1 ? '' : 's'} a hit.`;
}

export function lossFacts(h: Hunt, s: Save): string[] {
  const M = MONSTERS[h.mid]; if (!M) return [];
  const types = new Set(h.weps.map(w => w.type)), elems = h.weps.map(w => w.elem);
  const losses = Math.max(0, (s.record[h.mid]?.hunts ?? 0) - (s.record[h.mid]?.wins ?? 0));
  const out: string[] = [];
  if (M.flier && !types.has('Pierce')) out.push('In the air, only Pierce (a bow) reaches it. Neither of your weapons could hit it up there.');
  if (M.burrower && !types.has('Blunt')) out.push('Underground, only Blunt (a maul) reaches it, and a heavy Blunt hit drives it up. Neither of your weapons could.');
  const plate = platingFact(h); if (plate) out.push(plate);
  if (!M.elemOf && !elems.includes(M.weak)) out.push(`It’s weak to ${M.weak}: ${/^[AEIOU]/.test(M.weak) ? 'an' : 'a'} ${M.weak} weapon deals ×1.5.${elems.includes(M.resist) ? ` It resists ${M.resist}: ×0.75.` : ''}`);
  if (losses >= 2 && elems.every(e => !e)) out.push('Neither of your weapons carries an element. Elemental weapons are forged at the Forge.');
  if (M.elemental?.length && h.arm.resist !== M.elem && !h.arm.adaptive && !M.elemOf) out.push(`Armor that resists ${M.elem} cuts its ${M.elemental.join(' and ')} by 30%.`);
  return out.slice(0, 3);
}
