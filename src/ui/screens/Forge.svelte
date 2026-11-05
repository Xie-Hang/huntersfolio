<script lang="ts">
  import Icon from '../parts/Icon.svelte';
  import WeaponArt from '../parts/WeaponArt.svelte';
  // List-detail: upgrade trees on the left, the selected recipe on the right.
  import Elem from '../parts/Elem.svelte';
  import * as E from '../../engine';
  import { game } from '../game.svelte';
  import { glyphs, needLabel } from '../fmt';
  import Costs from '../parts/Costs.svelte';
  import { tick } from 'svelte';

  type Tab = 'weapons' | 'armor' | 'charms';
  let tab = $state<Tab>('weapons');
  let ftype = $state<'All' | E.DamageType>('All');
  let readyOnly = $state(false);
  let chosen = $state<Record<Tab, string | null>>({ weapons: null, armor: null, charms: null });
  let toast = $state('');
  let detailEl: HTMLElement;

  const kind = $derived<E.RecipeKind>(tab === 'weapons' ? 'w' : tab === 'armor' ? 'a' : 'c');
  const s = $derived(game.save);

  const groups = $derived.by(() => {
    const raw = tab === 'weapons'
      ? E.TREES.filter(t => ftype === 'All' || t.type === ftype).map(t => ({ group: t.type as string, sig: E.SIGNATURES[t.type], rows: t.nodes.map(([id, depth]) => ({ id, depth })) }))
      : tab === 'armor'
        ? [{ group: 'Armor', sig: null, rows: Object.keys(E.ARMORS).map(id => ({ id, depth: 0 })) }]
        : [{ group: 'Charms', sig: null, rows: Object.keys(E.CHARMS).map(id => ({ id, depth: 0 })) }];
    return raw
      .map(g => ({ ...g, rows: g.rows.filter(r => !readyOnly || E.recipeState(s, kind, r.id).cls === 'ready') }))
      .filter(g => g.rows.length);
  });
  const visible = $derived(groups.flatMap(g => g.rows.map(r => r.id)));
  const sel = $derived(visible.includes(chosen[tab] ?? '') ? chosen[tab] : visible[0] ?? null);

  const lvHere = (id: string) => (kind === 'w' ? E.lvOf(s.weapons, id) : kind === 'a' ? E.lvOf(s.armors, id) : 0);
  /** Level a weapon would have: its own if owned, else the level it inherits from its parent. */
  const wLevel = (id: string) => (s.weapons[id] ? E.lvOf(s.weapons, id) : E.WEAPONS[id].from ? E.lvOf(s.weapons, E.WEAPONS[id].from!) : 0);

  async function pick(id: string) {
    chosen[tab] = id; toast = '';
    if (window.innerWidth <= 900) { await tick(); detailEl?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }
  }
  function doIt() { if (sel) toast = game.town(sv => E.forgeDo(sv, kind, sel), 'forge') ?? ''; }
  function track() {
    if (!sel) return;
    const tk = `${kind}:${sel}`;
    s.tracked = s.tracked === tk ? null : tk;
    game.persist();
    toast = s.tracked ? 'Tracking. Its materials are flagged on the Hunt Board and in the Shop.' : 'Stopped tracking.';
  }
  function setTab(t: Tab) { tab = t; toast = ''; }
</script>

