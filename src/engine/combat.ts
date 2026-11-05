// Combat rules. Every action mutates the hunt in place and returns true if it happened.
// The UI keeps its own snapshots for Undo (structuredClone the hunt before an action).
import type { Face, Hunt, Intent, Save, Tone, WeaponInst } from './types';
import { MONSTERS } from './data/monsters';
import { groundFlier } from './data/monsters/galeshrike';
import { unearth } from './data/monsters/cinderback';
import { CHARMS, ITEMS } from './data/gear';
import { armorInst, elemMult, fixLoadout, lvOf, weaponInst } from './economy';
import { rollFace } from './rng';
import { BOUNTIES } from './data/bounties';
import { bountyOpen } from './bounty';

export const GUARD_RESIST = 0.7;       // armor element resistance multiplier
export const CHARGE_BREAK = 30;        // damage that breaks a pending charge
export const CAPTURE_AT = 0.2;         // capture allowed at or below this share of the monster's HP
/** Pierce's Expose: a hit leaves the part exposed for 2 turns; any weapon's hits there get these bonuses. Tuned by simulation (4 Nov 2026). */
export const MEND = 6, BRACE = 12, FINISHER = 1.25, SWAP_WHET = 0.3, AIR_PIERCE = 1.2, BIG_HIT = 40;
export const EXPOSE_TURNS = 2, EXPOSE_DMG = 1.15, EXPOSE_BREAK = 2;
export const DAZE_START = 60, DAZE_STEP = 30, DAZE_LOCK = 2;
/** each head's meter, for monsters with several heads */
export const HEAD_DAZE_MAX = 50;
/** Bump when the Hunt shape changes; in-progress hunts from older builds are refunded, not resumed. */
export const HUNT_VERSION = 6;
/** Ice plating: layers a Cut hit breaks; any other hit breaks 1 */
export const CUT_ICE_BREAK = 2;
/** Shroud Charm: hits on a grounded flier */
export const GROUND_HIT = 1.15;
/** Squallhide Coat: extra daze on every Blunt hit that builds it; Squall Charm: daze from charging */
export const DAZE_UP = 5, CHARGE_DAZE = 10;
export const iceBreak = (w: WeaponInst) => (w.type === 'Cut' ? CUT_ICE_BREAK : 1);
/** layers of this monster's plating a hit with this weapon clears (ice by default; the Ashtail's cinder scales
 *  differ), plus the Ash Charm's extra layer for Pierce */
export const plateBreak = (h: Hunt, w: WeaponInst) => (MONSTERS[h.mid].plateBreak?.(w) ?? iceBreak(w)) + (w.type === 'Pierce' && charmFx(h) === 'pierceStrip' ? 1 : 0);

const def = (h: Hunt) => MONSTERS[h.mid];
export const monsterOf = def;
/** the carried charm's effect, if any */
export const charmFx = (h: Hunt) => (h.charm ? CHARMS[h.charm]?.effect ?? null : null);
/** dice a Charge costs (Kiln Charm: 1) */
export const chargeDice = (h: Hunt) => (charmFx(h) === 'charge1' ? 1 : 2);
export const LIGHT_CUT_BONUS = 4, DAZE_HEAL = 20;
export const currentWeapon = (h: Hunt) => h.weps[h.weapon];
export const otherWeapon = (h: Hunt) => h.weps[1 - h.weapon];

export function log(h: Hunt, t: string, tone: Tone = '') {
  h.log.unshift({ t, tone });
  if (h.log.length > 30) h.log.pop();
}

/* ---------- start ---------- */
/** The first hunt's opening rolls, so the tutorial's lessons always land: turn 1 affords the
 *  starter weapons' strongest move with a die left over to Guard; turn 2 is a near miss to teach Reroll. */
export const TUTORIAL_SCRIPT: Face[][] = [['C', 'C', 'T', 'B'], ['C', 'T', 'B', 'B']];

/** Builds a hunt from the save's loadout. Carried item charges leave the stash now.
 *  `script` fixes the faces of the opening turns (the tutorial); later turns roll from the seed. */
/** the bounty this hunt counts for: the one taken, if it's for this monster and still open */
const bountyFor = (s: Save, mon: string) => { const id = s.loadout.bounty; return id && BOUNTIES[id]?.mon === mon && bountyOpen(s, id) ? id : null; };

