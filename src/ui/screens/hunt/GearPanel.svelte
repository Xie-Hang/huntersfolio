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
  const em = $derived(E.elemMult(w.elem, h.mid));
  const elemColor = $derived(em > 1 ? 'var(--gale)' : em < 1 ? 'var(--ember-soft)' : 'var(--muted)');

  const gOk = $derived(!over && n >= 1);
  const cOk = $derived(!over && n === 2 && !h.chargePending);
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
        <span class="mn">{mv.name}{#if mv.flow}<span class="tag flow">Flow</span>{/if}{#if mv.daze}<span class="tag daze">Daze</span>{/if}{#if mv.pin}<span class="tag pin">Pin</span>{/if}</span>
        <span class="md">{halfAir ? `${Math.round(mv.dmg / 2)} dmg (airborne)` : `${mv.dmg} dmg`}{mv.part ? ` · ×${mv.part} toward breaks` : ''}{mv.daze ? ` · daze +${mv.daze}` : ''}</span>
      </span>
      <span class="need" aria-label="Needs {needLabel(mv.need)}">{glyphs(mv.need)}</span>
    </button>
  {/each}

  <div class="divider"><span class="label">Or spend selected dice</span><span class="label">{n} selected</span></div>
  <button class="move dash {gOk ? 'ready' : 'no'}" aria-disabled={!gOk} onclick={() => gOk && game.guard()}>
    <span><span class="mn">Guard</span><span class="md">−{h.arm.guard} per die{h.arm.blankx2 ? ' · blanks ×2' : ''}</span></span><span class="need">any</span>
  </button>
  <button class="move dash {cOk ? 'ready' : 'no'}" aria-disabled={!cOk} onclick={() => cOk && game.charge()}>
    <span><span class="mn">Charge</span><span class="md">first hit next turn ×2</span></span><span class="need">2</span>
  </button>
  <button class="move dash {sOk ? 'ready' : 'no'}" aria-disabled={!sOk} onclick={() => sOk && game.swap()}>
    <span><span class="mn">Swap to {other.name}</span><span class="md">{other.type} · {other.elem ?? 'No element'}</span></span><span class="need">1</span>
  </button>
  <!-- Always shown, so players learn it exists before it's available. -->
  <button class="move capture {capLive && !E.captureBlocked(h) ? 'live' : ''} {capOk ? 'ready' : 'no'}" aria-disabled={!capOk} onclick={() => capOk && game.capture()}>
    <span>
      <span class="mn">Capture</span>
      <span class="md">
        {#if !capLive}Unlocks at {capAt} HP or less · ends the hunt, part materials ×2
        {:else if E.captureBlocked(h)}Bring it down first
        {:else if n !== 2}Select 2 dice · ends the hunt, part materials ×2
        {:else}Ends the hunt · part materials ×2{/if}
      </span>
    </span>
    <span class="need">2</span>
  </button>

  {#if h.item}
    {@const it = E.ITEMS[h.item]}
    <div class="divider"><span class="label">Item · free action</span><span class="label">{h.itemCharges} left</span></div>
    <button class="move {iOk ? 'ready' : 'no'}" aria-disabled={!iOk} onclick={() => iOk && game.item()}>
      <span><span class="mn">{it.name}</span><span class="md">{it.desc}{h.itemUsed ? ' · used this turn' : it.effect === 'net' && !h.mon.air ? ' · only while it flies' : it.effect === 'blast' && !h.mon.under ? ' · only while it’s underground' : ''}</span></span>
      <span class="need">free</span>
    </button>
  {:else}
    <div class="divider"><span class="label">Item</span><span class="label">none carried</span></div>
  {/if}
</section>
