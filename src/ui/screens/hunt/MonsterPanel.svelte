<script lang="ts">
  import { shows } from '../../reveal';
  import { input } from '../../pad.svelte';
  import Elem from '../../parts/Elem.svelte';
  import * as E from '../../../engine';
  import { game } from '../../game.svelte';
  import { pct } from '../../fmt';
  import { shake } from '../../fx';
  import Plate from '../../parts/Plate.svelte';
  import Rich from '../../parts/Rich.svelte';
  import Telegraph from './Telegraph.svelte';

  const h = $derived(game.hunt!);
  const M = $derived(E.MONSTERS[h.mid]);
  const m = $derived(h.mon);
  const w = $derived(E.currentWeapon(h));
  const headName = $derived(M.parts.find(p => p.id === M.head)!.name.toLowerCase());
  const mud = $derived(m.wallow > 0 && !m.parts.hide?.broken);
  const meter = $derived(M.meter?.(h) ?? null);
  const uid = `st${Math.random().toString(36).slice(2, 7)}`;
  const isFlier = $derived(!!M.flier);
  const el = $derived(E.elemsNow(h.mid, h));
  /** The monster's condition, each with what it does and how to answer it (playtest: players saw "Enraged" or
   *  "Ice plating" with no idea what it meant). Hover, or move a controller's focus onto it, to read. */
  const statuses = $derived.by(() => {
    const out: { key: string; label: string; short: string; cls: string; desc: string }[] = [];
    // (statuses for things not taught yet stay hidden on the island: Enraged, Capturable. Nov 2026 playtest)
    const tn = (n: number, w = 'turn') => `${n} ${w}${n > 1 ? 's' : ''}`;
    // Text rules (8 Nov 2026, with Mekkman): the caption says what the monster is doing in the shared word list
    // (takes, burns you, drains, through Block, X only, loses N turns); the tip says what's happening and what ends it,
    // no play advice and no negatives. **Game terms** render bold.
    if (m.enraged && shows(h, 'enraged')) out.push({ key: 'enr', label: 'Enraged', short: 'hits harder', cls: 'hot', desc: 'Below half HP it gets angry. It hits harder, and some of its moves change.' });
    if (mud) out.push({ key: 'mud', label: 'Mud-caked', short: `hide takes ½ · ${tn(m.wallow)}`, cls: 'mud', desc: 'Mud covers its hide, so the hide takes ½ until the mud dries. **Pierce** goes through mud.' });
    if (h.intent === 'trapped') out.push({ key: 'trap', label: 'Trapped', short: `loses ${tn(m.trapped ?? 1)}`, cls: 'gold', desc: 'It’s caught in your trap and loses its turns while it’s held. A **Snare** set now always closes.' });
    if (m.air) out.push({ key: 'air', label: 'Airborne', short: '**Pierce** only', cls: 'gale', desc: `It’s flying, so only **Pierce** reaches it.${isFlier ? ' **Pinning Shot** or a **Weighted Net** brings it down.' : ''}` });
    if (m.under) { const half = M.hitMod?.(h, h.target, E.currentWeapon(h))?.mult === 0.5;
      out.push({ key: 'under', label: 'Underground', short: half ? '**Blunt** only, takes ½' : '**Blunt** only', cls: 'mud', desc: `It’s dug in. Only **Blunt** reaches it${half ? ', and it takes ½' : ''}. A heavy **Blunt** hit or **Blast Powder** forces it up, dazed, and cancels its next move.` }); }
    // every plated monster gets the badge but the Ashtail, whose burning scales have their own (Nov 2026 bug hunt: the Cragwing's slate had none)
    if (m.plating > 0 && !M.plateHot) { const pw = M.plateWord ?? 'ice'; out.push({ key: 'ice', label: `${pw[0].toUpperCase() + pw.slice(1)} ×${m.plating}`, short: 'takes hits before HP', cls: 'ice', desc: `The ${pw} takes your hits before its HP does. Each hit breaks a layer, and **Cut** breaks two. **Charge** and whetstone bonuses go into the ${pw}. A **Firepot** ${pw === 'ice' ? 'melts' : 'cracks'} it all.` }); }
    if (m.molten > 0) out.push({ key: 'molt', label: 'Molten', short: `**Cut**/**Blunt** burn you ${m.enraged ? 8 : 5} · ${tn(m.molten)}`, cls: 'hot', desc: `Its shell is red-hot. Every **Cut** or **Blunt** hit burns you for ${m.enraged ? 8 : 5} until it cools.` });
    if ((m.shell ?? 0) > 0) out.push({ key: 'shell', label: 'In its shell', short: 'takes ½ until it acts', cls: 'stone', desc: 'It’s in its shell and takes ½ from your hits until its next action.' });
    if ((m.slime ?? 0) > 0 && M.inflicts !== 'Drain') out.push({ key: 'slime', label: 'Slime', short: `burns you · ${tn(m.slime!)}`, cls: 'hot', desc: 'The slime burns you a little at the end of each turn. Breaking its foot ends it for good.' });
    if ((m.mirage ?? 0) > 0 && M.id !== 'fenmother') out.push({ key: 'mir', label: 'Images', short: `1st hit only · ${tn(m.mirage!)}`, cls: 'ice', desc: `Mirror images surround it. Only your first hit each turn lands, and later hits break an image.${(m.hits ?? 0) > 0 ? ' Your hit this turn has landed.' : ''}` });
    if ((m.infected ?? 0) > 0) out.push({ key: 'inf', label: 'Infected', short: `takes ${m.infectDmg} a turn · ${tn(m.infected!)}`, cls: 'inf', desc: 'Your weapon’s infection has taken hold. It takes this much at the end of each turn until the infection wears off.' });
    out.push(...(M.badges?.(h) ?? []));
    if (E.canCapture(h) && shows(h, 'capture')) out.push({ key: 'cap', label: 'Capturable', short: h.snareSet ? '**Snare** closes at turn end' : h.snares ? `ready to **Snare** · ${h.snares} left` : 'no **Snares** left', cls: 'gold', desc: `It’s weak enough to catch. Set a **Snare** with 2 dice. It closes at the end of your turn, unless it hits you for ${E.CHARGE_BREAK} or more. A capture gives double part materials.` });
    return out;
  });
  // A status arriving mid-hunt gets a moment on the stage, not just a tag (Nov 2026 playtest: Enraged went unnoticed):
  // its name across the picture for a couple of seconds, and Enraged shakes the stage. Once per status per hunt.
  let seenSt = new Set<string>(), seenFor = '', banner = $state<{ label: string; short: string; cls: string; n: number } | null>(null), bn = 0;
  let bannerTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const list = statuses, id = `${h.mid}:${game.save.hunts}`;
    if (id !== seenFor) { seenFor = id; seenSt = new Set(list.map(s => s.key)); return; }
    for (const st of list) if (!seenSt.has(st.key)) {
      seenSt.add(st.key);
      if (h.over) continue;
      banner = { label: st.label, short: st.short, cls: st.cls, n: ++bn };
      if (st.key === 'enr') game.shakes.mon++;
      clearTimeout(bannerTimer); bannerTimer = setTimeout(() => (banner = null), 2400);
    }
  });
  const TONE = { gold: 'var(--gold-hi)', ember: 'var(--ember-soft)', ice: '#b9d3f0', gale: '#8fc3c9', stone: '#c9b89c' } as const;
