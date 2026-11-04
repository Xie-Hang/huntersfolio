// Where saves live. In the desktop build, the Electron preload exposes `window.hf.storage`,
// which writes files in the user's app-data folder (with a backup copy). In a plain
// browser (npm run dev), it falls back to localStorage. Both can fail; never throw.

export const SAVE_KEY = 'save';
export const HUNT_KEY = 'hunt';

interface DesktopStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}
declare global {
  interface Window {
    hf?: { storage?: DesktopStorage; steam?: { name: string | null } };
  }
}

const PREFIX = 'huntersfolio-';
const desktop = (): DesktopStorage | undefined => (typeof window !== 'undefined' ? window.hf?.storage : undefined);

export function read(key: string): unknown {
  try {
    const raw = desktop() ? desktop()!.get(key) : localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Set when the save on disk came from a newer build: the save and hunt are then never written, so it survives. */
let locked = false;
export function lockSaves() { locked = true; }
export const savesLocked = () => locked;
const guarded = (key: string) => locked && (key === SAVE_KEY || key === HUNT_KEY);

export function write(key: string, value: unknown) {
  if (guarded(key)) return;
  try {
    const json = JSON.stringify(value);
    if (desktop()) desktop()!.set(key, json);
    else localStorage.setItem(PREFIX + key, json);
  } catch {
    /* storage full or blocked: the game keeps running, progress just isn't kept */
  }
}

export function remove(key: string) {
  if (guarded(key)) return;
  try {
    if (desktop()) desktop()!.remove(key);
    else localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