<div class="forgegrid">
  <section class="panel" aria-label="Forge">
    <div class="ph"><h2>The Forge</h2><span class="label">{E.trackedLine(s)}</span></div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'weapons'} onclick={() => setTab('weapons')}>Weapons</button>
      <button role="tab" aria-selected={tab === 'armor'} onclick={() => setTab('armor')}>Armor</button>
      <button role="tab" aria-selected={tab === 'charms'} onclick={() => setTab('charms')}>Charms</button>
    </div>
    <div class="pickbar">
      <div class="filters">
        {#if tab === 'weapons'}
          {#each ['All', 'Cut', 'Blunt', 'Pierce'] as const as t}
            <button aria-pressed={ftype === t} onclick={() => (ftype = t)}>{t}</button>
          {/each}
        {/if}
      </div>
      <label class="label readyto"><input type="checkbox" bind:checked={readyOnly} /> Ready to make</label>
    </div>
    <div class="flist">
      {#each groups as g (g.group)}
        <div class="fgroup"><span>{g.group}</span>{#if g.sig}<span class="tag {g.sig.tag}" style="margin:0">{g.sig.name}</span>{/if}</div>
        {#each g.rows as r (r.id)}
          {@const d = E.gearDef(kind, r.id)}
          {@const st = E.recipeState(s, kind, r.id)}
          {@const lv = lvHere(r.id)}
          <button class="fnode d{r.depth}" aria-current={sel === r.id} onclick={() => pick(r.id)}>
            <span class="nmwrap">
              {#if r.depth}<span class="ind">└</span>{/if}<span class="nm">{#if kind === 'c'}<Icon id={r.id} size={18} />{:else if kind === 'w'}<WeaponArt id={r.id} size={26} />{/if}{d.name}{#if lv}{' '}<span class="lv">+{lv}</span>{/if}</span>
              {#if s.tracked === `${kind}:${r.id}`}<span class="tracked-pin">● Tracked</span>{/if}
              <span class="st {st.cls}"><i></i>{st.text}</span>
            </span>
            <span class="avg">{kind === 'w' ? E.avgDmg(E.movesAt(r.id, wLevel(r.id))) : kind === 'a' ? `${E.ARMORS[r.id].hp + 10 * lv} HP` : E.CHARMS[r.id].src}</span>
          </button>
        {/each}
      {:else}
        <p class="ital" style="padding:12px;margin:0">Nothing is ready to make yet. Untick "Ready to make" to see everything.</p>
      {/each}
    </div>
  </section>

  <section class="panel" aria-label="Selected recipe" aria-live="polite" bind:this={detailEl}>
    {#if !sel}
      <p class="ital p0">Pick something from the list.</p>
    {:else}
      {@const r = E.recipeOf(s, kind, sel)}
      {@const st = E.recipeState(s, kind, sel)}
      {@const owned = E.isOwned(s, kind, sel)}
      {@const lv = lvHere(sel)}
      {@const name = E.gearDef(kind, sel).name}
      {@const tk = `${kind}:${sel}`}
      <div class="fdetail">
        <!-- 1. What is it, and what state is it in -->
        <div class="fd-head"><h2>{#if kind === 'w'}<WeaponArt id={sel} size={56} />{/if}{name}{#if lv}{' '}<span class="lv">+{lv}</span>{/if}</h2><span class="st {st.cls}"><i></i>{st.text}</span></div>

        {#if kind === 'w'}
          {@const d = E.WEAPONS[sel]}
          {@const pLv = d.from ? E.lvOf(s.weapons, d.from) : 0}
          {@const mv = E.movesAt(sel, owned ? lv : pLv)}
          {@const sg = E.SIGNATURES[d.type]}
          {@const now = E.avgDmg(mv)}
          {@const base = !owned && d.from && s.weapons[d.from] ? E.avgDmg(E.movesAt(d.from, pLv)) : null}
          {@const next = owned && lv < E.MAX_REINFORCE ? E.avgDmg(E.movesAt(sel, lv + 1)) : null}
          <!-- 2. Is it better? The number that matters, with the change -->
          <div class="fd-stat">
            <span class="big">{now}</span>
            <span class="unit">Avg damage per turn</span>
            {#if base != null}<span class="delta {now >= base ? 'up' : 'down'}">{now >= base ? '▲ +' : '▼ '}{now - base} vs your {E.WEAPONS[d.from!].name}</span>
            {:else if next != null}<span class="delta up">▲ {next} at +{lv + 1}</span>{/if}
          </div>
          <!-- 3. What kind of weapon -->
          <div class="fd-type">
            <span class="tag {sg.tag}" style="margin:0">{sg.name}</span>
            <span>{d.type}</span><span class="sep">·</span>
            <span>{#if d.elem}<Elem e={d.elem} />{d.elem}{:else}No element{/if}</span>
          </div>
          <p class="fd-sig">{sg.text}</p>
        {:else if kind === 'c'}
          {@const c = E.CHARMS[sel]}
          <p class="fd-perk">{c.perk}</p>
          <span class="fd-sig">{c.bounties ? `A bounty-board charm: unlocked by completing ${c.bounties} different bounties, then crafted for coin.` : `Made from ${c.src} materials.`} Goes in the charm slot; one charm at a time.</span>
        {:else}
          {@const a = E.ownedArmor(s, sel)}
          {@const base = E.ARMORS[sel]}
          <div class="fd-stat">
            <span class="big">{owned ? a.hp : base.hp}</span><span class="unit">HP</span>
            {#if owned && lv < E.MAX_REINFORCE}<span class="delta up">▲ {a.hp + 10} HP, guard {a.guard + 1} at +{lv + 1}</span>{/if}
          </div>
          <div class="fd-type">
            <span>Guard {owned ? a.guard : base.guard} per die</span><span class="sep">·</span><span>{base.rerolls} rerolls</span><span class="sep">·</span>
            <span>{#if base.resist}<Elem e={base.resist} />Resists {base.resist}{:else}No resistance{/if}</span>
          </div>
          <p class="fd-sig">{base.perk}</p>
        {/if}

        <!-- 4. Can I make it? Cost and action, close to the top -->
        {#if r.cost}
          <div>
            <div class="label rule">{r.action === 'reinforce' ? `To reinforce to +${lv + 1}` : r.action === 'upgrade' ? `To craft (from your ${E.WEAPONS[E.WEAPONS[sel].from!].name})` : r.locked ? (kind === 'c' ? `To craft (once you've completed ${E.CHARMS[sel].bounties} different bounties: ${E.bountiesDone(s)} so far)` : `To craft (once you own the ${E.WEAPONS[E.WEAPONS[sel].from!].name})`) : 'To craft'}</div>
            <Costs cost={r.cost} />
          </div>
        {/if}
        <div class="fd-acts">
          {#if r.action && r.cost}
            <button class="btn primary" data-sound data-coach="forge-act" disabled={!E.canPay(s, r.cost)} onclick={doIt}>
              {r.action === 'craft' || r.action === 'upgrade' ? 'Craft' : `Reinforce to +${lv + 1}`}
            </button>
          {:else if owned}
            <span class="pl">{kind === 'c' ? 'Owned. Equip it at the Hunt Board.' : 'Fully reinforced.'}</span>
          {/if}
          {#if r.cost && (r.action || r.locked) && !(kind === 'c' && E.CHARMS[sel].bounties)}
            <button class="btn quiet" data-coach="track" aria-pressed={s.tracked === tk} onclick={track}>{s.tracked === tk ? 'Untrack' : 'Track'}</button>
          {/if}
          {#if r.action === 'upgrade'}
            {@const from = E.WEAPONS[sel].from!}
            {@const flv = E.lvOf(s.weapons, from)}
            <span class="pl">You keep your {E.WEAPONS[from].name}{flv ? ` (+${flv})` : ''}. The new weapon starts at +0.</span>
          {/if}
        </div>
        <div class="toast" aria-live="polite">{toast}</div>

        <!-- 5. Moves and details: secondary, always shown, below the decision -->
        {#if kind === 'w'}
          {@const d = E.WEAPONS[sel]}
          <div class="fd-more">
            <div class="label rule">Moves and details</div>
            <ul class="fd-moves">
              {#each E.movesAt(sel, wLevel(sel)) as m}
                <li><span class="need" aria-label="Needs {needLabel(m.need)}">{glyphs(m.need)}</span><span>{m.name}</span><span class="n">{m.dmg}</span></li>
              {/each}
            </ul>
            <p class="fd-note">{d.kind}. {d.note}</p>
          </div>
        {/if}
      </div>
    {/if}
  </section>
</div>