export function startHunt(s: Save, seed: number, script?: Face[][]): Hunt {
  fixLoadout(s);
  const L = s.loadout, MD = MONSTERS[L.target], arm = armorInst(L.armor, lvOf(s.armors, L.armor));
  let item = L.item, carried = 0;
  if (item && ITEMS[item]?.pouch) item = null;
  if (item && (s.items[item] ?? 0) > 0) { carried = Math.min(s.items[item], ITEMS[item].max); s.items[item] -= carried; } else item = null;
  const snares = Math.min(s.items.snare ?? 0, ITEMS.snare.max); s.items.snare = (s.items.snare ?? 0) - snares;
  const parts = Object.fromEntries(MD.parts.map(p => [p.id, { hp: p.hp, max: p.hp, broken: false, exposed: 0 }]));
  const h: Hunt = {
    version: HUNT_VERSION,
    mid: MD.id, turn: 1, php: arm.hp, pmax: arm.hp, rerolls: arm.rerolls,
    weps: L.weapons.map(id => weaponInst(id, lvOf(s.weapons, id))), weapon: 0, arm,
    item, charm: L.charm && s.charms[L.charm] ? L.charm : null, itemCharges: carried, carried, itemUsed: false,
    dice: [], guard: 0, chargePending: false, chargeReady: false, evade: false, whet: 0,
    target: MD.parts[0].id,
    mon: { hp: MD.hp, max: MD.hp, parts, enraged: false, daze: 0, dazeMax: DAZE_START, dazeLock: 0, seq: 0, charges: 0, usedWallow: false, usedRoot: false, exhausted: false, wallow: 0, air: false, airLeft: 0, under: false, molten: 0, plating: MD.plated ?? 0 },
    intent: '', log: [], over: null, captured: false, snares,
    stats: { dealt: 0, taken: 0, guarded: 0, broken: 0, rerollsUsed: 0 },
    reward: null, rng: seed | 0,
    ...(bountyFor(s, MD.id) ? { bounty: bountyFor(s, MD.id)! } : {}),
    ...(script?.length ? { script: script.map(t => [...t]) } : {})
  };
  if (h.charm && CHARMS[h.charm]?.effect === 'scout') h.rerolls++;
  rollAll(h);
  h.intent = MD.next(h, null);
  log(h, `You set out with the ${h.weps[0].name} and ${h.weps[1].name}.`);
  log(h, MD.intro);
  return h;
}

export const SWALLOWED = 'Swallowed', FROZEN = 'Frozen', SHAKEN = 'Shaken';
/** damage it takes to cut your way out once swallowed; Cut counts double, slick armor halves it */
export const GUT_ESCAPE = 60;
/** how much each damage type counts toward cutting free: blades slice out, clubs barely dent the gut wall */
export const GUT_CUT: Record<string, number> = { Cut: 2, Pierce: 1, Blunt: 0.5 };

function rollAll(h: Hunt) {
  const fixed = h.script?.[h.turn - 1];
  h.dice = [0, 1, 2, 3].map(i => ({ face: fixed?.[i] ?? rollFace(h), used: null as string | null }));
  // swallowed: the last dice are stuck inside the monster until you cut free
  const g = h.mon.gut ?? 0;
  for (let i = 4 - g; i < 4; i++) if (i >= 0) h.dice[i].used = SWALLOWED;
  // frozen: the first free dice are iced over for this roll only
  let f = h.arm.thaw ? 0 : h.mon.frost ?? 0;
  for (const d of h.dice) if (f > 0 && !d.used) { d.used = FROZEN; f--; }
  h.mon.frost = 0;
  // shaken: a tremor knocked dice loose for this roll (Quakeback)
  let k = h.arm.steadyfoot ? 0 : h.mon.shake ?? 0;
  for (let i = 3; i >= 0; i--) if (k > 0 && !h.dice[i].used) { h.dice[i].used = SHAKEN; k--; }
  h.mon.shake = 0;
}

/** Swallow lands: `n` of your dice are stuck until you deal the escape damage. */
export function swallowPlayer(h: Hunt, n: number) {
  h.mon.gut = n; h.mon.gutHp = h.arm.slick ? GUT_ESCAPE / 2 : GUT_ESCAPE;
  (h.feats ??= []).includes('swallowed') || h.feats.push('swallowed');
}

