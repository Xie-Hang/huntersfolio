// Achievements. Ids are the Steam API names (enter them in Steamworks exactly as written).
// Each is checked against the save (progress) or a finished hunt (moments). Earned ids are kept in the save,
// so they reach Steam whenever it's available, including ones earned before the App ID existed.
import type { Hunt, Save } from './types';
import { MONSTERS } from './data/monsters';
import { CHARMS } from './data/gear';
import { BOUNTIES } from './data/bounties';
import { EDITION } from './edition';
import { rankAtLeast } from './rank';

export interface AchievementDef {
  id: string; name: string; desc: string;
  /** progress you can see in the save */
  save?: (s: Save) => boolean;
  /** something that happened in a finished hunt */
  hunt?: (h: Hunt, s: Save) => boolean;
}

const won = (h: Hunt) => h.over === 'win';
const tier1 = () => Object.values(MONSTERS).filter(M => M.tier === 1).map(M => M.id);
const tier2 = () => Object.values(MONSTERS).filter(M => M.tier === 2).map(M => M.id);
const tier3 = () => Object.values(MONSTERS).filter(M => M.tier === 3).map(M => M.id);
const changed = () => Object.values(MONSTERS).filter(M => M.tier === 2.5).map(M => M.id);
const gloam = () => Object.values(MONSTERS).filter(M => M.tier === 2.2).map(M => M.id);
const mireChanged = () => Object.values(MONSTERS).filter(M => M.tier === 3.2).map(M => M.id);
const STARTERS = ['blade', 'maul'];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'FIRST_HUNT', name: 'First blood', desc: 'Win your first hunt.', save: s => Object.values(s.record).some(r => r.wins > 0) },
  { id: 'RIDGE_CLEARED', name: 'Ashfall Ridge', desc: 'Beat every monster on Ashfall Ridge.', save: s => tier1().every(id => (s.record[id]?.wins ?? 0) > 0) },
  { id: 'FIRST_CAPTURE', name: 'Snared', desc: 'Capture a monster.', save: s => Object.values(s.record).some(r => r.captures > 0) },
  { id: 'RIDGE_CAPTURED', name: 'Living folio', desc: 'Capture every monster on Ashfall Ridge.', save: s => tier1().every(id => (s.record[id]?.captures ?? 0) > 0) },
  // Every part in ONE hunt is out of reach by design (part HP adds up to more than the monster's), so it's across hunts.
  { id: 'TAKEN_APART', name: 'Taken apart', desc: 'Break every part of one monster, over any number of hunts.', save: s => Object.values(MONSTERS).some(M => M.parts.every(p => (s.record[M.id]?.breaks[p.id] ?? 0) > 0)) },
  { id: 'BARELY_SCRATCHED', name: 'Barely scratched', desc: 'Win a hunt losing 40 HP or less.', hunt: h => won(h) && h.stats.taken <= 40 },
  { id: 'LIGHTS_OUT', name: 'Lights out', desc: 'Daze a monster.', hunt: h => !!h.feats?.includes('daze') },
  { id: 'STOPPED_COLD', name: 'Stopped cold', desc: 'Stop a monster’s big attack before it lands.', hunt: h => !!h.feats?.includes('interrupt') },
  { id: 'GROUNDED', name: 'Grounded', desc: 'Shoot the Galeshrike out of the sky.', hunt: h => !!h.feats?.includes('grounded') },
  { id: 'UNEARTHED', name: 'Unearthed', desc: 'Drive the Cinderback up with a Blunt hit.', hunt: h => !!h.feats?.includes('unearthed') },
  { id: 'SHATTER', name: 'Shatter', desc: 'Break all of the Rimetail’s ice with one hit.', hunt: h => !!h.feats?.includes('shatter') },
  { id: 'RARE_FIND', name: 'Rare find', desc: 'Carry home a rare material.', hunt: h => !!h.reward?.rare },
  { id: 'FIRST_FORGE', name: 'Fresh from the forge', desc: 'Craft or upgrade a weapon.', save: s => Object.keys(s.weapons).some(id => !STARTERS.includes(id)) },
  { id: 'TEMPERED', name: 'Tempered', desc: 'Reinforce a weapon to +3.', save: s => Object.values(s.weapons).some(w => w.lv >= 3) },
  { id: 'FIRST_CHARM', name: 'Lucky charm', desc: 'Craft a charm.', save: s => Object.keys(s.charms).length > 0 },
  { id: 'ALL_CHARMS', name: 'Charm collector', desc: 'Craft every charm.', save: s => Object.keys(CHARMS).every(id => s.charms[id]) }
];
// Full game: Mirewood and the bounty board (5 Nov 2026). Not in the demo, which has neither.
if (EDITION === 'full') ACHIEVEMENTS.push(
  { id: 'MIREWOOD_CLEARED', name: 'Mirewood', desc: 'Beat every monster in the Mirewood.', save: s => tier2().length > 0 && tier2().every(id => (s.record[id]?.wins ?? 0) > 0) },
  { id: 'GUT_CHECK', name: 'Gut check', desc: 'Cut your way out of the Bogjaw.', hunt: h => !!h.feats?.includes('escape') },
  { id: 'TWO_HEADS', name: 'Two heads down', desc: 'Set both of the Duskheron’s heads reeling in one hunt.', hunt: h => !!h.feats?.includes('reelboth') },
  { id: 'FIRST_BOUNTY', name: 'Bounty hunter', desc: 'Complete a bounty.', save: s => Object.keys(s.bounties).length > 0 },
  { id: 'RIDGE_CHANGED', name: 'The ridge, changed', desc: 'Beat all four changed Ashfall Ridge monsters.', save: s => changed().length > 0 && changed().every(id => (s.record[id]?.wins ?? 0) > 0) },
  // promotions (Nov 2026): the rank tag in its new metal. Rank C is the Sovereign win, so that achievement says it
  { id: 'RANK_E', name: 'Copper tag', desc: 'Pass the Cragwing promotion hunt and become a rank E hunter.', save: s => rankAtLeast(s, 'E') },
  { id: 'RANK_D', name: 'Bronze tag', desc: 'Pass the Fenmother promotion hunt and become a rank D hunter.', save: s => rankAtLeast(s, 'D') },
  { id: 'SOVEREIGN', name: 'Sovereign', desc: 'Beat the Wanderer Sovereign and become a rank C hunter.', save: s => !!MONSTERS.sovereign && (s.record.sovereign?.wins ?? 0) > 0 },
  { id: 'BARE_HANDED', name: 'Bare-handed', desc: 'Beat the Wanderer Sovereign without using an item or healing with Drain.', hunt: h => h.mid === 'sovereign' && h.over === 'win' && h.itemCharges === h.carried && !h.feats?.includes('drainheal') },
  { id: 'STORMSPIRE_CLEARED', name: 'Stormspire', desc: 'Beat every monster on the Stormspire.', save: s => tier3().length > 0 && tier3().every(id => (s.record[id]?.wins ?? 0) > 0) },
  { id: 'QUENCHED', name: 'Quenched', desc: 'Break the Slagwyrm’s armour while it stokes.', hunt: h => !!h.feats?.includes('shatterslag') },
  { id: 'SEARED_SHUT', name: 'Seared shut', desc: 'Seal all three of the Gorhydra’s stumps in one hunt.', hunt: h => !!h.feats?.includes('sealall') },
  { id: 'STORM_CHASER', name: 'Storm chaser', desc: 'Drain the Stormcrown Roc’s storm from full to nothing with Pierce hits.', hunt: h => !!h.feats?.includes('stormdrain') },
  // the Gloamhollow (Nov 2026): one per status, beaten without it ever landing on you, and the region
  { id: 'CLEAN_BILL', name: 'Clean bill', desc: 'Beat the Rotcap without ever getting Infect.', hunt: h => h.mid === 'rotcap' && won(h) && !h.feats?.includes('infected') },
  { id: 'EARTHED', name: 'Earthed', desc: 'Beat the Arcmoth without a Spark ever going off through you.', hunt: h => h.mid === 'arcmoth' && won(h) && !h.feats?.includes('discharged') },
  { id: 'BLOODLESS', name: 'Bloodless', desc: 'Beat the Hollowfang without it ever latching on.', hunt: h => h.mid === 'hollowfang' && won(h) && !h.feats?.includes('latched') },
  { id: 'GLOAMHOLLOW', name: 'The Gloamhollow', desc: 'Beat all three monsters of the Gloamhollow.', save: s => gloam().length > 0 && gloam().every(id => (s.record[id]?.wins ?? 0) > 0) },
  { id: 'MIRE_CHANGED', name: 'The Mirewood, changed', desc: 'Beat all three changed Mirewood monsters.', save: s => mireChanged().length > 0 && mireChanged().every(id => (s.record[id]?.wins ?? 0) > 0) },
  { id: 'ALL_BOUNTIES', name: 'Every name on the board', desc: 'Complete every bounty.', save: s => Object.keys(BOUNTIES).length > 0 && Object.keys(BOUNTIES).every(id => s.bounties[id]) }
);

/** Ids newly earned now (not yet in the save). Adds them to the save. Pass the hunt that just ended, if any. */
export function award(s: Save, h: Hunt | null = null): string[] {
  const got: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    if ((a.save && a.save(s)) || (h && a.hunt && a.hunt(h, s))) got.push(a.id);
  }
  s.achievements.push(...got);
  return got;
}

