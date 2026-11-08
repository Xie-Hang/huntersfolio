<script lang="ts">
  /** Text with **game terms** marked: they render bold, so a player can tell a rule word (Pierce, Block, Snare) from
   *  plain English. A term with a Hunter's Notes entry also opens it when selected, except inside a button (where a
   *  select belongs to the button) or a hover tip (which can't be selected). Drawing a term counts as meeting it. */
  import { noteFor } from '../../engine';
  import { met, openNote } from '../notes.svelte';
  /** self: the Hunter's Notes entry this text belongs to, so a term never links to the page you're on */
  let { text, self = '', quiet = false }: { text: string; self?: string; quiet?: boolean } = $props();
  const parts = $derived(text.split(/\*\*(.+?)\*\*/));
  $effect(() => { for (let i = 1; i < parts.length; i += 2) met(parts[i], quiet); });
  /** a term link only where a select can reach it */
  function link(el: HTMLElement) {
    if (el.closest('button, [role="button"], [role="tooltip"], .dtip, a')) { el.classList.remove('glink'); el.removeAttribute('tabindex'); el.removeAttribute('role'); }
  }
</script>
{#each parts as p, i}{#if i % 2}{#if noteFor(p) && noteFor(p) !== self}<span class="term glink" role="link" tabindex="0" use:link onclick={e => { e.stopPropagation(); openNote(p); }} onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNote(p); } }}>{p}</span>{:else}<strong class="term">{p}</strong>{/if}{:else}{p}{/if}{/each}
<style>
  .term { font-weight: 700; }
  .glink { cursor: pointer; text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 35%, transparent); text-underline-offset: 3px; }
  .glink:hover, .glink:focus-visible { text-decoration-color: currentColor; outline: none; }
</style>