/* ---------- reading the state ---------- */
export const intentInfo = (h: Hunt): Intent => def(h).intent(h, h.intent);
export const tip = (h: Hunt) => (h.over ? null : def(h).tip?.(h, h.intent) ?? null);
export const canCapture = (h: Hunt) => h.mon.hp > 0 && h.mon.hp <= h.mon.max * CAPTURE_AT;
export const captureBlocked = (h: Hunt) => canCapture(h) && def(h).canCapture?.(h) === false;
export const canHit = (h: Hunt, w: WeaponInst) => def(h).canHit?.(h, w) ?? true;
export const cantHitReason = (h: Hunt, w: WeaponInst) => (canHit(h, w) ? null : def(h).cantHitReason?.(h, w) ?? 'It can’t be hit right now.');
export const reachable = (h: Hunt, partId: string, w: WeaponInst) => def(h).reachable?.(h, partId, w) ?? true;
export const airborneHalf = (h: Hunt, w: WeaponInst) => h.mon.air && w.type !== 'Pierce';
export const freeDice = (h: Hunt) => h.dice.map((d, i) => (d.used ? -1 : i)).filter(i => i >= 0);

/** Why the carried item can't be used right now (null when it can, or when the reason is simply "used up").
 *  Playtest (Nov 2026): two players threw the Net while the Galeshrike was "Taking off" and nothing happened:
 *  the telegraph is what it does AFTER your turn, so it was still on the ground. Say so on the button. */
export function itemBlockReason(h: Hunt): string | null {
  if (!h.item || h.over || itemUsable(h)) return null;
  if (h.itemUsed) return 'One item per turn: used this turn';
  if (h.itemCharges < 1) return 'None left';
  const fx = ITEMS[h.item].effect, next = h.intent;
  if (fx === 'net') return next === 'takeoff' ? 'Only works while it flies. It takes off after this turn: throw it next turn' : 'Only works while it flies, and it’s on the ground now';
  if (fx === 'blast') return next === 'burrow' ? 'Only works while it’s underground. It digs in after this turn: throw it next turn' : 'Only works while it’s underground';
  if (fx === 'thaw') return def(h).plateHot ? 'Its scales are already burning: a Firepot does nothing' : 'Only works while it has ice plating';
  return null;
}
export function itemUsable(h: Hunt): boolean {
  if (!h.item || h.itemUsed || h.itemCharges < 1 || h.over) return false;
  if (ITEMS[h.item].effect === 'net') return h.mon.air;
  if (ITEMS[h.item].effect === 'blast') return h.mon.under;
  if (ITEMS[h.item].effect === 'thaw') return h.mon.plating > 0 && !def(h).plateHot;
  return true;
}

/** The elemental part of an attack: what resist armor can reduce. Physical attacks carry none. */
export function elemPart(h: Hunt, info = intentInfo(h)): number {
  const e = info.elemDmg ?? (def(h).elemental?.includes(info.name) ? info.dmg : 0);
  return Math.max(0, Math.min(info.dmg, e));
}
/** Damage of an attack after your armor's resistance: only the elemental part is reduced. */
export function afterResist(h: Hunt, info = intentInfo(h)) {
  const elem = elemPart(h, info), phys = info.dmg - elem, resisted = h.arm.resist === def(h).elem && elem > 0;
  return { phys, elem, resisted, wearsResist: h.arm.resist === def(h).elem, after: phys + (resisted ? Math.round(elem * GUARD_RESIST) : elem) };
}
/** What the next monster action will do to you right now, given your guard. */
export function incoming(h: Hunt) {
  if (h.over) return null;
  const info = intentInfo(h); if (!info.dmg) return null;
  const r = afterResist(h, info), res = r.resisted, after = r.after;
  const parts = { phys: r.phys, elem: r.elem, wearsResist: r.wearsResist };
  if (h.evade) return { raw: info.dmg, after, net: 0, res, g: 0, half: !!info.halfGuard && !h.arm.steady, evade: true, ...parts };
  const g = info.halfGuard && !h.arm.steady ? Math.floor(h.guard / 2) : h.guard;
  return { raw: info.dmg, after, net: Math.max(0, after - g), res, g, half: !!info.halfGuard && !h.arm.steady, evade: false, ...parts };
}

