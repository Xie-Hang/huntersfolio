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
  show(tab: 'hunt' | 'notes' | 'controls', entry: string | null = null) { this.tab = tab; this.entry = entry; this.open = true; }
}
export const help = new HelpState();

let pending: string[] = [];
/** note that the player has met this term (a bold word or a tag label); unknown words are ignored */
export function met(term: string) {
  const id = noteFor(term);
  if (!id || help.seen.includes(id) || pending.includes(id)) return;
  pending.push(id);
  queueMicrotask(() => {
    if (!pending.length) return;
    help.seen = [...help.seen, ...pending.filter(p => !help.seen.includes(p))]; pending = [];
    try { localStorage.setItem(KEY, JSON.stringify(help.seen)); } catch { /* storage full or blocked: still works this session */ }
  });
}
export const known = (id: string) => !!NOTES[id]?.always || help.seen.includes(id);
/** open Hunter's Notes on the entry for this bold term */
export const openNote = (term: string) => { const id = noteFor(term); if (id) help.show('notes', id); };
