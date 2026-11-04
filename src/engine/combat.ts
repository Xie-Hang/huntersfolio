// Combat rules. Every action mutates the hunt in place and returns true if it happened.
// The UI keeps its own snapshots for Undo (structuredClone the hunt before an action).
import type { Face, Hunt, Intent, Save, Tone, WeaponInst } from './types';
import { MONSTERS } from './data/monsters';
import { groundFlier } from './data/monsters/galeshrike';
import { unearth } from './data/monsters/cinderback';
import { CHARMS, ITEMS } from './data/gear';
import { armorInst, elemMult, fixLoadout, lvOf, weaponInst } from './economy';
import { rollFace } from './rng';

export const GUARD_RESIST = 0.7;       // armor element resistance multiplier
export const CHARGE_BREAK = 30;        // damage that breaks a pending charge
export const CAPTURE_AT = 0.2;         // capture allowed at or below this share of the monster's HP
/** Pierce's Expose: a hit leaves the part exposed for 2 turns; any weapon's hits there get these bonuses. Tuned by simulation (4 Nov 2026). */
export const EXPOSE_TURNS = 2, EXPOSE_DMG = 1.15, EXPOSE_BREAK = 2;
export const DAZE_START = 60, DAZE_STEP = 30, DAZE_LOCK = 2;
/** each head's meter, for monsters with several heads */
export const HEAD_DAZE_MAX = 50;
/** Bump when the Hunt shape changes; in-progress hunts from older builds are refunded, not resumed. */
export const HUNT_VERSION = 6;
/** Ice plating: layers a Cut hit breaks; any other hit breaks 1 */
export const CUT_ICE_BREAK = 2;
export const iceBreak = (w: WeaponInst) => (w.type === 'Cut' ? CUT_ICE_BREAK : 1);

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
export function startHunt(s: Save, seed: number, script?: Face[][]): Hunt {
  fixLoadout(s);
  const L = s.loadout, MD = MONSTERS[L.target], arm = armorInst(L.armor, lvOf(s.armors, L.armor));
  let item = L.item, carried = 0;
  if (item && (s.items[item] ?? 0) > 0) { carried = Math.min(s.items[item], ITEMS[item].max); s.items[item] -= carried; } else item = null;
  const parts = Object.fromEntries(MD.parts.map(p => [p.id, { hp: p.hp, max: p.hp, broken: false, exposed: 0 }]));
  const h: Hunt = {
    version: HUNT_VERSION,
    mid: MD.id, turn: 1, php: arm.hp, pmax: arm.hp, rerolls: arm.rerolls,
    weps: L.weapons.map(id => weaponInst(id, lvOf(s.weapons, id))), weapon: 0, arm,
    item, charm: L.charm && s.charms[L.charm] ? L.charm : null, itemCharges: carried, carried, itemUsed: false,
    dice: [], guard: 0, chargePending: false, chargeReady: false, evade: false, whet: 0,
    target: MD.parts[0].id,
    mon: { hp: MD.hp, max: MD.hp, parts, enraged: false, daze: 0, dazeMax: DAZE_START, dazeLock: 0, seq: 0, charges: 0, usedWallow: false, usedRoot: false, exhausted: false, wallow: 0, air: false, airLeft: 0, under: false, molten: 0, plating: MD.plated ?? 0 },
    intent: '', log: [], over: null, captured: false,
    stats: { dealt: 0, taken: 0, guarded: 0, broken: 0, rerollsUsed: 0 },
    reward: null, rng: seed | 0,
    ...(script?.length ? { script: script.map(t => [...t]) } : {})
  };
  rollAll(h);
  h.intent = MD.next(h, null);
  log(h, `You set out with the ${h.weps[0].name} and ${h.weps[1].name}.`);
  log(h, MD.intro);
  return h;
}

export const SWALLOWED = 'Swallowed';
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
}

