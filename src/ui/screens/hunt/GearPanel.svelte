<script lang="ts">
  import Pip from '../../parts/Pip.svelte';
  import WeaponArt from '../../parts/WeaponArt.svelte';
  import Key from '../../parts/Key.svelte';
  import Icon from '../../parts/Icon.svelte';
  // Current weapon's moves, then the dice actions (guard, charge, swap, capture) and the item.
  import { MOVE_KEYS } from '../../keys';
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { needLabel, needMarks, GLYPH, HOLLOW, elemLabel, markOf } from '../../fmt';

  const h = $derived(game.hunt!);
  const w = $derived(E.currentWeapon(h));
  const other = $derived(E.otherWeapon(h));
  /** the monster's hint: moves it names are counters to what it's doing; naming the other weapon means swap */
  const tipText = $derived(E.tip(h));
  const inc = $derived(E.incoming(h));
  const selGuard = $derived(game.sel.filter(i => !h.dice[i]?.used).reduce((a, i) => a + E.guardOf(h, i), 0));
  /** charging now would be broken by this turn's hit (playtest: nobody knew a hit can break a charge) */
  const chargeRisk = $derived(!h.over && !h.chargePending && (inc?.net ?? 0) >= E.CHARGE_BREAK);
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
  const usesLine = (d: number[] | null) => !d ? '' : !d.length ? '' : d.every(i => h.dice[i].face === 'B') ? `Uses ${d.length === 1 ? 'your blank' : `${d.length} blanks`}` : `Uses your last ${d.length === 1 ? 'die' : `${d.length} dice`}`;
  const gOk = $derived(!over && (n >= 1 || !!auto.guard?.length));
  const cd = $derived(E.chargeDice(h));
  const cOk = $derived(!over && !h.chargePending && (n === cd || (n === 0 && !!auto.charge)));
  const sOk = $derived(!over && (n === 1 || (n === 0 && !!auto.swap)));
  const capLive = $derived(!over && E.canCapture(h));
  const capOk = $derived(capLive && E.captureReady(h) && (n === 2 || (n === 0 && !!auto.capture)));
  const capAt = $derived(Math.floor(h.mon.max * E.CAPTURE_AT));
  const iOk = $derived(!over && E.itemUsable(h));
  const freeFaces = $derived(h.dice.filter(d => !d.used).map(d => d.face as string));
  /** the strongest move you can use now (the tutorial points at it) */
  const bestReady = $derived(w.moves.reduce((b, mv, i) => (E.canUseMove(h, i) && (b < 0 || mv.dmg > w.moves[b].dmg) ? i : b), -1));
</script>

