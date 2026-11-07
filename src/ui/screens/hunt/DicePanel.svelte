<script lang="ts">
  import { untrack } from 'svelte';
  import FaceMark from '../../parts/FaceMark.svelte';
  import { ROLL_STAGGER } from '../../game.svelte';
  import * as E from '../../../engine';
  // A rolling die is a real cube (Nov 2026: "like rolling an actual dice"): thrown in from the left, it tumbles over
  // its faces, bounces and lands with its rolled face up. The front of the cube is the face it lands on; the other
  // five show faces it could have rolled. Each throw gets its own spin, so no two dice tumble alike.
  const pool = $derived(E.MONSTERS[game.hunt!.mid]?.island?.faces ?? ['C', 'T', 'B']);
  const throws = $derived.by(() => {
    const out: Record<number, { sides: string[]; style: string }> = {};
    const rnd = (a: number, b: number) => a + Math.random() * (b - a), sign = () => (Math.random() < .5 ? -1 : 1);
    for (const i of game.rolling) out[i] = {
      sides: Array.from({ length: 5 }, () => pool[Math.floor(Math.random() * pool.length)]),
      // whole turns plus a quarter or so, so it lands square on the front face
      style: `--rx:${sign() * (360 * Math.ceil(rnd(1, 3)) + 90 * Math.floor(rnd(0, 4)))}deg;--ry:${sign() * (360 * Math.ceil(rnd(1, 2)) + 90 * Math.floor(rnd(0, 4)))}deg;--rz:${rnd(-40, 40).toFixed(0)}deg;--dy:${rnd(-70, -40).toFixed(0)}px;--dx:${rnd(-170, -120).toFixed(0)}px`
    };
    return out;
  });
  const SIDE = ['back', 'right', 'left', 'top', 'bottom'];
  // pointing at a die (a real mouse move: the tumble slides dice under a still cursor) or at an action lands the dice
  // pointing at an action (its dice lift) lands the dice straight away
  $effect(() => { if (game.preview.length) untrack(() => game.settle()); });
  import Key from '../../parts/Key.svelte';
  import { input } from '../../pad.svelte';
  import { game } from '../../game.svelte';
  import { shows } from '../../reveal';
  const h = $derived(game.hunt!);
  const over = $derived(!!h.over);
  const n = $derived(game.sel.length);
  const spare = $derived(game.spareDice);
  const label = (f: string) => (f === 'C' ? 'Fang' : f === 'T' ? 'Claw' : 'Blank');
</script>

<section class="panel" aria-label="Your dice">
  <div class="ph dph"><span class="label">Your dice · turn {h.turn}</span><span class="label">{input.mode === 'pad' ? 'Select any dice (A), then pick a move, or reroll them' : 'Select any dice, then pick a move, or reroll them'}</span></div>
  <div class="diceline">
  <div class="tray" data-coach="dice">
    {#each h.dice as d, i}
      {@const sel = game.sel.includes(i)}
      <div class="diebox">
        <button
          class="die"
          class:lift={game.preview.includes(i)}
          data-key={String(i + 1)}
          data-coach={d.face === 'B' && !d.used ? 'die-blank' : undefined}
          class:blank={d.face === 'B'}
          class:sel
          class:used={!!d.used}
          class:charged={d.charged && !d.used}
          class:rolling={game.rolling.includes(i)}
          style="--d:{i * ROLL_STAGGER}ms"
          aria-pressed={sel}
          aria-label="{label(d.face)} die{d.charged && !d.used ? ', charged: attack with it or it goes off' : ''}{d.used ? `, used for ${d.used}` : ''}"
          disabled={!!d.used || over}
          onclick={() => game.toggleDie(i)}
          onpointermove={(e) => (e.movementX || e.movementY) && game.settle()}
        >
          {#if throws[i]}
            <span class="cube" style={throws[i].style} aria-hidden="true">
              <span class="cf front">{#if d.face !== 'B'}<FaceMark c={d.face} />{/if}</span>
              {#each throws[i].sides as f, k}<span class="cf {SIDE[k]}">{#if f !== 'B'}<FaceMark c={f} />{/if}</span>{/each}
            </span>
          {:else if d.face === 'C' || d.face === 'T'}<FaceMark c={d.face} />
          {:else}<span class="bl" aria-hidden="true"></span>{/if}<!-- a blank is an empty face, no word (Nov 2026) -->
        </button>
        <span class="dietag" class:used={!!d.used} class:charged={d.charged && !d.used}>{#if d.used || sel}{d.used || 'Selected'}{:else if d.charged}Charged{:else if !over}<Key k={String(i + 1)} />{/if}</span>
      </div>
    {/each}
  </div>
  <div class="acts">
  <button class="btn primary endbtn" class:armed={game.endArmed} data-sound data-coach="end" data-key="space" disabled={over} onclick={() => game.requestEnd()}>
    <Key k="Space" pad="Y" />{#if game.endArmed}<span class="et">End turn anyway?<small>{spare} {spare === 1 ? 'die' : 'dice'} unspent · press again</small></span>{:else if spare}<span class="et">End turn<small>{spare} {spare === 1 ? 'die' : 'dice'} unspent</small></span>{:else}End turn{/if}
  </button>
    {#if shows(h, 'reroll') || shows(h, 'undo')}
    <div class="grp">
      {#if shows(h, 'reroll')}<button class="btn quiet" class:rr={n > 0 && h.rerolls > 0 && !over} data-sound data-coach="reroll" data-key="r" onmouseenter={() => (game.preview = [...game.sel])} onmouseleave={() => (game.preview = [])} onfocus={() => (game.preview = [...game.sel])} onblur={() => (game.preview = [])} disabled={!n || h.rerolls < 1 || over} onclick={() => game.reroll()}><Key k="R" pad="X" />{n > 0 && h.rerolls > 0 ? `Reroll ${n} ${n === 1 ? 'die' : 'dice'}` : 'Reroll'} · {h.rerolls} left</button>{/if}
      {#if shows(h, 'undo')}<button class="btn quiet" data-coach="undo" data-key="z" disabled={!game.undoStack.length || over} onclick={() => game.undo()}><Key k="Z" pad="LT" />Undo</button>{/if}
    </div>
    {/if}
  </div>
  </div>
</section>

<style>
  /* Glarewing: a charged die can only attack (guarding with it, or leaving it, sets it off) */
  .die.charged { box-shadow: 0 0 0 3px #f0dd6e, 0 0 14px 2px rgba(240, 221, 110, .55); }
  .dietag.charged { color: #f0dd6e; font-weight: 700; }
  .diceline { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: space-between; }
  .diceline .tray { flex: 0 1 auto; justify-content: flex-start; padding: 4px 0 0; gap: 12px; }
  .endbtn { min-height: 52px; padding-inline: 22px; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .endbtn .et { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
  .endbtn small { font-size: var(--fs-sm); font-weight: 500; opacity: .85; }
  .endbtn.armed, .endbtn.armed:hover:not(:disabled) { background: var(--ember); border-color: var(--ember); color: #1a1310; }
  .acts { flex: 1 0 230px; max-width: 300px; display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
  .acts .grp { display: flex; gap: 8px; }
  .acts .grp .btn { flex: 1; white-space: nowrap; }
</style>