/** Indices of free dice that satisfy a recipe, preferring the ones in `prefer`. */
export function pickDice(h: Hunt, need: string, prefer: number[] = []): number[] | null {
  const picks: number[] = [];
  for (const ch of need) {
    const ok = (i: number) => !h.dice[i].used && h.dice[i].face === ch && !picks.includes(i);
    let i = prefer.find(ok);
    if (i === undefined) i = h.dice.findIndex((_, j) => ok(j));
    if (i === undefined || i < 0) return null;
    picks.push(i);
  }
  return picks;
}
export const canUseMove = (h: Hunt, i: number) => !h.over && canHit(h, currentWeapon(h)) && !!pickDice(h, currentWeapon(h).moves[i].need);

/* ---------- player actions ---------- */
function flowReroll(h: Hunt, mv: { flow?: boolean }) {
  if (!mv.flow) return;
  h.rerolls++;
  log(h, 'Flow: +1 reroll.');
}

function checkEnrage(h: Hunt) {
  const m = h.mon;
  if (!m.enraged && m.hp > 0 && m.hp <= m.max / 2) {
    m.enraged = true; log(h, def(h).enrageText, 'ember');
    const t = def(h).onPhase?.(h); if (t) log(h, t, 'ember');
  }
}
function finish(h: Hunt, result: 'win' | 'lose') {
  h.over = result;
  const MD = def(h);
  if (result === 'win') { if (!h.captured) log(h, `${MD.name} falls. Hunt complete.`, 'gold'); }
  else log(h, 'You go down. The hunt has failed.', 'ember');
}

export interface HitResult { dmg: number; broke: boolean }
/** remember a notable moment of this hunt (achievements read them when it ends) */
function feat(h: Hunt, f: string) { (h.feats ??= []).includes(f) || h.feats.push(f); }

/** Fill the shared daze meter (single-headed monsters); a full meter makes it reel. Returns a short note, or
 *  null when the meter is recovering. */
export function addDaze(h: Hunt, n: number): string | null {
  const m = h.mon, MD = def(h);
  if (MD.heads || m.dazeLock > 0 || m.hp <= 0 || h.over) return null;
  m.daze = Math.min(m.dazeMax, m.daze + n);
  if (m.daze < m.dazeMax) return `+${n} daze.`;
  m.daze = 0; m.dazeMax += DAZE_STEP; m.dazeLock = DAZE_LOCK;
  if (intentInfo(h).steady) { m.dazeQueued = true; log(h, `Daze: it reels, but the ${intentInfo(h).name} is already coming. It loses its next action instead.`, 'daze'); }
  else { h.intent = 'dazed'; log(h, 'Daze: the blow rattles its skull. It loses its action!', 'daze'); }
  if (charmFx(h) === 'dazeWhet') { h.whet = Math.max(h.whet, 0.5); log(h, 'Dusk Charm: your next hit deals +50%.', 'gold'); }
  if (charmFx(h) === 'dazeHeal') { const heal = Math.min(DAZE_HEAL, h.pmax - h.php); if (heal) { h.php += heal; log(h, `Tusk Charm: +${heal} HP.`, 'gold'); } }
  return 'it reels!';
}

