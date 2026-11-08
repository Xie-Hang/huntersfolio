<script lang="ts">
  // "New in Hunter's Notes" (8 Nov 2026): a term met for the first time that no prompt teaches (Daze, Enraged, the
  // elements, Flow, a monster's state). It doesn't block anything: it waits a few seconds, or opens the entry.
  import * as E from '../../engine';
  import { help } from '../notes.svelte';

  const cur = $derived(help.fresh[0] ? E.NOTES[help.fresh[0]] : null);
  const next = () => { help.fresh = help.fresh.slice(1); };
  $effect(() => { if (!cur) return; const id = cur.id; const t = setTimeout(() => { if (help.fresh[0] === id) next(); }, 7000); return () => clearTimeout(t); });
</script>

{#if cur && !help.open}
  <div class="notice" role="status">
    <span><span class="k">New in Hunter’s Notes</span><b>{cur.name}</b> <span class="h">{cur.head}</span></span>
    <button class="btn quiet" onclick={() => { help.show('notes', cur.id); next(); }}>Read</button>
    <button class="x" aria-label="Close" onclick={next}>×</button>
  </div>
{/if}

<style>
  .notice { position: fixed; left: max(16px, env(safe-area-inset-left, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 40; display: flex; align-items: center; gap: 10px; max-width: min(380px, calc(100vw - 32px)); padding: 8px 8px 8px 14px; border: 1px solid var(--line); border-left: 3px solid var(--gold-hi); border-radius: 4px; background: var(--raise); box-shadow: 0 6px 20px rgba(0, 0, 0, .35); font-size: var(--fs-sm); color: var(--soft); }
  .notice > span { display: flex; flex-direction: column; min-width: 0; }
  .k { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  b { color: var(--fg); }
  .x { background: none; border: 0; color: var(--muted); font-size: 18px; cursor: pointer; padding: 0 4px; }
</style>
