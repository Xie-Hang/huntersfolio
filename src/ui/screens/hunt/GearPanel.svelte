<script lang="ts">
  import CostDie from '../../parts/CostDie.svelte';
  import WeaponArt from '../../parts/WeaponArt.svelte';
  import Key from '../../parts/Key.svelte';
  import Icon from '../../parts/Icon.svelte';
  // Current weapon's moves, then the dice actions (guard, charge, swap, capture) and the item.
  import { MOVE_KEYS } from '../../keys';
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { needLabel, needMarks, elemLabel, markOf } from '../../fmt';
  import { shows } from '../../reveal';
  import { detail, full as fullText } from '../../detail.svelte';
  const full = $derived(shows(game.hunt, 'all'));

  const h = $derived(game.hunt!);
  const w = $derived(E.currentWeapon(h));
  const other = $derived(E.otherWeapon(h));
  /** the monster's hint: moves it names are counters to what it's doing; naming the other weapon means swap */
  const tipText = $derived(E.tip(h));
  const inc = $derived(E.incoming(h));
  const selGuard = $derived(game.sel.filter(i => !h.dice[i]?.used).reduce((a, i) => a + E.guardOf(h, i), 0));
  /** charging now would be broken by this turn's hit (playtest: nobody knew a hit can break a charge) */
  const chargeRisk = $derived(!h.over && !h.chargePending && (inc?.net ?? 0) > 0);
  const swapCounter = $derived(!!tipText && !h.over && tipText.includes(other.name) && other.moves.some(m => tipText.includes(m.name)) && !w.moves.some(m => tipText.includes(m.name)));
  const over = $derived(!!h.over);
  const n = $derived(game.sel.length);
  const sg = $derived(E.SIGNATURES[w.type]);
  const halfAir = $derived(E.airborneHalf(h, w) && E.canHit(h, w)); // fliers (Nov 2026) block non-bows outright: the reason line says so instead
  const iceNow = $derived(h.mon.plating > 0);
  const iceLine = $derived.by(() => { const n = Math.min(h.mon.plating, E.plateBreak(h, w)), word = E.monsterOf(h).plateWord ?? 'ice', hot = (E.monsterOf(h).burn?.(h, w) ?? 0) > 0 && !h.arm.burnproof ? `, burns you ${E.monsterOf(h).burn!(h, w)}` : ''; return n >= h.mon.plating ? `Breaks all the ${word === 'scale' ? 'scales' : word} (${n} layer${n > 1 ? 's' : ''}). No damage${hot}` : `Breaks ${n} layer of ${word}. No damage${hot}`; });
  const exposedNow = $derived(h.mon.parts[h.target]?.exposed > 0 && !h.mon.parts[h.target].broken);
  /** the number the move will roughly deal now: air halves it, an exposed target adds Expose's bonus */
  const shownDmg = (d: number) => { let x = halfAir ? Math.round(d / 2) : d; if (exposedNow) x = Math.round(x * E.EXPOSE_DMG); return x; };
  /** the status meters of the status weapons you carry (one per status) */
  const smeters = $derived([...new Set(h.weps.map(x => x.status).filter(Boolean))].map(st => ({ st: st!, ...E.statusOf(h, st!) })));
  const STONE: Record<string, string> = { Infect: '#9fc062', Spark: '#f0dd6e', Drain: '#d0545b' };
  const SWHAT: Record<string, string> = { Infect: 'it’s infected for 3 turns', Spark: 'it discharges', Drain: 'you heal' };
  const em = $derived(E.elemMult(w.elem, h.mid, h));
  const elemColor = $derived(em > 1 ? 'var(--gale)' : em < 1 ? 'var(--ember-soft)' : 'var(--muted)');

  /** with nothing selected, the dice each action would take on its own (blanks first; see E.autoDice) */
  const auto = $derived({ guard: n ? null : E.autoDice(h, 'guard'), charge: n ? null : E.autoDice(h, 'charge'), swap: n ? null : E.autoDice(h, 'swap'), capture: n ? null : E.autoDice(h, 'capture') });
  const gOk = $derived(!over && (n >= 1 || !!auto.guard?.length));
  const cd = $derived(E.chargeDice(h));
  const cOk = $derived(!over && !h.chargePending && (n === cd || (n === 0 && !!auto.charge)));
  const buried = $derived(E.swapBuried(h));
  const sOk = $derived(!over && !buried && (n === 1 || (n === 0 && !!auto.swap)));
  // the other weapon suits this roll better: say which move (Nov 2026: how players learn the dice patterns)
  const fits = $derived(n === 0 ? E.swapFits(h) : null);
  const capLive = $derived(!over && E.canCapture(h));
  const capOk = $derived(capLive && E.captureReady(h) && (n === 2 || (n === 0 && !!auto.capture)));
  const capAt = $derived(Math.floor(h.mon.max * E.CAPTURE_AT));
  const iOk = $derived(!over && E.itemUsable(h));
  const freeFaces = $derived(h.dice.filter(d => !d.used).map(d => d.face as string));
  /** the strongest move you can use now (the tutorial points at it) */
  /** gold: the dice you've selected are exactly what this move would use (Nov 2026: grey = can't make it with the
   *  dice left, plain = can, gold = your picked dice make it) */
  const picks = (need: string) => { if (!n) return false; const p = E.pickDice(h, need, game.sel); return !!p && game.sel.every(i => p.includes(i)); };
  const bestReady = $derived(w.moves.reduce((b, mv, i) => (E.canUseMove(h, i) && (i < 2 || shows(h, 'rend')) && (b < 0 || mv.dmg > w.moves[b].dmg) ? i : b), -1));