/** Use weapon move i. `prefer` lists selected dice to spend first. */
export function useMove(h: Hunt, i: number, prefer: number[] = []): HitResult | null {
  if (h.over) return null;
  const w = currentWeapon(h), mv = w.moves[i], m = h.mon, MD = def(h);
  if (!canHit(h, w)) return null;
  const picks = pickDice(h, mv.need, prefer); if (!picks) return null;
  const wasCapturable = canCapture(h);
  const before = { intent: h.intent, threat: intentInfo(h).threat, air: m.air, under: m.under };
  picks.forEach(j => (h.dice[j].used = mv.name));
  const miss = MD.dodge?.(h, w);
  if (miss) { log(h, miss); return { dmg: 0, broke: false }; }
  if (m.plating > 0) {
    // Plating (ice, or the Ashtail's cinder scales): the hit is spent on it. Charge and whetstone bonuses are used up too.
    const hot = !h.arm.burnproof ? MD.burn?.(h, w) ?? 0 : 0;
    const strip = Math.min(m.plating, plateBreak(h, w)), word = MD.plateWord ?? 'ice';
    m.plating -= strip; h.chargeReady = false; h.whet = 0;
    if (strip >= 2 && m.plating === 0) feat(h, 'shatter');
    log(h, `${mv.name} breaks ${strip} layer${strip > 1 ? 's' : ''} of ${word}. ${m.plating ? `${m.plating} left.` : 'The plating is gone!'}`, m.plating ? '' : 'gold');
    if (hot > 0) { const b = Math.min(hot, h.php - 1); if (b > 0) { h.php -= b; h.stats.taken += b; feat(h, 'burned'); log(h, `The scales are white-hot: you're burned for ${b}.`, 'ember'); } }
    flowReroll(h, mv);
    return { dmg: 0, broke: false };
  }
  let dmg = mv.dmg; const notes: string[] = [];
  if (mv.flow && w.type === 'Cut' && charmFx(h) === 'lightCut') { dmg += LIGHT_CUT_BONUS; notes.push('Rime Charm +4'); }
  const charged = h.chargeReady;
  if (h.chargeReady) { dmg *= 2; h.chargeReady = false; notes.push('charged ×2'); }
  if (h.whet) { dmg = Math.round(dmg * (1 + h.whet)); notes.push(`whetted +${Math.round(h.whet * 100)}%`); h.whet = 0; }
  const em = elemMult(w.elem, h.mid);
  if (em !== 1) { dmg = Math.round(dmg * em); notes.push(em > 1 ? 'weakness ×1.5' : 'resisted ×0.75'); }
  if (airborneHalf(h, w)) { dmg = Math.round(dmg / 2); notes.push('airborne ½'); }
  if (MD.flier && !m.air && charmFx(h) === 'groundHit') { dmg = Math.round(dmg * GROUND_HIT); notes.push('Shroud Charm +15%'); }
  if (m.air && w.type === 'Pierce' && charmFx(h) === 'airPierce') { dmg = Math.round(dmg * AIR_PIERCE); notes.push('Crown Charm +20%'); }
  if (wasCapturable && charmFx(h) === 'finisher') { dmg = Math.round(dmg * FINISHER); notes.push('Finisher’s Charm +25%'); }
  const p = m.parts[h.target], pdef = MD.parts.find(x => x.id === h.target)!;
  const exposed = (p.exposed > 0 || (!!mv.expose && charmFx(h) === 'exposeSelf' && reachable(h, h.target, w))) && !p.broken;
  if (exposed) { dmg = Math.round(dmg * EXPOSE_DMG); notes.push('exposed +15%'); }
  const mod = MD.hitMod?.(h, h.target, w);
  if (mod) { dmg = Math.round(dmg * mod.mult); notes.push(mod.note); }
  const soak = MD.absorb?.(h, dmg, w);
  if (soak) { dmg = soak.dmg; notes.push(soak.note); }
  dmg = Math.min(dmg, m.hp);
  m.hp -= dmg; h.stats.dealt += dmg;
  if ((m.gut ?? 0) > 0 && dmg > 0) {
    m.gutHp = (m.gutHp ?? GUT_ESCAPE) - Math.round(dmg * GUT_CUT[w.type]);
    if (m.gutHp <= 0) {
      m.gut = 0; m.gutHp = 0;
      for (const d of h.dice) if (d.used === SWALLOWED) d.used = null;
      log(h, 'You cut your way out! Your dice are free.', 'gold');
      if (charmFx(h) === 'escapeHeal') { const heal = Math.min(20, h.pmax - h.php); if (heal) { h.php += heal; log(h, `Bog Charm: +${heal} HP.`, 'gold'); } }
      feat(h, 'escape');
    }
  }
  log(h, `${mv.name} hits the ${pdef.name.toLowerCase()} for ${dmg}${notes.length ? ' (' + notes.join(', ') + ')' : ''}.`);
  let broke = false;
  const reach = reachable(h, h.target, w);
  if (!p.broken) {
    const e = pdef.eff[w.type];
    if (!reach) log(h, `The ${pdef.name.toLowerCase()} is out of reach right now. Only Pierce gets there.`);
    else if (e > 0) {
      p.hp = Math.max(0, p.hp - Math.round(dmg * e * (mv.part ?? 1) * (exposed ? EXPOSE_BREAK : 1) * (charged && charmFx(h) === 'chargeBreak' ? 2 : 1)));
      if (p.hp === 0) {
        p.broken = true; p.cracks = (p.cracks ?? 0) + 1; h.stats.broken++; broke = true; log(h, pdef.brk, 'ember');
        { const t = MD.onBreak?.(h, h.target, w); if (t) log(h, t, 'gold'); }
        if (charmFx(h) === 'breakFree') { const d = h.dice.find(x => x.used === SHAKEN || x.used === FROZEN); if (d) { d.used = null; log(h, 'Quake Charm: a locked die comes free.', 'gold'); } }
        if (charmFx(h) === 'salvage') { const heal = Math.min(15, h.pmax - h.php); h.php += heal; h.rerolls++; log(h, `Salvager’s Charm: +${heal} HP, +1 reroll.`, 'gold'); }
        if (h.arm.breakHeal) { const heal = Math.min(25, h.pmax - h.php); h.php += heal; h.rerolls++; log(h, `${h.arm.name}: +${heal} HP, +1 reroll.`, 'gold'); }
      }
    } else if (dmg > 0) log(h, `${w.type} weapons can't break the ${pdef.name.toLowerCase()}. The hit still counts toward the kill.`);
  }
  flowReroll(h, mv);
  const dz = mv.daze ? mv.daze + (h.arm.dazeUp ? DAZE_UP : 0) : 0;
  if (dz && MD.heads?.includes(h.target) && reach && m.hp > 0 && MD.dazeHead) {
    const r = MD.dazeHead(h, h.target, dz);
    if (r.line) log(h, r.line, r.dazed ? 'daze' : '');
    if (r.dazed) {
      feat(h, 'daze'); feat(h, `reel:${h.target}`);
      if (MD.heads!.every(x => h.feats!.includes(`reel:${x}`))) feat(h, 'reelboth');
      if (charmFx(h) === 'dazeWhet') { h.whet = Math.max(h.whet, 0.5); log(h, 'Dusk Charm: your next hit deals +50%.', 'gold'); }
      if (charmFx(h) === 'dazeHeal') { const heal = Math.min(DAZE_HEAL, h.pmax - h.php); if (heal) { h.php += heal; log(h, `Tusk Charm: +${heal} HP.`, 'gold'); } }
    }
  } else if (dz && h.target === MD.head && reach && m.hp > 0 && m.dazeLock === 0) {
    addDaze(h, dz);
  }
  if (mv.expose && reach && !p.broken && m.hp > 0) {
    if (!p.exposed) log(h, `Expose: the ${pdef.name.toLowerCase()} ${pdef.name.endsWith('s') ? 'are' : 'is'} exposed. Hits there deal +15% and count double toward the break for 2 turns.`, 'gold');
    p.exposed = EXPOSE_TURNS + (charmFx(h) === 'longExpose' ? 1 : 0);
  }
  if (mv.pin) { const t = MD.onPin?.(h); if (t) log(h, t, 'gold'); }
  if (charmFx(h) === 'bigHeal' && w.type === 'Blunt' && dmg >= BIG_HIT) { const heal = Math.min(10, h.pmax - h.php); if (heal) { h.php += heal; log(h, `Slag Charm: +${heal} HP.`, 'gold'); } }
  if (m.hp > 0) { const t = MD.onHit?.(h, mv, w); if (t) log(h, t, 'gold'); }
  const burn = m.hp > 0 && !h.arm.burnproof ? MD.burn?.(h, w) ?? 0 : 0;
  if (burn > 0) {
    // a burn never knocks you out: losing to your own attack would feel unfair
    const b = Math.min(burn, h.php - 1); if (b > 0) feat(h, 'burned');
    if (b > 0) { h.php -= b; h.stats.taken += b; log(h, `The molten shell sears you for ${b}.`, 'ember'); }
  }
  if (h.intent === 'dazed' && before.intent !== 'dazed') feat(h, 'daze');
  if (before.threat >= 3 && h.intent !== before.intent) feat(h, 'interrupt');
  if (before.air && !m.air) feat(h, 'grounded');
  if (before.under && !m.under) feat(h, 'unearthed');
  checkEnrage(h);
  if (m.hp > 0 && !wasCapturable && canCapture(h)) log(h, `${MD.short} is weak enough to capture!`, 'gold');
  if (m.hp <= 0) finish(h, 'win');
  return { dmg, broke };
}

