<script lang="ts">
  import { input } from '../../pad.svelte';
  import Elem from '../../parts/Elem.svelte';
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
  const meter = $derived(M.meter?.(h) ?? null);
  const TONE = { gold: 'var(--gold-hi)', ember: 'var(--ember-soft)', ice: '#b9d3f0', gale: '#8fc3c9', stone: '#c9b89c' } as const;
</script>

<section class="panel" aria-label="The monster" use:shake={game.shakes.mon}>
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="ph"><h2>{M.name}</h2><span class="label">{M.kind} · <Elem e={M.elem} />{M.elem}</span></div>
    <div class="plate"><Plate mon={h.mid} hunt={h} scene /></div>
    <div class="hpline">
      <div class="ph"><span class="label">HP</span><span class="mono">{m.hp} / {m.max}</span></div>
      <div class="bar" style="height:8px"><i style="width:{pct(m.hp, m.max)}%;background:var(--ember)"></i></div>
    </div>
    {#if meter}
      <div class="hpline" aria-label="{meter.label}: {meter.value} of {meter.max}">
        <div class="ph"><span class="label" style="color:{TONE[meter.tone ?? 'gold']}">{meter.label}</span><span class="mono">{meter.note ?? `${meter.value} / ${meter.max}`}</span></div>
        {#if meter.pips}
          <div class="pipbar">{#each Array(meter.max) as _, i}<i class:f={i < meter.value} style="--c:{TONE[meter.tone ?? 'gold']}"></i>{/each}</div>
        {:else}
          <div class="bar"><i style="width:{pct(meter.value, meter.max)}%;background:{TONE[meter.tone ?? 'gold']}"></i></div>
        {/if}
      </div>
    {/if}
    {#if E.carries(h, 'Blunt') && M.heads}
      {#each M.heads as hd (hd)}
        {@const reel = (m.reel?.[hd] ?? 0) > 0}
        {@const v = m.headDaze?.[hd] ?? 0}
        <div class="hpline">
          <div class="ph"><span class="label" style="color:var(--daze)">Daze · {M.parts.find(p => p.id === hd)!.name}</span><span class="mono">{reel ? 'Reeling' : `${v} / ${E.HEAD_DAZE_MAX}`}</span></div>
          <div class="bar" class:locked={reel}><i style="width:{pct(v, E.HEAD_DAZE_MAX)}%;background:var(--daze)"></i></div>
        </div>
      {/each}
    {:else if E.carries(h, 'Blunt')}
      <div class="hpline">
        <div class="ph"><span class="label" style="color:var(--daze)">Daze · from Blunt hits to the {headName}</span><span class="mono">{m.dazeLock ? 'Recovering' : `${m.daze} / ${m.dazeMax}`}</span></div>
        <div class="bar" class:locked={m.dazeLock > 0}><i style="width:{pct(m.daze, m.dazeMax)}%;background:var(--daze)"></i></div>
      </div>
    {/if}
    <div class="chips">
      <span class="chip gale"><Elem e={M.weak} />Weak to {M.weak}</span><span class="chip"><Elem e={M.resist} />Resists {M.resist}</span>
      {#if m.enraged}<span class="chip hot">Enraged</span>{/if}
      {#if mud}<span class="chip mud">Mud-caked</span>{/if}
      {#if m.air}<span class="chip gale">Airborne</span>{/if}
      {#if m.under}<span class="chip mud">Underground</span>{/if}
      {#if m.plating > 0}<span class="chip ice">Ice plating · {m.plating} layer{m.plating > 1 ? 's' : ''}</span>{/if}
      {#if m.molten > 0}<span class="chip hot">Molten · {m.molten} turn{m.molten > 1 ? 's' : ''}</span>{/if}
      {#if (m.shell ?? 0) > 0}<span class="chip">In its shell · your hits deal ½</span>{/if}
      {#if (m.slime ?? 0) > 0}<span class="chip hot">Slime burning you · {m.slime} turn{m.slime! > 1 ? 's' : ''}</span>{/if}
      {#if (m.mirage ?? 0) > 0}<span class="chip ice">Images · {m.mirage} turn{m.mirage! > 1 ? 's' : ''} · {(m.hits ?? 0) > 0 ? 'more hits this turn strike an image' : 'only your first hit this turn lands'}</span>{/if}
      {#if E.canCapture(h)}<span class="chip hot">Capturable</span>{/if}
    </div>
    <div class="ph rule"><span class="label">Parts</span><span class="label">{input.mode === 'pad' ? 'LB / RB or select a part to aim' : 'Click a part to aim at it'}</span></div>
    <div class="parts" data-coach="parts">
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
                {#if st.exposed > 0}<span class="chip sm exposed">Exposed · {st.exposed}</span>{/if}
              {/if}
              <span class="mono" style="color:{st.broken ? 'var(--ember-soft)' : 'var(--soft)'}">{st.broken ? 'Broken' : `${st.hp} / ${st.max}`}</span>
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

<style>
  .pipbar { display: flex; gap: 6px; }
  .pipbar i { flex: 1; height: 10px; border-radius: 2px; border: 1px solid var(--line-2); background: transparent; }
  .pipbar i.f { background: var(--c); border-color: var(--c); }
</style>
