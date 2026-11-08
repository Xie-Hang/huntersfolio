// Help and Hunter's Notes (Nov 2026): which game terms the player has met, and opening Help on a tab or an entry.
// A term is met when it's drawn as a bold word (Rich) or a monster tag. Kept in its own storage key, per device,
// so it never touches the save format.
import { NOTES, noteFor } from '../engine';

const KEY = 'huntersfolio-notes';
const load = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };

class HelpState {
  open = $state(false);
  tab = $state<'hunt' | 'notes' | 'controls'>('hunt');
  entry = $state<string | null>(null);
  seen = $state<string[]>(load());
  /** terms just met for the first time that get a "New in Hunter's Notes" notice (8 Nov 2026: Daze, Enraged,
   *  elements and Flow aren't taught by a prompt any more; the notice says where to read about them) */
  fresh = $state<string[]>([]);
  show(tab: 'hunt' | 'notes' | 'controls', entry: string | null = null) { this.tab = tab; this.entry = entry; this.open = true; }
}
export const help = new HelpState();

/** the groups whose new terms get a notice: the ones no prompt teaches */
const NOTICE = ['Weapon tags', 'Monster states', 'On you'];
let pending: string[] = [];
const quietIds = new Set<string>();
/** note that the player has met this term (a bold word or a tag label); unknown words are ignored */
export function met(term: string, quiet = false) {
  const id = noteFor(term);
  if (!id || help.seen.includes(id) || pending.includes(id)) return;
  if (quiet) quietIds.add(id);
  pending.push(id);
  queueMicrotask(() => {
    if (!pending.length) return;
    const add = pending.filter(p => !help.seen.includes(p)); pending = [];
    help.seen = [...help.seen, ...add];
    help.fresh = [...help.fresh, ...add.filter(id => !quietIds.has(id) && (NOTICE.includes(NOTES[id].group) || id === 'elements'))];
    try { localStorage.setItem(KEY, JSON.stringify(help.seen)); } catch { /* storage full or blocked: still works this session */ }
  });
}
export const known = (id: string) => !!NOTES[id]?.always || help.seen.includes(id);
/** open Hunter's Notes on the entry for this bold term */
export const openNote = (term: string) => { const id = noteFor(term); if (id) help.show('notes', id); };