</script>

<section class="panel gearpanel" aria-label="Your gear">
  <div class="wname">
    <div class="ph" style="gap:8px">
      <h2 style="margin:0;font-weight:600;font-size:var(--fs-lg);display:flex;align-items:center;gap:8px"><WeaponArt id={w.id} size={34} />{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}</h2>
      {#if shows(h, 'elements')}<span class="avg">{E.avgVs(w, h.mid)} avg</span>{/if}
    </div>
    <div class="elemrow">
      {#if !shows(h, 'elements')}<span class="elem" style="color:var(--muted)">{w.type}</span>{:else}<span class="elem" style="color:{elemColor}">{w.type} · <Elem e={markOf(w)} />{elemLabel(w)}{em > 1 ? ' · hits weakness' : em < 1 ? ' · resisted' : ''}{halfAir ? ' · half damage in the air' : ''}</span>{/if}
      <!-- status weapons (Nov 2026): the meter your hits fill on the monster, one per status you carry -->
      {#each smeters as sm (sm.st)}
        <span class="smeter" title="{sm.st}: each hit fills it by the dice the move used. Full: {SWHAT[sm.st]}. Each fill makes the next one take longer." aria-label="{sm.st} meter {sm.value} of {sm.max}">
          {#if smeters.length > 1}<Elem e={sm.st} />{/if}<span class="bar"><i style="width:{Math.round(100 * sm.value / sm.max)}%;background:{STONE[sm.st]}"></i></span><span class="mono">{sm.value}/{sm.max}</span>
        </span>
      {/each}
    </div>
  </div>
  {#if full && fullText()}<p class="sigline"><span class="tag {sg.tag}" style="margin:0 6px 0 0">{sg.name}</span>{sg.text}</p>{/if}
  {#if !over && E.cantHitReason(h, w)}<p class="cant">{E.cantHitReason(h, w)} {full ? 'Swap, Block or Charge instead.' : 'Swap or Block instead.'}</p>{/if}

  {#each w.moves as mv, i}
    <!-- the Foothills show a weapon's third move (Rend, Skullcrack) from the Burrowmole, where Reroll is taught -->
    {#if i < 2 || shows(h, 'rend')}
    {@const ok = E.canUseMove(h, i)}
    {@const reps = ok ? E.repeatCount(h, i, game.sel) : 0}
    {@const marks = needMarks(mv.need, freeFaces)}
    {@const miss = marks.filter(x => !x.have).map(x => (x.c === 'C' ? 'fang' : 'claw'))}
    <button class="move {ok ? 'ready' : 'no'}" class:pick={ok && (reps > 0 || picks(mv.need))} onmouseenter={() => (game.preview = ok ? (reps > 0 ? [...game.sel] : E.pickDice(h, mv.need, game.sel) ?? []) : [])} onmouseleave={() => (game.preview = [])} onfocus={() => (game.preview = ok ? (reps > 0 ? [...game.sel] : E.pickDice(h, mv.need, game.sel) ?? []) : [])} onblur={() => (game.preview = [])} data-coach={i === bestReady ? 'move' : mv.flow ? 'move-flow' : undefined} data-key={MOVE_KEYS[i]?.toLowerCase()} aria-disabled={!ok} onclick={() => ok && game.move(i)}>
      <span>
        <span class="mn"><Key k={MOVE_KEYS[i]} />{mv.name}{#if reps > 1}<span class="reps"> ×{reps}</span>{/if}{#if mv.flow && shows(h, 'flow')}<span class="tag flow" use:detail={E.SIGNATURES.Cut.text}>Flow</span>{/if}{#if mv.daze && shows(h, 'daze')}<span class="tag daze" use:detail={E.SIGNATURES.Blunt.text}>Daze</span>{/if}{#if full && mv.expose}<span class="tag expose" use:detail={E.SIGNATURES.Pierce.text}>Expose</span>{/if}{#if !over && tipText?.includes(mv.name)}<span class="tag counter">Counter</span>{/if}</span>
        <span class="md">{#if iceNow}{iceLine}{:else}{shownDmg(mv.dmg)} damage{reps > 1 ? ' each' : ''}{halfAir ? ', halved in the air' : ''}{exposedNow ? ', exposed' : ''}{shows(h, 'rend') && shows(h, 'parts') && mv.part ? ` · ×${mv.part} toward breaks` : ''}{shows(h, 'daze') && mv.daze ? ` · Daze +${mv.daze}` : ''}{shows(h, 'flow') && mv.flow ? (h.flowUsed ? ' · reroll used this turn' : ' · +1 reroll') : ''}{full && mv.expose && !exposedNow && !h.mon.parts[h.target]?.broken ? ' · use first: later hits +20%' : ''}{/if}</span>
      </span>
      <span class="need dice" aria-label="Needs {needLabel(mv.need)}{miss.length && !over ? `; missing ${miss.join(', ')}` : ''}">{#each mv.need as c}<CostDie {c} />{/each}</span>
    </button>
    {/if}
  {/each}

  {#if shows(h, 'block')}
  <button class="move dash {gOk ? 'ready' : 'no'}" class:pick={gOk && n > 0} class:keepmd={!shows(h, 'all')} onmouseenter={() => (game.preview = n ? [...game.sel] : auto.guard ?? [])} onmouseleave={() => (game.preview = [])} onfocus={() => (game.preview = n ? [...game.sel] : auto.guard ?? [])} onblur={() => (game.preview = [])} data-coach="guard" data-key="a" aria-disabled={!gOk} onclick={() => gOk && game.guard()}>
    <span><span class="mn"><Key k="A" />Block</span><span class="md">{E.intentInfo(h).noGuard && E.intentInfo(h).dmg > 0 ? `Can’t stop the ${E.intentInfo(h).name}` : selGuard ? `Blocks ${selGuard} with the selected dice` : auto.guard?.length ? `Blocks ${auto.guard.reduce((a, i) => a + E.guardOf(h, i), 0)}` : `${h.arm.guard} a die · ${Math.round(h.arm.guard * (h.arm.blankx2 ? E.VEST_BLANK_GUARD : E.BLANK_GUARD))} a blank`}</span></span><span class="need dice"><CostDie c="any" /></span>
  </button>
  {/if}
  {#if shows(h, 'charge')}
  <button class="move dash {cOk ? 'ready' : 'no'}" onmouseenter={() => (game.preview = n ? [...game.sel] : auto.charge ?? [])} onmouseleave={() => (game.preview = [])} onfocus={() => (game.preview = n ? [...game.sel] : auto.charge ?? [])} onblur={() => (game.preview = [])} data-coach="charge" data-key="c" aria-disabled={!cOk} onclick={() => cOk && game.charge()}>
    <span><span class="mn"><Key k="C" />Charge</span><span class="md">{chargeRisk ? `The −${inc?.net} coming would break it: block all of it first` : `Next hit ×2 · any hit breaks it`}</span></span><span class="need dice"><CostDie c="any" /><span class="x">×{cd}</span></span>
  </button>
  {/if}
  {#if shows(h, 'swap')}
  <button class="move dash {sOk ? 'ready' : 'no'}" class:fits={!!fits && sOk} onmouseenter={() => (game.preview = n ? [...game.sel] : auto.swap ?? [])} onmouseleave={() => (game.preview = [])} onfocus={() => (game.preview = n ? [...game.sel] : auto.swap ?? [])} onblur={() => (game.preview = [])} data-coach="swap" data-key="s" aria-disabled={!sOk} onclick={() => sOk && game.swap()}>
    <span><span class="mn"><Key k="S" pad="RT" /><WeaponArt id={other.id} size={22} />Swap to {other.name}{#if swapCounter}<span class="tag counter">Counter</span>{/if}{#if fits && sOk && !buried}<span class="tag fit">{fits} fits</span>{/if}</span><span class="md">{#if buried}Buried by the rockslide: no swapping this turn{:else}{other.type} · <Elem e={markOf(other)} />{elemLabel(other)}{/if}</span></span><span class="need dice">{#if E.freeSwap(h)}Free{:else}<CostDie c="any" />{/if}</span>
  </button>
  {/if}
  <!-- With everything on it's always shown, so players learn it exists before it's available. In the second and third
       hunts it appears only once the monster is weak enough (it's the escape from a hunt going badly). -->
  {#if full || (shows(h, 'capture') && capLive)}
  <button onmouseenter={() => (game.preview = n ? [...game.sel] : auto.capture ?? [])} onmouseleave={() => (game.preview = [])} onfocus={() => (game.preview = n ? [...game.sel] : auto.capture ?? [])} onblur={() => (game.preview = [])} data-coach="capture" data-key="x" class="move capture {capLive && E.captureReady(h) ? 'live' : ''} {capOk ? 'ready' : 'no'}" aria-disabled={!capOk} onclick={() => capOk && game.capture()}>
    <span>
      <span class="mn"><Key k="X" />Capture</span>
      <span class="md">
        {#if h.snareSet}Snare set: it closes when you end your turn, unless the hit you take is {E.CHARGE_BREAK} or more
        {:else if !capLive}At {capAt} HP · {h.snares ? `${h.snares} Snare${h.snares > 1 ? 's' : ''}` : 'no Snares'}
        {:else if !h.snares}You have no Snare left. Buy them in the Shop
        {:else if E.captureBlocked(h)}{h.mon.air ? 'Bring it down first' : h.mon.under ? 'Drive it to the surface first' : 'It can’t be snared right now'}
        {:else if n === 0 && auto.capture}Holds unless its move hits you for {E.CHARGE_BREAK}+ · {h.snares} Snare{h.snares > 1 ? 's' : ''}
        {:else if n !== 2}Select 2 dice. Holds unless its move hits you for {E.CHARGE_BREAK}+ · {h.snares} Snare{h.snares > 1 ? 's' : ''}
        {:else}Holds unless its move hits you for {E.CHARGE_BREAK}+. Double part materials{/if}
      </span>
    </span>
    <span class="need dice"><CostDie c="any" /><span class="x">×2</span></span>
  </button>
  {/if}

  {#if !shows(h, 'item')}
  {:else if h.item}
    {@const it = E.ITEMS[h.item]}
    <div class="divider"><span class="label">Item · Free action</span><span class="label">{h.itemCharges} left</span></div>
    <button class="move pocket {iOk ? 'ready' : 'no'}" data-coach="item" data-key="f" aria-disabled={!iOk} onclick={() => iOk && game.item()}>
      <span><span class="mn"><Key k="F" /><Icon id={h.item} size={20} />{it.name}</span><span class="md">{#if E.itemBlockReason(h)}<span class="why">{E.itemBlockReason(h)}</span>{:else if it.effect === 'trapRush' || it.effect === 'trapLand'}{#if E.trapCatches(it.effect, h.intent)}<span class="good">Catches this {E.intentInfo(h).name}: no damage, held {E.TRAP_HOLD[it.effect]} turns{E.canCapture(h) ? ', and it’s weak enough: captured' : ''}</span>{:else}<span class="why">Won’t catch its {E.intentInfo(h).name}: wasted if set now</span>{/if}{:else}{it.desc}{/if}</span></span>
      <span class="need">Free</span>
    </button>
  {:else}
    <div class="divider"><span class="label">Item</span><span class="label">None carried</span></div>
  {/if}
</section>

<style>
  .reps { color: var(--gold-hi); font-weight: 600; }
  .why { color: var(--ember-soft); }
  .need.dice { display: inline-flex; align-items: center; gap: 5px; }
  .need .x { font-size: var(--fs-sm); color: var(--soft); }
  .elemrow { display: flex; gap: 6px 12px; align-items: center; flex-wrap: wrap; }
  .smeter { flex: 1 1 110px; display: flex; gap: 6px; align-items: center; font-size: var(--fs-sm); min-width: 0; }
  .smeter .bar { flex: 1; height: 6px; }
  .move.fits { border-color: var(--gold); }
  .tag.fit { color: var(--gold-hi); border-color: var(--gold); }
</style>
