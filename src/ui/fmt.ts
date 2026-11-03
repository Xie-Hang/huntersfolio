// Display helpers shared by the screens. No game rules here.
import * as E from '../engine';

export const GLYPH: Record<string, string> = { C: '●', T: '▲' };
export const glyphs = (need: string) => [...need].map(c => GLYPH[c]).join('');
export const needLabel = (need: string) => [...need].map(c => (c === 'C' ? 'circle' : 'triangle')).join(', ');
export const movesLine = (moves: E.Move[]) => moves.map(m => `${glyphs(m.need)} ${m.dmg}`).join(' · ');

export const effName = (e: number) => (e >= 1 ? 'Best' : e > 0 ? 'Half' : 'None');
export const effCls = (e: number) => (e >= 1 ? 'best' : e > 0 ? 'half' : 'none');
export const pct = (a: number, b: number) => Math.max(0, Math.min(100, Math.round((a / b) * 100)));

export const SLOT_LABEL: Record<string, string> = { w0: 'Weapon 1', w1: 'Weapon 2', armor: 'Armor', item: 'Item' };
export const ELEMS: E.Element[] = ['Stone', 'Gale', 'Ember', 'Frost'];
export const DAMAGE_TYPES: E.DamageType[] = ['Cut', 'Blunt', 'Pierce'];

export const record = (s: E.Save, mon: string): E.MonsterRecord => s.record[mon] ?? { hunts: 0, wins: 0, captures: 0, breaks: {} };

/** Split engine text into plain runs and signature chips: "[PIN] Pinning Shot…" → chip + text. */
export type Seg = { text: string; tag?: 'expose' | 'daze' | 'flow' };
export function segments(text: string): Seg[] {
  const out: Seg[] = [];
  const re = /\[(EXPOSE|DAZE|FLOW)\]/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1][0] + m[1].slice(1).toLowerCase(), tag: m[1].toLowerCase() as Seg['tag'] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** Parts a weapon type breaks best on this monster. */
export const bestParts = (mon: string, type: E.DamageType) =>
  E.MONSTERS[mon].parts.filter(p => p.eff[type] >= 1).map(p => p.name.toLowerCase());

/** Damage per turn this owned weapon would do in a hunt against `mon`. */
export const weaponVs = (s: E.Save, id: string, mon: string) => E.avgVs(E.ownedWeapon(s, id), mon);
