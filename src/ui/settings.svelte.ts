// Player preferences (separate from the save, so resetting the save keeps them).
import { read, write } from './storage';

const KEY = 'settings';
interface Prefs { music: number; sfx: number }
const DEFAULTS: Prefs = { music: 0.7, sfx: 0.8 };

function loadPrefs(): Prefs {
  const raw = read(KEY) as Partial<Prefs> | null;
  const clamp = (v: unknown, d: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
  return { music: clamp(raw?.music, DEFAULTS.music), sfx: clamp(raw?.sfx, DEFAULTS.sfx) };
}

class Settings {
  prefs = $state<Prefs>(loadPrefs());
  save() { write(KEY, $state.snapshot(this.prefs)); }
}

export const settings = new Settings();
