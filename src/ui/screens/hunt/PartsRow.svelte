<script lang="ts">
  // The monster's parts as a row of targets under the stage. Click one to aim at it.
  import { input } from '../../pad.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { effCls, effWord, pct } from '../../fmt';
  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const w = $derived(E.currentWeapon(h));
  const tp = $derived(M.parts.find(p => p.id === h.target));
  const tn = $derived(tp ? (M.partNote?.(h, tp.id) ?? null) : null);
</script>

<section class="panel partspanel" aria-label="Parts" data-coach="parts">
    <div class="ph"><span class="label aimword">Aim{input.mode === 'pad' ? ' · LB / RB' : ''}</span><span class="label aimhint">{#if tp}<b>{tp.name}:</b> {tn ? tn.hint : m.parts[tp.id].broken ? 'Broken. Hits here still damage it.' : tp.hint}{:else}{input.mode === 'pad' ? 'LB / RB or select a part to aim' : 'Select a part to aim at it'}{/if}</span></div>
    <div class="parts row" class:four={M.parts.length >= 4} style="--n:{M.parts.length}">
      {#each M.parts as p (p.id)}
        {@const st = m.parts[p.id]}
        {@const on = h.target === p.id}
        {@const e = p.eff[w.type]}
        {@const reach = E.canHit(h, w) && E.reachable(h, p.id, w)}
        {@const note = M.partNote?.(h, p.id) ?? null}
        <button class="part" data-coach="part-{p.id}" class:on class:broken={st.broken} aria-pressed={on} disabled={!!h.over} onclick={() => game.target(p.id)}>
          <span class="pline"><span class="nm" title={p.name}>{p.name}</span><span class="mono" style="color:{st.broken ? 'var(--ember-soft)' : 'var(--soft)'}">{st.broken ? (note ? '' : 'Broken') : `${st.hp} / ${st.max}`}</span></span>
          <span class="pline">
            {#if !st.broken}
              {#if !reach}<span class="chip sm none">{m.under ? 'Underground' : m.air ? 'In the air' : 'Out of reach'}</span>
              {:else}<span class="chip sm {effCls(e)}">{effWord(e)}</span>{/if}
              {#if st.exposed > 0}<span class="chip sm exposed">Exposed · {st.exposed}</span>{/if}
            {/if}
            {#if note}<span class="chip sm exposed">{note.chip}</span>{/if}
          </span>
          <!-- the HP bar on its own line at the bottom, so every box's bar lines up (Mekkman, Nov 2026) -->
          {#if !st.broken}<span class="bar pbar"><i style="width:{pct(st.hp, st.max)}%;background:{on ? 'var(--gold)' : '#8c7a62'}"></i></span>{/if}
          <span class="hint">{note ? note.hint : st.broken ? 'Hits here still damage it.' : p.hint}</span>
        </button>
      {/each}
    </div>
</section>

<style>
  /* line 1: name (shortens with … if long) and HP; line 2: the weapon's tag beside the HP bar. Nothing wraps, so
     long names never push the tag and HP about (Mekkman) */
  .pline { display: flex; gap: 8px; align-items: center; min-width: 0; }
  .pline .nm { flex: 1 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pline .mono { flex: none; white-space: nowrap; }
  .pline .chip { flex: none; white-space: nowrap; padding-block: 1px; line-height: 1.35; }
  .pline:first-child { line-height: 1.2; }
  /* the bar gives way first: with a stance chip beside the tag, a narrow part keeps both chips and loses the bar */
  /* two chips that don't fit side by side (its tag and Exposed, on a narrow part): the second drops under (Nov 2026) */
  .pline:nth-child(2) { flex-wrap: wrap; row-gap: 4px; }
  /* every box in the row is as tall as the tallest, and the HP bar sits at the bottom of each */
  .part > .pbar { margin-top: auto; width: 100%; }
  /* four parts (the Wanderer Sovereign) still fit on one row */
  .parts.row.four { flex-wrap: nowrap; }
  .parts.row.four .part { flex: 1 1 0; }
  .aimhint { text-align: right; color: var(--soft); }
  .aimhint b { color: var(--gold-hi); font-weight: 600; }
</style>