const freeOnly = (h: Hunt, idx: number[]) => idx.filter(i => h.dice[i] && !h.dice[i].used);

/** A blank fits no move, so it guards better than a shape (playtest: blanks felt like a wasted roll).
 *  The Bristlehide Vest's perk raises that further. */
export const BLANK_GUARD = 1.5, VEST_BLANK_GUARD = 2.5;
export const guardOf = (h: Hunt, i: number) => Math.round(h.arm.guard * (h.dice[i]?.face === 'B' ? (h.arm.blankx2 ? VEST_BLANK_GUARD : BLANK_GUARD) : 1));
export function guard(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (!sel.length || h.over) return false;
  for (const i of sel) { h.guard += guardOf(h, i); h.dice[i].used = 'Guard'; }
  return true;
}
export function charge(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== chargeDice(h) || h.chargePending || h.over) return false;
  sel.forEach(i => (h.dice[i].used = 'Charge')); h.chargePending = true;
  log(h, 'You plant your feet and build up power.');
  if (h.arm.braced) { h.guard += BRACE; log(h, `${h.arm.name}: +${BRACE} guard while you charge.`, 'gold'); }
  if (charmFx(h) === 'chargeDaze') { const r = addDaze(h, CHARGE_DAZE); if (r) log(h, `Squall Charm: ${r}`, 'daze'); }
  return true;
}
/** a quickswap armor's free swap is still available this turn */
export const freeSwap = (h: Hunt) => (!!h.arm.quickswap && !h.freeSwapUsed) || (!!h.arm.swapOnce && !h.swapOnceUsed);
export type DiceAction = 'guard' | 'charge' | 'swap' | 'capture';
/** Dice an action takes when the player hasn't selected any (Mekkman, playtest): blanks first, since they fit no
 *  move; failing that, the dice left when they're exactly what the action needs (Guard: all of them, if no move can
 *  use them). null = the player has to choose. Swap with a free swap needs none ([]). */
