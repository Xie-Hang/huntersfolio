<script lang="ts">
  // One health bar for the whole fight, like a fighting game: the monster on the left (above its picture), you on the
  // right (above your moves), the turn between (swapped 7 Nov) (Mekkman, Nov 2026, from playtest feedback: "the HP of both together as one panel"). Your side carries what
  // the next hit will take (the striped end), your Block, and your own conditions; the monster's side its weakness.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { pct } from '../../fmt';
  import { shake } from '../../fx';
  import { shows } from '../../reveal';
  import Elem from '../../parts/Elem.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const el = $derived(E.elemsNow(h.mid, h));
  // where your HP will be when your next turn starts: the attack and everything riding on the end of the turn
  const tp = $derived(h.over || !shows(h, 'intent') ? null : E.turnPreview(h));
  const after = $derived(tp ? Math.max(0, Math.min(h.php, tp.hpAfter)) : h.php);
  const net = $derived(h.php - after);
</script>

<section class="panel vs" aria-label="Health">
  <div class="vside mon">
    <div class="vtop">
      <h2 class="vnm">{#if shows(h, 'elements')}<span class="vkind" title="{el.elem} monster"><Elem e={el.elem} /></span>{/if}{M.panelName ?? M.name}</h2>
      {#if shows(h, 'elements')}<span class="vel" data-coach="elems"><span class="chip sm gale"><Elem e={el.weak} />Weak to {el.weak}</span><span class="chip sm"><Elem e={el.resist} />Resists {el.resist}</span></span>{/if}
      <span class="vnum">{m.hp} / {m.max}</span>
    </div>
    <div class="vhb" role="img" aria-label="{M.name}: {m.hp} of {m.max} HP"><i class="vfill" style="width:{pct(m.hp, m.max)}%"></i></div>
  </div>
  <div class="vmid" aria-label="Turn {h.turn}"><span class="t">Turn</span><span class="n">{h.turn}</span></div>
  <div class="vside you" data-coach="you" use:shake={game.shakes.player}>
    <div class="vtop">
      <span class="vnum">{h.php} / {h.pmax}{#if net}{' '}<span class="vnx">→ {after}</span>{/if}</span>
      {#if h.guard > 0}<span class="vblk" title="Block this turn: taken off the next hit"><svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true"><path d="M8 1l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V4z" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>Block {h.guard}</span>{/if}
      <h2 class="vnm">You</h2>
    </div>
    <div class="vhb r" role="img" aria-label="{h.php} of {h.pmax} HP{net ? `, about to take ${net}` : ''}">
      <i class="vfill" style="width:{pct(after, h.pmax)}%"></i>
      {#if net}<i class="vghost" style="right:{pct(after, h.pmax)}%;width:{pct(net, h.pmax)}%"></i>{/if}
    </div>
    <div class="vst">
      {#if h.arm.ward && shows(h, 'all')}<span>Armour −{h.arm.ward} a hit</span>{/if}
      {#if h.whet}<span class="gold">Sharpened: next hit +{Math.round(h.whet * 100)}%</span>{/if}
      {#if h.evade}<span class="gold">Hidden in smoke</span>{/if}
      {#if (m.pInf ?? 0) > 0}<span class="bad inf" title="You lose this much at the end of each turn. It can’t knock you out on its own. A Purging Tonic cures it.">Infected −{m.pInfDmg} · {m.pInf} turn{m.pInf! > 1 ? 's' : ''}</span>{/if}
      {#if (m.pSpark ?? 0) > 0}<span class="bad spk" title="At {E.SPARK_CAP} the charge goes off through you, and Block can’t stop it. Any Blunt move grounds a pip; Grounding Salt clears them.">Spark {m.pSpark} of {E.SPARK_CAP}</span>{/if}
    </div>
    <div class="fx">
      {#each game.floats.filter(f => f.at === 'player') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
    </div>
  </div>
</section>

<style>
  .vel { display: inline-flex; gap: 6px; }
  .vs { grid-column: 1 / -1; order: -2; display: grid; grid-template-columns: minmax(0, 1fr) 72px minmax(0, 1fr); align-items: start; gap: 4px 16px; padding: 8px 16px; }
  .vside { position: relative; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .vtop { display: flex; align-items: center; gap: 10px; min-height: 24px; }
  .you .vtop { justify-content: flex-end; }
  .vnm { margin: 0; font-size: var(--fs-lg); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .vnum { font-variant-numeric: tabular-nums; color: var(--soft); white-space: nowrap; }
  .mon .vnum { margin-left: auto; }
  .you .vnum { margin-right: auto; }
  .you .vst { justify-content: flex-end; }
  .vnx { color: var(--ember-soft); }
  .vblk { display: inline-flex; align-items: center; gap: 5px; padding: 1px 9px; border: 1px solid var(--line-2); border-radius: 999px; font-size: var(--fs-sm); font-weight: 600; white-space: nowrap; }
  .vhb { position: relative; height: 14px; border-radius: 3px; background: #0c0907; box-shadow: inset 0 0 0 1px var(--line-2); overflow: hidden; }
  .vhb .vfill { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, #b8452a, var(--ember)); transition: width .35s ease; }
  .vhb.r .vfill { inset: 0 0 0 auto; background: var(--life); }
  .vhb .vghost { position: absolute; top: 0; bottom: 0; background: repeating-linear-gradient(-45deg, var(--ember) 0 6px, #a8522a 6px 12px); animation: ghost 1.2s ease-in-out infinite; }
  .vst { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; font-size: var(--fs-sm); color: var(--soft); min-height: 0; }
  .vst:empty { display: none; }
  .vst .gold { color: var(--gold-hi); }
  .vst .bad { font-weight: 700; } .vst .inf { color: #9fc062; } .vst .spk { color: #f0dd6e; }
  .vkind { display: inline-flex; align-items: center; margin-right: 6px; font-size: var(--fs-md); }
  .vtop .chip { flex: none; white-space: nowrap; }
  .vmid { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 46px; border: 1px solid var(--line-2); border-radius: 6px; background: var(--raise); }
  .vmid .t { font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--muted); }
  .vmid .n { font-weight: 600; font-size: 22px; line-height: 1; color: var(--gold-hi); font-variant-numeric: tabular-nums; }
  .fx { position: absolute; inset: 0; pointer-events: none; }
  @media (prefers-reduced-motion: reduce) { .vhb .vfill { transition: none; } .vhb .vghost { animation: none; } }
</style>
