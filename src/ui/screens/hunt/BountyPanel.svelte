<script lang="ts">
  // The bounty taken for this hunt: one strip across the top of the centre column, right above the monster
  // (Mekkman, playtest: on the HP line it wasn't obvious enough; Nov 2026: the left column is gone). Each goal ticks
  // or crosses itself live; the reward is shown so it's worth chasing.
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import Icon from '../../parts/Icon.svelte';
  let { inhead = false }: { inhead?: boolean } = $props();
  const h = $derived(game.hunt!);
  const B = $derived(h.bounty ? E.BOUNTIES[h.bounty] : null);
  const MARK = { met: '✓', failed: '✗', open: '○' } as const;
  const states = $derived(B ? B.goals.map(g => E.goalState(h, g)) : []);
  const failed = $derived(states.includes('failed'));
  const pay = $derived(B ? E.bountyPay(game.save, B.id) : null);
</script>

{#if B && !h.over}
  <section class="panel bounty" class:failed class:inhead aria-label="Bounty for this hunt">
    <span class="label bk">Bounty{B.hard ? ' · Hard' : ''}</span>
    <h2>{B.name}</h2>
    <ul>
      <li class="g open"><b aria-hidden="true">○</b>Win the hunt</li>
      {#each B.goals as g, i}{@const st = states[i]}<li class="g {st}"><b aria-hidden="true">{MARK[st]}</b>{E.goalText(g, h.mid)}<span class="sr">{st === 'met' ? ' (done)' : st === 'failed' ? ' (missed)' : ''}</span></li>{/each}
    </ul>
    <span class="pay">{#if failed}<span class="miss">Missed</span>{:else}{pay?.coin} coin{#if pay?.mat}{' · '}<Icon id={pay.mat} size={16} />{E.matName(pay.mat)}{/if}{/if}</span>
  </section>
{/if}

<style>
  .bounty { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 6px 16px; padding: 9px 16px; border-color: var(--gold); }
  .bounty.failed { border-color: var(--line-2); }
  .bounty h2 { margin: 0; font-size: var(--fs-md); font-weight: 600; color: var(--gold-hi); }
  .bounty.failed h2 { color: var(--soft); }
  .bk { color: var(--gold-hi); }
  .miss { color: var(--ember-soft); }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: var(--fs-md); }
  .g { display: flex; gap: 6px; align-items: baseline; color: var(--fg); }
  .g b { flex: none; width: 1em; text-align: center; color: var(--muted); }
  .g.met b { color: var(--life); }
  .g.met { color: var(--soft); }
  .g.failed { text-decoration: line-through; color: var(--muted); } .g.failed b { color: var(--ember-soft); }
  .pay { margin-left: auto; font-size: var(--fs-sm); color: var(--gold-hi); display: inline-flex; align-items: center; gap: 4px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
