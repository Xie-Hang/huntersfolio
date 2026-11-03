<script lang="ts">
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { effCls, effName, pct } from '../../fmt';
  import { shake } from '../../fx';
  import Plate from '../../parts/Plate.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const w = $derived(E.currentWeapon(h));
  const headName = $derived(M.parts.find(p => p.id === M.head)!.name.toLowerCase());
  const mud = $derived(m.wallow > 0 && !m.parts.hide?.broken);
</script>

<section class="panel" aria-label="The monster" use:shake={game.shakes.mon}>
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="ph"><h2>{M.name}</h2><span class="label">{M.kind} · {M.elem}</span></div>
    <div class="plate"><Plate mon={h.mid} hunt={h} /></div>
    <div class="hpline">
      <div class="ph"><span class="label">HP</span><span class="mono">{m.hp} / {m.max}</span></div>
      <div class="bar" style="height:8px"><i style="width:{pct(m.hp, m.max)}%;background:var(--ember)"></i></div>
    </div>
    {#if E.carries(h, 'Blunt')}
      <div class="hpline">
        <div class="ph"><span class="label" style="color:var(--daze)">Daze · from Blunt hits to the {headName}</span><span class="mono">{m.dazeLock ? 'Recovering' : `${m.daze} / ${m.dazeMax}`}</span></div>
        <div class="bar" class:locked={m.dazeLock > 0}><i style="width:{pct(m.daze, m.dazeMax)}%;background:var(--daze)"></i></div>
      </div>
    {/if}
    <div class="chips">
      <span class="chip gale">Weak to {M.weak}</span><span class="chip">Resists {M.resist}</span>
      {#if m.enraged}<span class="chip hot">Enraged</span>{/if}
      {#if mud}<span class="chip mud">Mud-caked</span>{/if}
      {#if m.air}<span class="chip gale">Airborne</span>{/if}
      {#if m.under}<span class="chip mud">Underground</span>{/if}
      {#if m.molten > 0}<span class="chip hot">Molten · {m.molten} turn{m.molten > 1 ? 's' : ''}</span>{/if}
      {#if E.canCapture(h)}<span class="chip hot">Capturable</span>{/if}
    </div>
    <div class="ph rule"><span class="label">Parts</span><span class="label">Tap to aim</span></div>
    <div class="parts">
      {#each M.parts as p (p.id)}
        {@const st = m.parts[p.id]}
        {@const on = h.target === p.id}
        {@const e = p.eff[w.type]}
        {@const reach = E.canHit(h, w) && E.reachable(h, p.id, w)}
        <button class="part" class:on class:broken={st.broken} aria-pressed={on} disabled={!!h.over} onclick={() => game.target(p.id)}>
          <span class="row">
            <span class="nm">{p.name}</span>
            <span style="display:flex;gap:8px;align-items:baseline">
              {#if !st.broken}
                {#if !reach}<span class="chip sm none">{m.under ? 'Underground' : 'Out of reach'}</span>
                {:else}<span class="chip sm {effCls(e)}">{w.type}: {effName(e)}</span>{/if}
              {/if}
              <span class="mono" style="color:{st.broken ? 'var(--ember-soft)' : 'var(--soft)'}">{st.broken ? 'BROKEN' : `${st.hp} / ${st.max}`}</span>
            </span>
          </span>
          {#if !st.broken}<span class="bar"><i style="width:{pct(st.hp, st.max)}%;background:{on ? 'var(--gold)' : '#8c7a62'}"></i></span>{/if}
          <span class="hint">{st.broken ? 'Hits here still damage it.' : p.hint}</span>
        </button>
      {/each}
    </div>
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'mon') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>
