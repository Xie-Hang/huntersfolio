// Seeded RNG (mulberry32). The state lives on the hunt, so a hunt is fully
// reproducible from its seed — useful for tests, replays and bug reports.
import type { Face, Hunt } from './types';

export function nextRandom(h: { rng: number }): number {
  let t = (h.rng = (h.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const FACES: Face[] = ['C', 'C', 'T', 'T', 'B', 'B'];

export function rollFace(h: Hunt): Face {
  return FACES[Math.floor(nextRandom(h) * 6)];
}

export function randomSeed(): number {
  return (Math.random() * 2 ** 31) | 0;
}