export function autoDice(h: Hunt, action: DiceAction): number[] | null {
  const free = freeDice(h), blanks = free.filter(i => h.dice[i].face === 'B');
  if (action === 'guard') {
    if (blanks.length) return blanks;
    if (free.length && (free.length === 1 || !currentWeapon(h).moves.some((_, i) => canUseMove(h, i)))) return free;
    return null;
  }
  if (action === 'swap' && freeSwap(h)) return [];
  const n = action === 'charge' ? chargeDice(h) : action === 'swap' ? 1 : 2;
  if (blanks.length >= n) return blanks.slice(0, n);
  return free.length === n ? free : null;
}
export function swap(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (h.over) return false;
  if (freeSwap(h) && sel.length === 0) { if (h.arm.quickswap && !h.freeSwapUsed) h.freeSwapUsed = true; else h.swapOnceUsed = true; }
  else if (sel.length !== 1) return false;
  else h.dice[sel[0]].used = 'Swap';
  h.weapon = 1 - h.weapon;
  log(h, `You switch to the ${currentWeapon(h).name}.`);
  if (charmFx(h) === 'swapWhet') { h.whet = Math.max(h.whet, SWAP_WHET); log(h, 'Core Charm: your next hit deals +30%.', 'gold'); }
  return true;
}
/** Weak enough, a Snare carried, none set yet this turn. */
export const captureReady = (h: Hunt) => canCapture(h) && !captureBlocked(h) && h.snares > 0 && !h.snareSet;
/** Set a snare (2 dice, 1 Snare). It closes when you end your turn, after the monster's move: a hit of
 *  CHARGE_BREAK or more tears it free (the snare is lost). Risk you can see and play around, not a roll. */
