<script lang="ts">
  // A monster's entry on its Hunt Board page (Nov 2026 playtest: too much below the fold). The plate, your record and
  // the element row stay up top; below them two tabs, "Parts and drops" first (the thing players need most: what
  // breaks each part, what it drops, how many you hold) and "Habits". Bounties live beside the loadout, not here.
  import Icon from '../../parts/Icon.svelte';
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { DAMAGE_TYPES, effName, record } from '../../fmt';
  import Plate from '../../parts/Plate.svelte';

  let { mon }: { mon: string } = $props();
  const M = $derived(E.MONSTERS[mon]);
  const r = $derived(record(game.save, mon));
  const breaks = $derived(Object.values(r.breaks).reduce((a, b) => a + b, 0));
  const have = (k: string) => game.save.mats[k] ?? 0;
  let tab = $state<'parts' | 'habits'>('parts');
  const TABS = [['parts', 'Parts and drops'], ['habits', 'Habits']] as const;
  function tabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); tab = tab === 'parts' ? 'habits' : 'parts';
    (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus();
  }
</script>

<div class="entry">
  <div class="ph"><h2>{M.name}</h2><span class="label">{M.kind} · {M.variantOf ? `a changed ${E.MONSTERS[M.variantOf]?.short ?? ''}` : E.TIERS[M.tier]}</span></div>
  <div class="plate compact"><Plate {mon} scene /></div>
  <div class="recline" aria-label="Your record">Hunted <b>{r.hunts}</b> · Won <b>{r.wins}</b> · Captured <b>{r.captures}</b> · Parts broken <b>{breaks}</b></div>
  {#if M.elemOf}
    <div class="trio"><div><span>Element</span><b>By stance</b></div><div><span>Weakness</span><b class="good">Changes</b></div><div><span>Resists</span><b class="bad">Changes</b></div></div>
  {:else}
    <div class="trio">
      <div><span>Element</span><b><Elem e={M.elem} />{M.elem}</b></div>
      <div><span>Weakness</span><b class="good"><Elem e={M.weak} />{M.weak} ×1.5</b></div>
      <div><span>Resists</span><b class="bad"><Elem e={M.resist} />{M.resist} ×0.75</b></div>
    </div>
  {/if}

  <div class="mtabs" role="tablist" aria-label="About the {M.short}">
    {#each TABS as [k, label]}
      <button role="tab" id="mt-{k}" data-tab={k} aria-selected={tab === k} aria-controls="mp-{k}" tabindex={tab === k ? 0 : -1} onclick={() => (tab = k)} onkeydown={tabKey}>{label}</button>
    {/each}
  </div>

  {#if tab === 'parts'}
    <div class="etable-wrap" role="tabpanel" id="mp-parts" aria-labelledby="mt-parts">
      <table class="etable">
        <thead><tr><th>Part</th>{#each DAMAGE_TYPES as t}<th>{t}</th>{/each}<th>Drops · you have</th></tr></thead>
        <tbody>
          {#each M.parts as p (p.id)}
            <tr>
              <td style="color:var(--fg)">{p.name}</td>
              {#each DAMAGE_TYPES as t}{@const e = p.eff[t]}<td class={e >= 1 ? 'b' : e > 0 ? 'h' : 'n'}>{effName(e)}</td>{/each}
              <td class="drops">
                <span><Icon id={p.mat} size={16} />{E.matName(p.mat)} <b class:zero={!have(p.mat)}>×{have(p.mat)}</b></span>
                {#if p.id === M.rarePart}<span class="rare"><Icon id={M.rare} size={16} />{E.matName(M.rare)} <b class:zero={!have(M.rare)}>×{have(M.rare)}</b></span>{/if}
              </td>
            </tr>
          {/each}
          <tr><td style="color:var(--soft)">Any win</td><td colspan={DAMAGE_TYPES.length}></td><td class="drops"><span><Icon id={M.common} size={16} />{E.matName(M.common)} <b class:zero={!have(M.common)}>×{have(M.common)}</b></span></td></tr>
        </tbody>
      </table>
      <p class="tnote">Best, Half, None: how much of that damage type counts toward breaking the part. A broken part drops its material.</p>
    </div>
  {:else}
    <div role="tabpanel" id="mp-habits" aria-labelledby="mt-habits"><dl class="facts">
      <dt>Habits</dt><dd>{M.habits}</dd>
      {#if M.elemOf}<dt>Stances</dt><dd>Stone (weak to Gale), Gale (weak to Frost), Ember (weak to Stone), Frost (weak to Ember). Each stance's big attack is of that element: Sovereign Charge, Wing Dive, Caldera Eruption, Glacier Sweep.</dd>
      {:else if M.elemental?.length}<dt>{M.elem} attacks</dt><dd>{M.elemental.join(', ')}. Its other attacks are physical: armor that resists {M.elem} only cuts these.</dd>{/if}
      <dt>Reward</dt><dd><b>{E.REWARD.base} coin</b>, +{E.REWARD.perPart} per part broken, +{E.REWARD.capture} for a capture.</dd>
    </dl></div>
  {/if}
</div>

<style>
  .entry { display: flex; flex-direction: column; gap: 14px; }
  .plate.compact { width: min(100%, 340px); margin: 0 auto; }
  .recline { font-size: var(--fs-sm); color: var(--muted); }
  .recline b { color: var(--fg); font-weight: 600; }
  .drops { color: var(--soft); }
  .drops span { display: block; }
  .drops b { color: var(--gold-hi); font-weight: 600; }
  .drops b.zero { color: var(--muted); font-weight: 400; }
  .drops .rare { color: var(--gold-hi); }
  .tnote { margin: 8px 0 0; font-size: var(--fs-sm); color: var(--muted); }
  .mtabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
  .mtabs button { all: unset; cursor: pointer; padding: 8px 14px; font-size: var(--fs-md); color: var(--soft); border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .mtabs button:hover { color: var(--fg); }
  .mtabs button[aria-selected="true"] { color: var(--gold-hi); font-weight: 600; border-bottom-color: var(--gold); }
  .mtabs button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
</style>
