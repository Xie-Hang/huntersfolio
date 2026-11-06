// Player preferences (separate from the save, so resetting the save keeps them).
import { read, write } from './storage';

const KEY = 'settings';
import { UI_SIZES } from './display';

/** showAll: skip the first hunts' simpler screen and show every action from the start */
interface Prefs { music: number; sfx: number; fullscreen: boolean; uiSize: number; tips: boolean; showAll: boolean }
const DEFAULTS: Prefs = { music: 0.7, sfx: 0.8, fullscreen: false, uiSize: 1, tips: true, showAll: false };

function loadPrefs(): Prefs {
  const raw = read(KEY) as Partial<Prefs> | null;
  const clamp = (v: unknown, d: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
  return {
    music: clamp(raw?.music, DEFAULTS.music),
    sfx: clamp(raw?.sfx, DEFAULTS.sfx),
    fullscreen: raw?.fullscreen === true,
    tips: raw?.tips !== false,
    showAll: raw?.showAll === true,
    uiSize: (UI_SIZES as readonly number[]).includes(raw?.uiSize as number) ? (raw!.uiSize as number) : DEFAULTS.uiSize
  };
}

class Settings {
  prefs = $state<Prefs>(loadPrefs());
  save() { write(KEY, $state.snapshot(this.prefs)); }
}

export const settings = new Settings();
