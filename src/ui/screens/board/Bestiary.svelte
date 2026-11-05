<script lang="ts">
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
  const mats = $derived([M.common, ...M.parts.map(p => p.mat), M.rare]);
  const bounties = $derived(E.BOUNTIES_ON ? E.bountiesFor(mon) : []);
  const beaten = $derived(r.wins > 0);
  function take(id: string | null) { game.save.loadout.bounty = id; game.persist(); }
</script>

<div style="display:flex;flex-direction:column;gap:14px">
  <div class="ph"><h2>{M.name}</h2><span class="label">{M.kind} · {E.TIERS[M.tier]}</span></div>
  <div class="plate"><Plate {mon} scene /></div>
  <div class="record" aria-label="Your record">
    <div><b>{r.hunts}</b><span>Hunts</span></div>
    <div><b>{r.wins}</b><span>Wins</span></div>
    <div><b>{r.captures}</b><span>Captures</span></div>
    <div><b>{breaks}</b><span>Parts broken</span></div>
  </div>
  <div class="trio">
    <div><span>Element</span><b><Elem e={M.elem} />{M.elem}</b></div>
    <div><span>Weakness</span><b class="good"><Elem e={M.weak} />{M.weak} ×1.5</b></div>
    <div><span>Resists</span><b class="bad"><Elem e={M.resist} />{M.resist} ×0.75</b></div>
  </div>
  <dl class="facts">
    <dt>Habits</dt><dd>{M.habits}</dd>
    <dt>Reward</dt><dd><b>{E.REWARD.base} coin</b>, +{E.REWARD.perPart} per part broken, +{E.REWARD.capture} for a capture.</dd>
  </dl>
  {#if bounties.length && beaten}
    {@const nx = E.nextBountyCharm(game.save)}
    <div class="label rule" data-coach="bounties">Bounties · {bounties.filter(b => game.save.bounties[b.id]).length} of {bounties.length} done here · {E.bountiesDone(game.save)} in all{#if nx}{' '}· next unlock: {nx.name} at {nx.need}{/if}</div>
    <ul class="bounties">
      {#each bounties as b (b.id)}
        {@const done = !!game.save.bounties[b.id]}
        {@const taken = game.save.loadout.bounty === b.id}
        {@const pay = E.bountyPay(game.save, b.id)}
        <li class:done class:taken>
          <div class="bh">
            <span class="nm">{b.name}{#if b.hard}{' '}<span class="tag hard">Hard</span>{/if}</span>
            {#if !beaten}<span class="state">Beat it once first</span>
            {:else if taken}<button class="btn quiet" onclick={() => take(null)}>Drop</button>
            {:else}<span class="acts">{#if done}<span class="state">Done</span>{/if}<button class="btn quiet" onclick={() => take(b.id)}>{done ? 'Repeat' : 'Take bounty'}</button></span>{/if}
          </div>
          <span class="goals">Win, and: {b.goals.map(g => E.goalText(g, mon)).join(' · ')}</span>
          <span class="pay">{pay.coin} coin{#if pay.mat}{' · '}<Icon id={pay.mat} size={16} />{E.matName(pay.mat)}{/if}{#if pay.repeat}{' '}<span class="rep">(repeat: half the coin)</span>{:else}{' '}· counts toward the bounty charms{/if}</span>
        </li>
      {/each}
    </ul>
  {/if}
  <div class="label rule">Breaking parts · damage that counts toward a break</div>
  <div class="etable-wrap">
    <table class="etable">
      <thead><tr><th>Part</th>{#each DAMAGE_TYPES as t}<th>{t}</th>{/each}<th>Drops</th></tr></thead>
      <tbody>
        {#each M.parts as p (p.id)}
          <tr>
            <td style="color:var(--fg)">{p.name}</td>
            {#each DAMAGE_TYPES as t}
              {@const e = p.eff[t]}
              <td class={e >= 1 ? 'b' : e > 0 ? 'h' : 'n'}>{effName(e)}</td>
            {/each}
            <td style="color:var(--soft)">{E.matName(p.mat)}{p.id === M.rarePart ? `, ${E.matName(M.rare)}` : ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="label rule">Its materials in your stash</div>
  <div class="stash">
    {#each mats as k (k)}
      {@const tn = E.trackedNeed(game.save, k)}
      <div class="row" class:zero={!game.save.mats[k]}>
        <span><Icon id={k} size={18} />{E.matName(k)}{#if tn}{' '}<span class="need">· {tn}</span>{/if}</span><span class="mono">{game.save.mats[k] ?? 0}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .bounties { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .bounties li { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; }
  .bounties li.taken { border-color: var(--gold); }
  .bounties li.done { opacity: .6; }
  .bounties .bh { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .bounties .nm { color: var(--fg); font-weight: 600; }
  .bounties .goals { color: var(--soft); }
  .bounties .pay { color: var(--gold-hi); font-size: var(--fs-sm); }
  .bounties .state { color: var(--soft); font-size: var(--fs-sm); }
  .bounties .acts { display: inline-flex; align-items: center; gap: 10px; }
  .bounties .rep { color: var(--soft); }
  .tag.hard { color: var(--ember-soft); border-color: var(--ember-soft); }
</style>