</script>

<section class="panel stage" class:over={h.over === 'win'} aria-label="The monster" use:shake={game.shakes.mon}>
  <div style="display:flex;flex-direction:column;gap:12px">
    <!-- name, HP and elements are in the health bar across the top (VersusBar) -->
    <!-- the first Foothills hunt doesn't show its next move yet: the picture takes the whole panel -->
    <div class="stagebody" class:solo={!shows(h, 'intent') && !h.over}>
      <!-- the picture, then the monster's meters and condition under it: the telegraph beside sets the height, and this
           used to be a full-width row below both (Nov 2026: the hunt screen didn't fit a Steam Deck) -->
      <div class="platecol">
        <div class="plate" style="position:relative"><Plate mon={h.mid} hunt={h.intent === 'trapped' ? { ...h, intent: 'dazed' } : h} scene />{#if h.over}<span class="stamp {h.over === 'win' ? (h.captured ? 'captured' : 'slain') : 'failed'}" aria-hidden="true">{h.over === 'win' ? (h.captured ? 'Captured' : 'Slain') : 'Escaped'}</span>{/if}{#key banner?.n}{#if banner}<div class="stbanner {banner.cls}" role="status"><b>{banner.label}</b><span><Rich text={banner.short} /></span></div>{/if}{/key}</div>
        <!-- meters and condition badges only matter mid-fight: gone on the result card (Mekkman, Nov 2026) -->
        {#if !h.over}
        <div class="metarow">
          <div class="meters">
        {#if meter}
          <div class="hpline" aria-label="{meter.label}: {meter.value} of {meter.max}">
            <div class="ph"><span class="label" style="color:{TONE[meter.tone ?? 'gold']}">{meter.label}</span><span class="mono">{meter.note ?? `${meter.value} / ${meter.max}`}</span></div>
            {#if meter.pips}
              <div class="pipbar">{#each Array(meter.max) as _, i}<i class:f={i < meter.value} style="--c:{TONE[meter.tone ?? 'gold']}"></i>{/each}</div>
            {:else}
              <div class="bar"><i style="width:{pct(meter.value, meter.max)}%;background:{TONE[meter.tone ?? 'gold']}"></i></div>
            {/if}
          </div>
        {/if}
        {#if !shows(h, 'daze')}
        {:else if E.carries(h, 'Blunt') && M.heads}
          <div class="hpline">
            <div class="heads">
              <span class="label" style="color:var(--daze)">Daze</span>
              {#each M.heads.filter(x => !m.parts[x].broken) as hd (hd)}
                {@const reel = (m.reel?.[hd] ?? 0) > 0}
                {@const v = m.headDaze?.[hd] ?? 0}
                <div class="hd" aria-label="{M.parts.find(p => p.id === hd)!.name} daze: {reel ? 'reeling' : `${v} of ${E.HEAD_DAZE_MAX}`}">
                  <span class="label">{M.parts.find(p => p.id === hd)!.name.replace(' Head', '')}{reel ? ' · Reeling' : ''}</span>
                  <div class="bar" class:locked={reel}><i style="width:{pct(v, E.HEAD_DAZE_MAX)}%;background:var(--daze)"></i></div>
                </div>
              {/each}
            </div>
          </div>
        {:else if E.carries(h, 'Blunt')}
          <div class="hpline" data-coach="daze">
            <div class="ph"><span class="label" style="color:var(--daze)">Daze · Blunt hits to the {headName}</span><span class="mono">{m.dazeLock ? 'Recovering' : `${m.daze} / ${m.dazeMax}`}</span></div>
            <div class="bar" class:locked={m.dazeLock > 0}><i style="width:{pct(m.daze, m.dazeMax)}%;background:var(--daze)"></i></div>
          </div>
        {/if}
          </div>
          {#if statuses.length}
            <div class="conds" aria-label="Its condition">
              {#each statuses as st (st.key)}
                <button type="button" class="cond {st.cls}" aria-describedby="{uid}-{st.key}"><b>{st.label}</b><span class="sh"><Rich text={st.short} /></span><span class="i" aria-hidden="true">i</span>
                <span class="stip" id="{uid}-{st.key}" role="tooltip"><Rich text={st.desc} /></span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        {/if}
      </div>
      {#if shows(h, 'intent') || h.over}<Telegraph />{/if}
    </div>
  </div>
  <div class="fx">
    {#each game.floats.filter(f => f.at === 'mon') as f (f.id)}<span class="float {f.cls}">{f.text}</span>{/each}
  </div>
</section>

<style>
  /* a status arriving: its name across the picture, then gone */
  .stbanner { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 22px; background: rgba(20, 15, 11, .88); border: 2px solid currentColor; border-radius: 4px; color: var(--gold-hi); pointer-events: none; animation: stb 2.4s ease forwards; z-index: 3; white-space: nowrap; }
  .stbanner b { font-size: 28px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .stbanner span { font-size: 14px; color: var(--fg); }
  .stbanner.hot { color: var(--ember); box-shadow: 0 0 40px rgba(232, 119, 58, .45); }
  .stbanner.gale { color: #8fc3c9; } .stbanner.ice { color: #b9d3f0; } .stbanner.mud, .stbanner.stone { color: #c9b89c; }
  @keyframes stb { 0% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); } 12% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .stbanner { animation: stbfade 2.4s linear forwards; } @keyframes stbfade { 0%, 80% { opacity: 1; } 100% { opacity: 0; } } }

  /* condition badges under the picture (not over it: the art stays clear): solid, named, the effect always visible */
  .conds { flex: 0 1 auto; display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; align-items: center; margin-left: auto; }
  .cond { all: unset; pointer-events: auto; position: relative; box-sizing: border-box; cursor: help; display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 8px; border-radius: 3px; background: var(--c, var(--bone)); color: var(--ink); font-family: var(--f-body); font-size: var(--fs-sm); line-height: 1.2; box-shadow: 0 2px 0 rgba(0, 0, 0, .45), 0 0 0 1px rgba(0, 0, 0, .35); }
  .cond b { font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: 12px; }
  .cond .sh { font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .cond { max-width: 100%; white-space: nowrap; }
  .cond b { flex: none; }
  .cond .i { flex: none; align-self: center; width: 15px; height: 15px; font-size: 0; background-color: currentColor; -webkit-mask: var(--icon-i) center/contain no-repeat; mask: var(--icon-i) center/contain no-repeat; opacity: .85; }
  .cond:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
  .cond.inf { --c: #9fc062; } .cond.hot { --c: #e8773a; } .cond.ice { --c: #b9d3f0; } .cond.gale { --c: #8fc3c9; } .cond.mud { --c: #b49a74; } .cond.stone { --c: #c9b89c; } .cond.gold { --c: #e9b949; } .cond.ember { --c: #e0915f; }
  .cond.hot b { color: #2a1206; }
  .stip { position: absolute; right: 0; top: calc(100% + 8px); z-index: 40; width: 280px; padding: 10px 12px; border: 1px solid var(--gold); border-radius: 4px; background: var(--raise); color: var(--fg); font-size: var(--fs-sm); font-weight: 400; line-height: 1.45; text-align: left; text-transform: none; letter-spacing: 0; white-space: normal; box-shadow: 0 8px 24px rgba(0, 0, 0, .5); opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .12s, transform .12s, visibility .12s; pointer-events: none; }
  .cond:hover .stip, .cond:focus-visible .stip, .cond:focus .stip { opacity: 1; visibility: visible; transform: none; }
  @media (prefers-reduced-motion: reduce) { .stip { transition: none; } }
  .metarow { display: flex; gap: 10px 18px; align-items: flex-end; flex-wrap: wrap; }
  .metarow .meters { flex: 1 1 260px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px 16px; min-width: 0; }
  .metarow .ph { flex-wrap: nowrap; }
  .metarow .ph .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .metarow .ph .mono { white-space: nowrap; flex: none; }
  .metarow .meters:empty { display: none; }
  .platecol { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .platecol .metarow { flex-direction: column; align-items: stretch; }
  .platecol .metarow .meters { flex: none; grid-template-columns: minmax(0, 1fr); }
  .platecol .conds { justify-content: flex-start; margin-left: 0; }
  .stagebody.solo { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .stagebody.solo .platecol { width: min(100%, 460px); }
  .stagebody { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 14px; align-items: start; }
  @media (max-width: 720px) { .stagebody { grid-template-columns: minmax(0, 1fr); } }
  .heads { display: flex; align-items: center; gap: 12px; }
  .heads .hd { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
  .heads .hd .bar { flex: 1; }
  .heads .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pipbar { display: flex; gap: 6px; }
  .pipbar i { flex: 1; height: 10px; border-radius: 2px; border: 1px solid var(--line-2); background: transparent; }
  .pipbar i.f { background: var(--c); border-color: var(--c); }
</style>
