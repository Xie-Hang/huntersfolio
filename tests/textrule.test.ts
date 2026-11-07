import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

// The button text rule (Nov 2026): a button's second line is one line of about 30 characters, the key fact first;
// the full text goes one step away (a tip). These are the short forms buttons show.
const MAX = 30;
describe('button text rule', () => {
  it('every charm has a short perk of 30 characters or fewer', () => {
    for (const c of Object.values(E.CHARMS)) { expect(c.short, c.id).toBeTruthy(); expect(c.short!.length, `${c.id}: ${c.short}`).toBeLessThanOrEqual(MAX); }
  });
  it('every item’s hunt-button line fits', () => {
    for (const it of Object.values(E.ITEMS)) if (!it.pouch && it.effect !== 'trapRush' && it.effect !== 'trapLand') { const l = it.line ?? it.desc; expect(l.length, `${it.id}: ${l}`).toBeLessThanOrEqual(MAX); }
  });
  it('every short item reason fits', () => {
    for (const v of Object.values(E.ITEM_SHORT)) expect(v.length, v).toBeLessThanOrEqual(MAX);
  });
  it('every monster’s short unlock line fits after "Locked · "', () => {
    for (const id of Object.keys(E.MONSTERS)) { const u = E.unlockShort(id); if (u) expect(('Locked · ' + u.replace(/ first$/, '')).length, `${id}: ${u}`).toBeLessThanOrEqual(MAX + 6); }
  });
});