export function capture(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== 2 || !canCapture(h) || h.over || h.snareSet) return false;
  if (captureBlocked(h)) { log(h, 'You can’t snare it while it’s in the air.'); return false; }
  if (h.snares < 1) { log(h, 'You have no Snare. Buy them in the Shop.'); return false; }
  sel.forEach(i => (h.dice[i].used = 'Snare'));
  h.snares--; h.snareSet = true;
  log(h, `You set a snare around the ${def(h).short}. It holds unless its move hits you for ${CHARGE_BREAK} or more.`, 'gold');
  return true;
}
export function reroll(h: Hunt, idx: number[]): number[] {
  const sel = freeOnly(h, idx); if (!sel.length || h.rerolls < 1 || h.over) return [];
  h.rerolls--; h.stats.rerollsUsed++;
  for (const i of sel) h.dice[i].face = rollFace(h);
  return sel;
}
export function useItem(h: Hunt): boolean {
  if (!itemUsable(h)) return false;
  h.itemUsed = true; h.itemCharges--;
  const it = ITEMS[h.item!];
  switch (it.effect) {
    case 'heal30': { const heal = Math.min(30, h.pmax - h.php); h.php += heal; log(h, `${it.name}: +${heal} HP.`); break; }
    case 'smoke': h.evade = true; log(h, 'You throw down smoke. Its next attack will miss.'); break;
    case 'whet50': h.whet = 0.5; log(h, 'You sharpen your edge. Next hit +50%.'); break;
    case 'whet100': h.whet = 1; log(h, 'You grind your edge on the tusk. Next hit +100%.'); break;
    case 'net': groundFlier(h); log(h, 'The net wraps its wings. It crashes to the ground!', 'gold'); break;
    case 'thaw': h.mon.plating = 0; log(h, 'The firepot bursts against its back. The ice plating melts away!', 'gold'); break;
    case 'blast': unearth(h); log(h, 'The powder goes off in its tunnel. It bursts up, stunned!', 'gold'); break;
  }
  return true;
}
export function abandon(h: Hunt) {
  if (h.over) return;
  log(h, 'You retreat from the hunt.', 'ember');
  finish(h, 'lose');
}

/* ---------- monster turn ---------- */
export interface TurnResult { taken: number }

export function endTurn(h: Hunt): TurnResult {
  if (h.over) return { taken: 0 };
  const type = h.intent, info = intentInfo(h), m = h.mon, MD = def(h);
  let taken = 0, landed = false;
  if (info.dmg > 0) {
    if (h.evade) { h.evade = false; log(h, `${info.name} tears through the smoke and misses you.`, 'gold'); }
    else {
      const ar = afterResist(h, info), res = ar.resisted;
      const raw = ar.after;
      const g = info.halfGuard && !h.arm.steady ? Math.floor(h.guard / 2) : h.guard;
      taken = Math.max(0, raw - g - (h.arm.ward ?? 0)); landed = true;
      const blocked = raw - taken;
      h.php = Math.max(0, h.php - taken); h.stats.taken += taken; h.stats.guarded += blocked;
      log(h, `${info.name} hits you for ${taken}${blocked ? ` (${blocked} blocked${info.halfGuard && !h.arm.steady ? ', guard halved' : ''})` : ''}${res ? ` (${MD.elem} resisted)` : ar.elem === 0 && ar.wearsResist ? ' (physical: your armor\u2019s resist doesn\u2019t apply)' : ''}.`, taken >= CHARGE_BREAK ? 'ember' : '');
      if (h.chargePending && taken >= CHARGE_BREAK) { h.chargePending = false; log(h, 'The hit breaks your focus. Your charge is lost.', 'ember'); }
    }
  }
  if (h.snareSet) {
    h.snareSet = false;
    if (h.php > 0 && taken < CHARGE_BREAK) {
      h.captured = true; log(h, `The snare bites. ${MD.name} thrashes, then lies still. Captured!`, 'gold');
      finish(h, 'win'); return { taken };
    }
    if (h.php > 0) log(h, `The hit knocks you back and the ${MD.short} tears free of the snare!`, 'ember');
  }
  const line = MD.resolve(h, type, landed);
  if (line) log(h, line);
  if (m.wallow > 0) m.wallow--;
  if (m.dazeLock > 0) m.dazeLock--;
  if (m.molten > 0) m.molten--;
  for (const part of Object.values(m.parts)) if (part.exposed > 0) part.exposed--;
  if (h.php <= 0) { finish(h, 'lose'); return { taken }; }
  if (h.arm.mend && h.php < h.pmax) { const heal = Math.min(MEND, h.pmax - h.php); h.php += heal; log(h, `Your armor knits shut: +${heal} HP.`, 'gold'); }
  if (h.chargeReady) log(h, 'Your unused charge fades.');
  h.turn++; h.chargeReady = h.chargePending; h.chargePending = false; h.guard = 0; h.itemUsed = false; h.freeSwapUsed = false;
  rollAll(h);
  h.intent = MD.next(h, type);
  if (m.dazeQueued) { m.dazeQueued = false; h.intent = 'dazed'; }
  return { taken };
}
