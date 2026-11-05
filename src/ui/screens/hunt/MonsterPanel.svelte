<script lang="ts">
  import { input } from '../../pad.svelte';
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { effCls, effName, pct } from '../../fmt';
  import { shake } from '../../fx';
  import Plate from '../../parts/Plate.svelte';
  import Telegraph from './Telegraph.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const w = $derived(E.currentWeapon(h));
  const headName = $derived(M.parts.find(p => p.id === M.head)!.name.toLowerCase());
  const mud = $derived(m.wallow > 0 && !m.parts.hide?.broken);
  const meter = $derived(M.meter?.(h) ?? null);
  const TONE = { gold: 'var(--gold-hi)', ember: 'var(--ember-soft)', ice: '#b9d3f0', gale: '#8fc3c9', stone: '#c9b89c' } as const;
</script>

<section class="panel stage" aria-label="The monster" use:shake={game.shakes.mon}>
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="hpline">
      <div class="ph"><h2>{M.name} <span class="label kind"><Elem e={M.elem} />{M.elem}</span><span class="chip sm gale hdchip"><Elem e={M.weak} />Weak to {M.weak}</span><span class="chip sm hdchip"><Elem e={M.resist} />Resists {M.resist}</span></h2><span class="mono">{m.hp} / {m.max} HP</span></div>
      <div class="bar" style="height:10px"><i style="width:{pct(m.hp, m.max)}%;background:var(--ember)"></i></div>
    </div>
    <div class="stagebody">
      <div class="plate"><Plate mon={h.mid} hunt={h} scene /></div>
      <Telegraph />
    </div>
    {#if !h.over && E.canCapture(h)}<div class="stagetip capture">It's weak enough to capture. Select 2 dice and use Capture for double part materials.</div>{/if}
    <div class="metarow">
      <div class="meters">
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
      <div class="hpline">
        <div class="heads">
          <span class="label" style="color:var(--daze)">Daze</span>
          {#each M.heads.filter(x => !m.parts[x].broken) as hd (hd)}
            {@const reel = (m.reel?.[hd] ?? 0) > 0}
            {@const v = m.headDaze?.[hd] ?? 0}
            <div class="hd" aria-label="{M.parts.find(p => p.id === hd)!.name} daze: {reel ? 'reeling' : `${v} of ${E.HEAD_DAZE_MAX}`}">
              <span class="label">{M.parts.find(p => p.id === hd)!.name.replace(' Head', '')}{reel ? ' · Reeling' : ''}</span>
              <div class="bar" class:locked={reel}><i style="width:{pct(v, E.HEAD_DAZE_MAX)}%;background:var(--daze)"></i></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if E.carries(h, 'Blunt')}
      <div class="hpline">
        <div class="ph"><span class="label" style="color:var(--daze)">Daze · Blunt hits to the {headName}</span><span class="mono">{m.dazeLock ? 'Recovering' : `${m.daze} / ${m.dazeMax}`}</span></div>
        <div class="bar" class:locked={m.dazeLock > 0}><i style="width:{pct(m.daze, m.dazeMax)}%;background:var(--daze)"></i></div>
      </div>
    {/if}
      </div>
    <div class="chips">
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
    </div>
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'mon') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>

<style>
  .kind { margin-left: 10px; font-size: var(--fs-sm); font-weight: 400; }
  .metarow { display: flex; gap: 10px 18px; align-items: flex-end; flex-wrap: wrap; }
  .metarow .meters { flex: 1 1 260px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px 16px; min-width: 0; }
  .metarow .chips:empty { display: none; }
  .metarow .ph { flex-wrap: nowrap; }
  .metarow .ph .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .metarow .ph .mono { white-space: nowrap; flex: none; }
  .hdchip { margin-left: 8px; vertical-align: middle; font-weight: 400; }
  .metarow .meters:empty { display: none; }
  .metarow .chips { flex: 0 1 auto; }
  .stagebody { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 14px; align-items: start; }
  @media (max-width: 720px) { .stagebody { grid-template-columns: minmax(0, 1fr); } }
  .heads { display: flex; align-items: center; gap: 12px; }
  .heads .hd { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
  .heads .hd .bar { flex: 1; }
  .heads .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pipbar { display: flex; gap: 6px; }
  .pipbar i { flex: 1; height: 10px; border-radius: 2px; border: 1px solid var(--line-2); background: transparent; }
  .pipbar i.f { background: var(--c); border-color: var(--c); }
</style>
