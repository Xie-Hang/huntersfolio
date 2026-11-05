<script lang="ts">
  // The monster's parts as a row of targets under the stage. Click one to aim at it.
  import { input } from '../../pad.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { effCls, effName, pct } from '../../fmt';
  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const w = $derived(E.currentWeapon(h));
  const tp = $derived(M.parts.find(p => p.id === h.target));
  const tn = $derived(tp ? (M.partNote?.(h, tp.id) ?? null) : null);
</script>

<section class="panel partspanel" aria-label="Parts">
    <div class="ph"><span class="label">Aim at a part · {input.mode === 'pad' ? 'LB / RB' : 'click one'}</span><span class="label aimhint">{#if tp}<b>{tp.name}:</b> {tn ? tn.hint : m.parts[tp.id].broken ? 'Broken. Hits here still damage it.' : tp.hint}{:else}{input.mode === 'pad' ? 'LB / RB or select a part to aim' : 'Click a part to aim at it'}{/if}</span></div>
    <div class="parts row" data-coach="parts" style="--n:{M.parts.length}">
      {#each M.parts as p (p.id)}
        {@const st = m.parts[p.id]}
        {@const on = h.target === p.id}
        {@const e = p.eff[w.type]}
        {@const reach = E.canHit(h, w) && E.reachable(h, p.id, w)}
        {@const note = M.partNote?.(h, p.id) ?? null}
        <button class="part" class:on class:broken={st.broken} aria-pressed={on} disabled={!!h.over} onclick={() => game.target(p.id)}>
          <span class="row">
            <span class="nm">{p.name}</span>
            <span style="display:flex;gap:8px;align-items:baseline">
              {#if !st.broken}
                {#if !reach}<span class="chip sm none">{m.under ? 'Underground' : 'Out of reach'}</span>
                {:else}<span class="chip sm {effCls(e)}">{w.type}: {effName(e)}</span>{/if}
                {#if st.exposed > 0}<span class="chip sm exposed">Exposed · {st.exposed}</span>{/if}
              {/if}
              {#if note}<span class="chip sm exposed">{note.chip}</span>{/if}
              <span class="mono" style="color:{st.broken ? 'var(--ember-soft)' : 'var(--soft)'}">{st.broken ? (note ? '' : 'Broken') : `${st.hp} / ${st.max}`}</span>
            </span>
          </span>
          {#if !st.broken}<span class="bar"><i style="width:{pct(st.hp, st.max)}%;background:{on ? 'var(--gold)' : '#8c7a62'}"></i></span>{/if}
          <span class="hint">{note ? note.hint : st.broken ? 'Hits here still damage it.' : p.hint}</span>
        </button>
      {/each}
    </div>
</section>

<style>
  .aimhint { text-align: right; color: var(--soft); }
  .aimhint b { color: var(--gold-hi); font-weight: 600; }
</style>
