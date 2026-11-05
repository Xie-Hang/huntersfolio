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
  const uid = `st${Math.random().toString(36).slice(2, 7)}`;
  const isFlier = $derived(!!M.flier);
  /** The monster's condition, each with what it does and how to answer it (playtest: players saw "Enraged" or
   *  "Ice plating" with no idea what it meant). Hover, or move a controller's focus onto it, to read. */
  const statuses = $derived.by(() => {
    const out: { key: string; label: string; cls: string; desc: string }[] = [];
    if (m.enraged) out.push({ key: 'enr', label: 'Enraged', cls: 'hot', desc: 'Below half HP it fights harder for the rest of the hunt: its attacks hit harder and some of its moves change. Read its next move every turn.' });
    if (mud) out.push({ key: 'mud', label: `Mud-caked · ${m.wallow} turn${m.wallow > 1 ? 's' : ''}`, cls: 'mud', desc: 'Mud halves damage to its hide until it dries. Aim at another part meanwhile, or use Pierce, which ignores the mud.' });
    if (m.air) out.push({ key: 'air', label: 'Airborne', cls: 'gale', desc: `In the air, Cut and Blunt deal half damage and some parts are out of reach. Pierce hits it normally${isFlier ? ', and Pinning Shot or a Weighted Net brings it down' : ''}. It can't be captured until it lands.` });
    if (m.under) out.push({ key: 'under', label: 'Underground', cls: 'mud', desc: 'Only Blunt reaches it below ground. A heavy Blunt hit drives it up, dazed, and cancels what it was digging toward. Otherwise, guard for what comes up.' });
    if (m.plating > 0) out.push({ key: 'ice', label: `Ice plating · ${m.plating} layer${m.plating > 1 ? 's' : ''}`, cls: 'ice', desc: 'Each hit breaks a layer of ice instead of dealing damage (a Cut hit breaks two), and uses up a charge or whetstone bonus. Clear the ice first. A Firepot melts it all.' });
    if (m.molten > 0) out.push({ key: 'molt', label: `Molten · ${m.molten} turn${m.molten > 1 ? 's' : ''}`, cls: 'hot', desc: `Its shell is molten: every Cut or Blunt hit burns you ${m.enraged ? 8 : 5}. Pierce is safe, or guard and wait it out.` });
    if ((m.shell ?? 0) > 0) out.push({ key: 'shell', label: 'In its shell', cls: '', desc: 'Your hits deal half until it comes out on its next action. A good turn to guard, charge or reroll for something big.' });
    if ((m.slime ?? 0) > 0) out.push({ key: 'slime', label: `Slime burning you · ${m.slime} turn${m.slime! > 1 ? 's' : ''}`, cls: 'hot', desc: 'The slime burns you a little at the end of each turn. It can\'t knock you out on its own. Breaking its foot stops the slime for good.' });
    if ((m.mirage ?? 0) > 0) out.push({ key: 'mir', label: `Images · ${m.mirage} turn${m.mirage! > 1 ? 's' : ''}`, cls: 'ice', desc: `Mirror images surround it: only your first hit each turn lands; later hits shatter an image. Make that first hit count (charge it). ${(m.hits ?? 0) > 0 ? 'You have already landed this turn\'s hit.' : ''}` });
    if (E.canCapture(h)) out.push({ key: 'cap', label: 'Capturable', cls: 'hot', desc: `At ${Math.round(E.CAPTURE_AT * 100)}% HP or less it can be captured: set a Snare (2 dice). It closes when you end your turn unless its move hits you for ${E.CHARGE_BREAK} or more. Double part materials.` });
    return out;
  });
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
    {#if !h.over && E.canCapture(h) && !h.snareSet}<div class="stagetip capture">{h.snares ? `It's weak enough to capture. Set a Snare (2 dice) and guard: it holds unless you take ${E.CHARGE_BREAK}+ this turn.` : 'It\'s weak enough to capture, but you have no Snare. Buy them in the Shop next time.'}</div>{/if}
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
    <div class="chips" aria-label="Its condition">
      {#each statuses as st (st.label)}
        <button type="button" class="chip stchip {st.cls}" aria-describedby="{uid}-{st.key}">{st.label}<span class="i" aria-hidden="true">?</span>
          <span class="stip" id="{uid}-{st.key}" role="tooltip">{st.desc}</span>
        </button>
      {/each}
    </div>
    </div>
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'mon') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>

<style>
  .stchip { position: relative; cursor: help; font: inherit; font-family: var(--f-body); font-size: var(--fs-sm); background: transparent; display: inline-flex; align-items: center; gap: 6px; }
  .stchip .i { display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: 50%; border: 1px solid currentColor; font-size: 10px; font-weight: 600; opacity: .8; }
  .stchip:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
  .stip { position: absolute; right: 0; top: calc(100% + 8px); z-index: 40; width: 280px; padding: 10px 12px; border: 1px solid var(--gold); border-radius: 4px; background: var(--raise); color: var(--fg); font-size: var(--fs-sm); line-height: 1.45; text-align: left; white-space: normal; box-shadow: 0 8px 24px rgba(0, 0, 0, .5); opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .12s, transform .12s, visibility .12s; pointer-events: none; }
  .stchip:hover .stip, .stchip:focus-visible .stip, .stchip:focus .stip { opacity: 1; visibility: visible; transform: none; }
  @media (prefers-reduced-motion: reduce) { .stip { transition: none; } }
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