/** Swallow lands: `n` of your dice are stuck until you deal the escape damage. */
export function swallowPlayer(h: Hunt, n: number) {
  h.mon.gut = n; h.mon.gutHp = h.arm.slick ? GUT_ESCAPE / 2 : GUT_ESCAPE;
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

export function itemUsable(h: Hunt): boolean {
  if (!h.item || h.itemUsed || h.itemCharges < 1 || h.over) return false;
  if (ITEMS[h.item].effect === 'net') return h.mon.air;
  if (ITEMS[h.item].effect === 'blast') return h.mon.under;
  if (ITEMS[h.item].effect === 'thaw') return h.mon.plating > 0;
  return true;
}

/** What the next monster action will do to you right now, given your guard. */
export function incoming(h: Hunt) {
  if (h.over) return null;
  const info = intentInfo(h); if (!info.dmg) return null;
  const res = h.arm.resist === def(h).elem, after = res ? Math.round(info.dmg * GUARD_RESIST) : info.dmg;
  if (h.evade) return { raw: info.dmg, after, net: 0, res, g: 0, half: !!info.halfGuard && !h.arm.steady, evade: true };
  const g = info.halfGuard && !h.arm.steady ? Math.floor(h.guard / 2) : h.guard;
  return { raw: info.dmg, after, net: Math.max(0, after - g), res, g, half: !!info.halfGuard && !h.arm.steady, evade: false };
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
  if (!m.enraged && m.hp > 0 && m.hp <= m.max / 2) { m.enraged = true; log(h, def(h).enrageText, 'ember'); }
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

/** Use weapon move i. `prefer` lists selected dice to spend first. */
export function useMove(h: Hunt, i: number, prefer: number[] = []): HitResult | null {
  if (h.over) return null;
  const w = currentWeapon(h), mv = w.moves[i], m = h.mon, MD = def(h);
  if (!canHit(h, w)) return null;
  const picks = pickDice(h, mv.need, prefer); if (!picks) return null;
  const wasCapturable = canCapture(h);
  const before = { intent: h.intent, threat: intentInfo(h).threat, air: m.air, under: m.under };
  picks.forEach(j => (h.dice[j].used = mv.name));
  if (m.plating > 0) {
    // Ice plating: the hit is spent on the ice. Charge and whetstone bonuses are used up too.
    const strip = Math.min(m.plating, iceBreak(w));
    m.plating -= strip; h.chargeReady = false; h.whet = 0;
    if (strip >= 2 && m.plating === 0) feat(h, 'shatter');
    log(h, `${mv.name} breaks ${strip} layer${strip > 1 ? 's' : ''} of ice. ${m.plating ? `${m.plating} left.` : 'The plating is gone!'}`, m.plating ? '' : 'gold');
    flowReroll(h, mv);
    return { dmg: 0, broke: false };
  }
  let dmg = mv.dmg; const notes: string[] = [];
  if (mv.flow && w.type === 'Cut' && charmFx(h) === 'lightCut') { dmg += LIGHT_CUT_BONUS; notes.push('Rime Charm +4'); }
  if (h.chargeReady) { dmg *= 2; h.chargeReady = false; notes.push('charged ×2'); }
  if (h.whet) { dmg = Math.round(dmg * (1 + h.whet)); notes.push(`whetted +${Math.round(h.whet * 100)}%`); h.whet = 0; }
  const em = elemMult(w.elem, h.mid);
  if (em !== 1) { dmg = Math.round(dmg * em); notes.push(em > 1 ? 'weakness ×1.5' : 'resisted ×0.75'); }
  if (airborneHalf(h, w)) { dmg = Math.round(dmg / 2); notes.push('airborne ½'); }
  const p = m.parts[h.target], pdef = MD.parts.find(x => x.id === h.target)!;
  const exposed = (p.exposed > 0 || (!!mv.expose && charmFx(h) === 'exposeSelf' && reachable(h, h.target, w))) && !p.broken;
  if (exposed) { dmg = Math.round(dmg * EXPOSE_DMG); notes.push('exposed +15%'); }
  const mod = MD.hitMod?.(h, h.target, w);
  if (mod) { dmg = Math.round(dmg * mod.mult); notes.push(mod.note); }
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
      p.hp = Math.max(0, p.hp - Math.round(dmg * e * (mv.part ?? 1) * (exposed ? EXPOSE_BREAK : 1)));
      if (p.hp === 0) {
        p.broken = true; h.stats.broken++; broke = true; log(h, pdef.brk, 'ember');
        if (h.arm.breakHeal) { const heal = Math.min(25, h.pmax - h.php); h.php += heal; h.rerolls++; log(h, `${h.arm.name}: +${heal} HP, +1 reroll.`, 'gold'); }
      }
    } else if (dmg > 0) log(h, `${w.type} weapons can't break the ${pdef.name.toLowerCase()}. The hit still counts toward the kill.`);
  }
  flowReroll(h, mv);
  if (mv.daze && MD.heads?.includes(h.target) && reach && m.hp > 0 && MD.dazeHead) {
    const r = MD.dazeHead(h, h.target, mv.daze);
    if (r.line) log(h, r.line, r.dazed ? 'daze' : '');
    if (r.dazed) {
      feat(h, 'daze');
      if (charmFx(h) === 'dazeWhet') { h.whet = Math.max(h.whet, 0.5); log(h, 'Dusk Charm: your next hit deals +50%.', 'gold'); }
      if (charmFx(h) === 'dazeHeal') { const heal = Math.min(DAZE_HEAL, h.pmax - h.php); if (heal) { h.php += heal; log(h, `Tusk Charm: +${heal} HP.`, 'gold'); } }
    }
  } else if (mv.daze && h.target === MD.head && reach && m.hp > 0 && m.dazeLock === 0) {
    m.daze = Math.min(m.dazeMax, m.daze + mv.daze);
    if (m.daze >= m.dazeMax) {
      m.daze = 0; m.dazeMax += DAZE_STEP; m.dazeLock = DAZE_LOCK; h.intent = 'dazed';
      log(h, 'Daze: the blow rattles its skull. It loses its action!', 'daze');
      if (charmFx(h) === 'dazeWhet') { h.whet = Math.max(h.whet, 0.5); log(h, 'Dusk Charm: your next hit deals +50%.', 'gold'); }
      if (charmFx(h) === 'dazeHeal') { const heal = Math.min(DAZE_HEAL, h.pmax - h.php); if (heal) { h.php += heal; log(h, `Tusk Charm: +${heal} HP.`, 'gold'); } }
    }
  }
  if (mv.expose && reach && !p.broken && m.hp > 0) {
    if (!p.exposed) log(h, `Expose: the ${pdef.name.toLowerCase()} ${pdef.name.endsWith('s') ? 'are' : 'is'} exposed. Hits there deal +15% and count double toward the break for 2 turns.`, 'gold');
    p.exposed = EXPOSE_TURNS;
  }
  if (mv.pin) { const t = MD.onPin?.(h); if (t) log(h, t, 'gold'); }
  if (m.hp > 0) { const t = MD.onHit?.(h, mv, w); if (t) log(h, t, 'gold'); }
  const burn = m.hp > 0 && !h.arm.burnproof ? MD.burn?.(h, w) ?? 0 : 0;
  if (burn > 0) {
    // a burn never knocks you out: losing to your own attack would feel unfair
    const b = Math.min(burn, h.php - 1);
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

export function guard(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (!sel.length || h.over) return false;
  for (const i of sel) { h.guard += h.arm.guard * (h.arm.blankx2 && h.dice[i].face === 'B' ? 2 : 1); h.dice[i].used = 'Guard'; }
  return true;
}
export function charge(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== chargeDice(h) || h.chargePending || h.over) return false;
  sel.forEach(i => (h.dice[i].used = 'Charge')); h.chargePending = true;
  log(h, 'You plant your feet and build up power.');
  return true;
}
export function swap(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== 1 || h.over) return false;
  h.dice[sel[0]].used = 'Swap'; h.weapon = 1 - h.weapon;
  log(h, `You switch to the ${currentWeapon(h).name}.`);
  return true;
}
export function capture(h: Hunt, idx: number[]): boolean {
  const sel = freeOnly(h, idx); if (sel.length !== 2 || !canCapture(h) || h.over) return false;
  if (captureBlocked(h)) { log(h, 'You can’t snare it while it’s in the air.'); return false; }
  sel.forEach(i => (h.dice[i].used = 'Capture'));
  h.captured = true; log(h, `The snare bites. ${def(h).name} thrashes, then lies still. Captured!`, 'gold');
  finish(h, 'win');
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
      const res = h.arm.resist === MD.elem;
      const raw = res ? Math.round(info.dmg * GUARD_RESIST) : info.dmg;
      const g = info.halfGuard && !h.arm.steady ? Math.floor(h.guard / 2) : h.guard;
      taken = Math.max(0, raw - g); landed = true;
      const blocked = raw - taken;
      h.php = Math.max(0, h.php - taken); h.stats.taken += taken; h.stats.guarded += blocked;
      log(h, `${info.name} hits you for ${taken}${blocked ? ` (${blocked} blocked${info.halfGuard && !h.arm.steady ? ', guard halved' : ''})` : ''}${res ? ` (${MD.elem} resisted)` : ''}.`, taken >= CHARGE_BREAK ? 'ember' : '');
      if (h.chargePending && taken >= CHARGE_BREAK) { h.chargePending = false; log(h, 'The hit breaks your focus. Your charge is lost.', 'ember'); }
    }
  }
  const line = MD.resolve(h, type, landed);
  if (line) log(h, line);
  if (m.wallow > 0) m.wallow--;
  if (m.dazeLock > 0) m.dazeLock--;
  if (m.molten > 0) m.molten--;
  for (const part of Object.values(m.parts)) if (part.exposed > 0) part.exposed--;
  if (h.php <= 0) { finish(h, 'lose'); return { taken }; }
  if (h.chargeReady) log(h, 'Your unused charge fades.');
  h.turn++; h.chargeReady = h.chargePending; h.chargePending = false; h.guard = 0; h.itemUsed = false;
  rollAll(h);
  h.intent = MD.next(h, type);
  return { taken };
}
