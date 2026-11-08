import { describe, it, expect } from 'vitest';
import * as E from '../src/engine';

// Hunter's Notes (Nov 2026): every entry follows the text rules, and every name a tag or bold word uses finds it
describe("Hunter's Notes", () => {
  // (9 Nov 2026: 40, not 30; Mekkman's clearer headings say which hit and how much damage)
  it('headers are captions: 40 characters or fewer, no full stop', () => {
    for (const n of Object.values(E.NOTES)) { const h = n.head.replace(/\*\*/g, ''); expect(h.length, n.id).toBeLessThanOrEqual(40); expect(h.endsWith('.'), n.id).toBe(false); }
  });
  it('lines are sentences with no colons', () => {
    for (const n of Object.values(E.NOTES)) for (const l of n.lines) { expect(l.endsWith('.'), `${n.id}: ${l}`).toBe(true); expect(l.includes(': '), `${n.id}: ${l}`).toBe(false); }
  });
  it('bold terms and tag labels find their entry', () => {
    for (const t of ['Block', 'Rerolls', 'Pierce', 'Daze', 'Exposed', 'Airborne', 'Ice ×2', 'Snares', 'Static', 'Charged', 'Capturable', 'Leeching']) expect(E.noteFor(t), t).toBeTruthy();
    expect(E.noteFor('Cyclone Charge')).toBeUndefined();
  });
});