<section class="panel gearpanel" aria-label="Your gear">
  <div class="wname">
    <div class="ph" style="gap:8px">
      <h2 style="margin:0;font-weight:600;font-size:var(--fs-lg);display:flex;align-items:center;gap:8px"><WeaponArt id={w.id} size={34} />{w.name}{#if w.lv}{' '}<span class="lv">+{w.lv}</span>{/if}</h2>
      <span class="avg">{E.avgVs(w, h.mid)} avg</span>
    </div>
    <div class="elemrow">
      <span class="elem" style="color:{elemColor}">{w.type} · <Elem e={markOf(w)} />{elemLabel(w)}{em > 1 ? ' · hits weakness' : em < 1 ? ' · resisted' : ''}{halfAir ? ' · half damage in the air' : ''}</span>
      <!-- status weapons (Nov 2026): the meter your hits fill on the monster, one per status you carry -->
      {#each smeters as sm (sm.st)}
        <span class="smeter" title="{sm.st}: each hit fills it by the dice the move used. Full: {SWHAT[sm.st]}. Each fill makes the next one take longer." aria-label="{sm.st} meter {sm.value} of {sm.max}">
          {#if smeters.length > 1}<Elem e={sm.st} />{/if}<span class="bar"><i style="width:{Math.round(100 * sm.value / sm.max)}%;background:{STONE[sm.st]}"></i></span><span class="mono">{sm.value}/{sm.max}</span>
        </span>
      {/each}
    </div>
  </div>
  <p class="sigline"><span class="tag {sg.tag}" style="margin:0 6px 0 0">{sg.name}</span>{sg.text}</p>
  {#if !over && E.cantHitReason(h, w)}<p class="cant">{E.cantHitReason(h, w)} Swap, Guard or Charge instead.</p>{/if}

  {#each w.moves as mv, i}
    {@const ok = E.canUseMove(h, i)}
    {@const marks = needMarks(mv.need, freeFaces)}
    {@const miss = marks.filter(x => !x.have).map(x => (x.c === 'C' ? 'circle' : 'triangle'))}
    <button class="move {ok ? 'ready' : 'no'}" data-coach={i === bestReady ? 'move' : undefined} aria-disabled={!ok} onclick={() => ok && game.move(i)}>
      <span>
        <span class="mn"><Key k={MOVE_KEYS[i]} />{mv.name}{#if mv.flow}<span class="tag flow">Flow</span>{/if}{#if mv.daze}<span class="tag daze">Daze</span>{/if}{#if mv.expose}<span class="tag expose">Expose</span>{/if}{#if !over && tipText?.includes(mv.name)}<span class="tag counter">Counter</span>{/if}</span>
        <span class="md">{#if iceNow}{iceLine}{:else}{shownDmg(mv.dmg)} damage{halfAir ? ', halved in the air' : ''}{exposedNow ? ', exposed' : ''}{mv.part ? ` · ×${mv.part} toward breaks` : ''}{mv.daze ? ` · Daze +${mv.daze}` : ''}{mv.flow ? ' · +1 reroll' : ''}{/if}</span>
      </span>
      <span class="need" aria-label="Needs {needLabel(mv.need)}{miss.length && !over ? `; missing ${miss.join(', ')}` : ''}">{#each marks as x}{#if x.have || over}<Pip c={x.c} />{:else}<span class="miss"><Pip c={x.c} hollow /></span>{/if}{/each}</span>
    </button>
  {/each}

  <div class="divider"><span class="label">Or spend dice · blanks first</span><span class="label">{n} selected</span></div>
  <button class="move dash {gOk ? 'ready' : 'no'}" data-coach="guard" aria-disabled={!gOk} onclick={() => gOk && game.guard()}>
    <span><span class="mn"><Key k="G" />Guard</span><span class="md">{selGuard ? `Blocks ${selGuard} with the selected dice` : auto.guard?.length ? `${usesLine(auto.guard)}: blocks ${auto.guard.reduce((a, i) => a + E.guardOf(h, i), 0)}` : `Blocks ${h.arm.guard} per die, ${Math.round(h.arm.guard * (h.arm.blankx2 ? E.VEST_BLANK_GUARD : E.BLANK_GUARD))} per blank · select dice`}</span></span><span class="need">Any</span>
  </button>
  <button class="move dash {cOk ? 'ready' : 'no'}" aria-disabled={!cOk} onclick={() => cOk && game.charge()}>
    <span><span class="mn"><Key k="C" />Charge</span><span class="md">{chargeRisk ? `The −${inc?.net} coming would break it: guard it under ${E.CHARGE_BREAK} first` : `Your first hit next turn deals double · a hit of ${E.CHARGE_BREAK}+ breaks it`}{!chargeRisk && auto.charge ? ` · ${usesLine(auto.charge)}` : ''}</span></span><span class="need">{cd}</span>
  </button>
  <button class="move dash {sOk ? 'ready' : 'no'}" data-coach="swap" aria-disabled={!sOk} onclick={() => sOk && game.swap()}>
    <span><span class="mn"><Key k="S" pad="RT" /><WeaponArt id={other.id} size={22} />Swap to {other.name}{#if swapCounter}<span class="tag counter">Counter</span>{/if}</span><span class="md">{other.type} · <Elem e={markOf(other)} />{elemLabel(other)}{auto.swap?.length ? ` · ${usesLine(auto.swap)}` : ''}</span></span><span class="need">{E.freeSwap(h) ? 'Free' : '1'}</span>
  </button>
  <!-- Always shown, so players learn it exists before it's available. -->
  <button data-coach="capture" class="move capture {capLive && E.captureReady(h) ? 'live' : ''} {capOk ? 'ready' : 'no'}" aria-disabled={!capOk} onclick={() => capOk && game.capture()}>
    <span>
      <span class="mn"><Key k="X" />Capture</span>
      <span class="md">
        {#if h.snareSet}Snare set: it closes when you end your turn, unless the hit you take is {E.CHARGE_BREAK} or more
        {:else if !capLive}Unlocks at {capAt} HP or less. Uses a Snare · {h.snares ? `${h.snares} carried` : 'none carried'}
        {:else if !h.snares}You have no Snare left. Buy them in the Shop
        {:else if E.captureBlocked(h)}{E.monsterOf(h).flier ? 'Bring it down first' : 'Drive it to the surface first'}
        {:else if n === 0 && auto.capture}{usesLine(auto.capture)}. Holds unless its move hits you for {E.CHARGE_BREAK}+ · {h.snares} Snare{h.snares > 1 ? 's' : ''}
        {:else if n !== 2}Select 2 dice. Holds unless its move hits you for {E.CHARGE_BREAK}+ · {h.snares} Snare{h.snares > 1 ? 's' : ''}
        {:else}Holds unless its move hits you for {E.CHARGE_BREAK}+. Double part materials{/if}
      </span>
    </span>
    <span class="need">2</span>
  </button>

  {#if h.item}
    {@const it = E.ITEMS[h.item]}
    <div class="divider"><span class="label">Item · Free action</span><span class="label">{h.itemCharges} left</span></div>
    <button class="move pocket {iOk ? 'ready' : 'no'}" data-coach="item" aria-disabled={!iOk} onclick={() => iOk && game.item()}>
      <span><span class="mn"><Key k="I" /><Icon id={h.item} size={20} />{it.name}</span><span class="md">{#if E.itemBlockReason(h)}<span class="why">{E.itemBlockReason(h)}</span>{:else}{it.desc}{/if}</span></span>
      <span class="need">Free</span>
    </button>
  {:else}
    <div class="divider"><span class="label">Item</span><span class="label">None carried</span></div>
  {/if}
</section>

<style>
  .why { color: var(--ember-soft); }
  .elemrow { display: flex; gap: 6px 12px; align-items: center; flex-wrap: wrap; }
  .smeter { flex: 1 1 110px; display: flex; gap: 6px; align-items: center; font-size: var(--fs-sm); min-width: 0; }
  .smeter .bar { flex: 1; height: 6px; }
</style>
