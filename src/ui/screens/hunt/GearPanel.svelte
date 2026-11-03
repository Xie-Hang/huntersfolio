<script lang="ts">
  // Current weapon's moves, then the dice actions (guard, charge, swap, capture) and the item.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { glyphs, needLabel } from '../../fmt';

  const h = $derived(game.hunt!);
  const w = $derived(E.currentWeapon(h));
  const other = $derived(E.otherWeapon(h));
  const over = $derived(!!h.over);
  const n = $derived(game.sel.length);
  const sg = $derived(E.SIGNATURES[w.type]);
  const halfAir = $derived(E.airborneHalf(h, w));
  const iceNow = $derived(h.mon.plating > 0);
  const iceLine = $derived.by(() => { const n = Math.min(h.mon.plating, E.iceBreak(w)); return n >= h.mon.plating ? `Breaks all the ice (${n} layer${n > 1 ? 's' : ''}). No damage` : `Breaks ${n} layer of ice. No damage`; });
  const exposedNow = $derived(h.mon.parts[h.target]?.exposed > 0 && !h.mon.parts[h.target].broken);
  /** the number the move will roughly deal now: air halves it, an exposed target adds Expose's bonus */
  const shownDmg = (d: number) => { let x = halfAir ? Math.round(d / 2) : d; if (exposedNow) x = Math.round(x * E.EXPOSE_DMG); return x; };
  const em = $derived(E.elemMult(w.elem, h.mid));
  const elemColor = $derived(em > 1 ? 'var(--gale)' : em < 1 ? 'var(--ember-soft)' : 'var(--muted)');

  const gOk = $derived(!over && n >= 1);
  const cd = $derived(E.chargeDice(h));
  const cOk = $derived(!over && n === cd && !h.chargePending);
  const sOk = $derived(!over && n === 1);
  const capLive = $derived(!over && E.canCapture(h));
  const capOk = $derived(capLive && n === 2 && !E.captureBlocked(h));
  const capAt = $derived(Math.floor(h.mon.max * E.CAPTURE_AT));
  const iOk = $derived(!over && E.itemUsable(h));
</script>

<section class="panel" aria-label="Your gear">
  <div class="wname">
    <div class="ph" style="gap:8px">
      <h2 style="margin:0;font-weight:600;font-size:var(--fs-lg)">{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}</h2>
      <span class="avg">{E.avgVs(w, h.mid)} avg</span>
    </div>
    <span class="elem" style="color:{elemColor}">{w.type} · {w.elem ?? 'No element'}{em > 1 ? ' · hits weakness' : em < 1 ? ' · resisted' : ''}{halfAir ? ' · half damage in the air' : ''}</span>
  </div>
  <p class="sigline"><span class="tag {sg.tag}" style="margin:0 6px 0 0">{sg.name}</span>{sg.text}</p>
  {#if !over && E.cantHitReason(h, w)}<p class="cant">{E.cantHitReason(h, w)} Swap, Guard or Charge instead.</p>{/if}

  {#each w.moves as mv, i}
    {@const ok = E.canUseMove(h, i)}
    <button class="move {ok ? 'ready' : 'no'}" aria-disabled={!ok} onclick={() => ok && game.move(i)}>
      <span>
        <span class="mn">{mv.name}{#if mv.flow}<span class="tag flow">Flow</span>{/if}{#if mv.daze}<span class="tag daze">Daze</span>{/if}{#if mv.expose}<span class="tag expose">Expose</span>{/if}</span>
        <span class="md">{#if iceNow}{iceLine}{:else}{shownDmg(mv.dmg)} damage{halfAir ? ', halved in the air' : ''}{exposedNow ? ', exposed' : ''}{mv.part ? ` · ×${mv.part} toward breaks` : ''}{mv.daze ? ` · Daze +${mv.daze}` : ''}{/if}</span>
      </span>
      <span class="need" aria-label="Needs {needLabel(mv.need)}">{glyphs(mv.need)}</span>
    </button>
  {/each}

  <div class="divider"><span class="label">Or spend selected dice</span><span class="label">{n} selected</span></div>
  <button class="move dash {gOk ? 'ready' : 'no'}" aria-disabled={!gOk} onclick={() => gOk && game.guard()}>
    <span><span class="mn">Guard</span><span class="md">Blocks {h.arm.guard} per die{h.arm.blankx2 ? ' · Blanks block double' : ''}</span></span><span class="need">Any</span>
  </button>
  <button class="move dash {cOk ? 'ready' : 'no'}" aria-disabled={!cOk} onclick={() => cOk && game.charge()}>
    <span><span class="mn">Charge</span><span class="md">Your first hit next turn deals double</span></span><span class="need">{cd}</span>
  </button>
  <button class="move dash {sOk ? 'ready' : 'no'}" aria-disabled={!sOk} onclick={() => sOk && game.swap()}>
    <span><span class="mn">Swap to {other.name}</span><span class="md">{other.type} · {other.elem ?? 'No element'}</span></span><span class="need">1</span>
  </button>
  <!-- Always shown, so players learn it exists before it's available. -->
  <button class="move capture {capLive && !E.captureBlocked(h) ? 'live' : ''} {capOk ? 'ready' : 'no'}" aria-disabled={!capOk} onclick={() => capOk && game.capture()}>
    <span>
      <span class="mn">Capture</span>
      <span class="md">
        {#if !capLive}Unlocks at {capAt} HP or less. Ends the hunt with double part materials
        {:else if E.captureBlocked(h)}{E.monsterOf(h).flier ? 'Bring it down first' : 'Drive it to the surface first'}
        {:else if n !== 2}Select 2 dice. Ends the hunt with double part materials
        {:else}Ends the hunt with double part materials{/if}
      </span>
    </span>
    <span class="need">2</span>
  </button>

  {#if h.item}
    {@const it = E.ITEMS[h.item]}
    <div class="divider"><span class="label">Item · Free action</span><span class="label">{h.itemCharges} left</span></div>
    <button class="move {iOk ? 'ready' : 'no'}" aria-disabled={!iOk} onclick={() => iOk && game.item()}>
      <span><span class="mn">{it.name}</span><span class="md">{it.desc}{h.itemUsed ? ' · Used this turn' : it.effect === 'net' && !h.mon.air ? ' · Only while it flies' : it.effect === 'blast' && !h.mon.under ? ' · Only while it’s underground' : it.effect === 'thaw' && !h.mon.plating ? ' · Only while it has ice' : ''}</span></span>
      <span class="need">Free</span>
    </button>
  {:else}
    <div class="divider"><span class="label">Item</span><span class="label">None carried</span></div>
  {/if}
</section>
