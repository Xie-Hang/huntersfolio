import type { Element, MonsterDef } from '../../types';
import { gorehorn } from './gorehorn';
import { scuttlehog } from './scuttlehog';
import { snapclaw } from './snapclaw';
import { tuskling } from './tuskling';
import { burrowmole } from './burrowmole';
import { galeshrike } from './galeshrike';
import { cinderback } from './cinderback';
import { rimetail } from './rimetail';
import { cragwing } from './cragwing';
import { fenmother } from './fenmother';
import { bogjaw } from './bogjaw';
import { duskheron } from './duskheron';
import { emberwhelk } from './emberwhelk';
import { mistglass } from './mistglass';
import { monolith } from './monolith';
import { stormroc } from './stormroc';
import { slagwyrm } from './slagwyrm';
import { gorhydra } from './gorhydra';
import { squallhorn } from './squallhorn';
import { rimeshrike } from './rimeshrike';
import { quakeback } from './quakeback';
import { ashtail } from './ashtail';
import { sovereign } from './sovereign';
import { rotcap } from './rotcap';
import { arcmoth } from './arcmoth';
import { hollowfang } from './hollowfang';
import { feverjaw } from './feverjaw';
import { archeron } from './archeron';
import { bloodwhelk } from './bloodwhelk';
import { MAX_TIER, EDITION } from '../../edition';

/** Stormspire (Tier 3) ramp, Nov 2026 playtest: a skilled tester cleared it with +0 Mirewood weapons, so nothing
 *  asked him to farm or reinforce. Each monster gets its own HP (body and parts) and damage multiplier, tuned in the
 *  sim (scratch/t3prep.ts) so an average player who walks in with fresh Mirewood gear mostly loses, one who brings
 *  Mirewood gear of its weakness at +3 with resist armor wins ~95%, and Stormspire gear wins 90%+. A flat multiplier
 *  didn't work: it walled the Monolith while the Slagwyrm and Gorhydra stayed easy. */
export const TIER3_TUNE: Record<string, { hp: number; dmg: number }> = {
  monolith: { hp: 1.1, dmg: 1.1 }, stormroc: { hp: 1.2, dmg: 1.25 }, slagwyrm: { hp: 1.2, dmg: 1.2 }, gorhydra: { hp: 1.25, dmg: 1.25 },
};
for (const [M, t] of [[monolith, TIER3_TUNE.monolith], [stormroc, TIER3_TUNE.stormroc], [slagwyrm, TIER3_TUNE.slagwyrm], [gorhydra, TIER3_TUNE.gorhydra]] as const) {
  M.hp = Math.round(M.hp * t.hp);
  for (const p of M.parts) p.hp = Math.round(p.hp * t.hp);
  const raw = M.intent;
  M.intent = function (h, type) {
    const r = raw.call(this, h, type);
    return r.dmg ? { ...r, dmg: Math.round(r.dmg * t.dmg), ...(r.elemDmg ? { elemDmg: Math.round(r.elemDmg * t.dmg) } : {}) } : r;
  };
}

/** every monster that's built; MONSTERS is the ones in this edition (the demo stops at Ashfall Ridge) */
// Tier 2.2 = the Gloamhollow (status monsters, Nov 2026), a side region beside the Mirewood. 3.2 = the Mirewood, changed:
// three Mirewood monsters carrying those statuses, beside the Stormspire. Both optional: the Sovereign still unlocks
// from the Stormspire four.
// Tier 2.5 = the changed Ashfall Ridge (variants, Nov 2026): after the Mirewood, before the Stormspire in power.
// Tier 2.4 = the rank E → D promotion (the Fenmother): it opens the Stormspire.
// Tier 1.5 = the rank F → E promotion hunt (the Cragwing, Nov 2026): it opens the Mirewood and ends the demo.
// Tier 0.5 = the Foothills (the tutorial island, Nov 2026): below the Ridge, before rank F.
export const ALL_MONSTERS: Record<string, MonsterDef> = { scuttlehog, snapclaw, tuskling, burrowmole, gorehorn, galeshrike, cinderback, rimetail, cragwing, bogjaw, duskheron, emberwhelk, mistglass, fenmother, rotcap, arcmoth, hollowfang, squallhorn, rimeshrike, quakeback, ashtail, monolith, stormroc, slagwyrm, gorhydra, feverjaw, archeron, bloodwhelk, sovereign };
export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(Object.entries(ALL_MONSTERS).filter(([, M]) => M.tier <= MAX_TIER));
const builtIn = (t: number) => Object.values(MONSTERS).filter(M => M.tier === t).length;

export const TIERS: Record<number, string> = { 0.5: 'The Foothills', 1: 'Tier 1 · Ashfall Ridge', 1.5: 'Promotion hunt · rank F to E', 2.4: 'Promotion hunt · rank E to D', 2: builtIn(2) ? 'Tier 2 · Mirewood' : 'Tier 2 · Uncharted', 2.2: 'The Gloamhollow', 2.5: 'Ashfall Ridge, changed', 3.2: 'The Mirewood, changed', 3: builtIn(3) ? 'Tier 3 · Stormspire' : 'Tier 3 · Uncharted', 4: 'Apex' };

/** Planned roster slots that aren't in the game yet (shown as Unknown on the Hunt Board). */
const later = EDITION === 'demo' ? 'in the full game' : 'in a coming update';
export const UNKNOWN: { tier: number; elem: Element | null; n: number; hint: string }[] = ([
  { tier: 2, elem: null, n: 4 - builtIn(2), hint: `Beyond Ashfall Ridge, ${later}` },
  { tier: 3, elem: null, n: 4 - builtIn(3), hint: `Further still, ${later}` },
  { tier: 4, elem: null, n: 1 - builtIn(4), hint: 'Something vast stirs beyond the ridge' }
] as { tier: number; elem: Element | null; n: number; hint: string }[]).filter(u => u.n > 0);
