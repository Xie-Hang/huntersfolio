// Shared by every monster plate: the one-shot moves (attack and flinch) played on the plate's rig with the
// Web Animations API, so the looping pose underneath keeps running. Whole-body moves use translate, scale
// and skew around the ground line, never a body rotation, so feet don't sink through the ground.
import type { Hunt } from '../../../engine';
import { game } from '../../game.svelte';

export const INK = '#1a1410', BONE = '#ecdfc8', BONE2 = '#c9b89c', FAR = '#b9a88c', GOLD = '#f3cf7a', EMBER = '#e8773a',
  GALE = '#8fc3c9', FROST = '#b9d3f0', MUD = '#5b4532';

const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const LUNGE: Keyframe[] = [{ transform: 'translateX(0)' }, { transform: 'translateX(40px) scaleY(.92) skewX(8deg)', offset: 0.22 }, { transform: 'translateX(-190px) skewX(-14deg)', offset: 0.5 }, { transform: 'translateX(-150px) skewX(-6deg)', offset: 0.62 }, { transform: 'translateX(0)' }];
export const FLINCH: Keyframe[] = [{ transform: 'translateX(0)', filter: 'brightness(1.9)' }, { transform: 'translateX(60px) scaleY(.94) skewX(10deg)', filter: 'brightness(1.3)', offset: 0.25 }, { transform: 'translateX(-10px) skewX(-3deg)', offset: 0.6 }, { transform: 'translateX(0)', filter: 'brightness(1)' }];

/** Call in a plate's script. `rig` returns the element to move; `attack` can pick keyframes per attack. */
export function oneShots(rig: () => Element | undefined, hunt: () => Hunt | null, attack: (intent: string) => Keyframe[] = () => LUNGE) {
  let seenAct = game.pulse.act, seenHit = game.pulse.hit;
  $effect(() => {
    const a = game.pulse.act;
    if (!hunt() || a === seenAct) return; seenAct = a;
    if (!reduce()) rig()?.animate(attack(game.pulse.actIntent), { duration: 640, easing: 'cubic-bezier(.3,.7,.3,1)' });
  });
  $effect(() => {
    const t = game.pulse.hit;
    if (!hunt() || t === seenHit) return; seenHit = t;
    if (!reduce()) rig()?.animate(FLINCH, { duration: 420, easing: 'ease-out' });
  });
}

/** A 4-point star (the dazed stars) */
export const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r} Q${x + r * 0.22} ${y - r * 0.22} ${x + r} ${y} Q${x + r * 0.22} ${y + r * 0.22} ${x} ${y + r} Q${x - r * 0.22} ${y + r * 0.22} ${x - r} ${y} Q${x - r * 0.22} ${y - r * 0.22} ${x} ${y - r} Z`;
/** parallel hatching lines across a box */
export const hatchLines = (x0: number, x1: number, y0: number, y1: number, step: number, dx: number) => {
  let d = ''; for (let x = x0; x < x1; x += step) d += `M${x} ${y0} L${x + dx} ${y1} `; return d;
};
