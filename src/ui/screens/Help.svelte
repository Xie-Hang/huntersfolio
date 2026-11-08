<script lang="ts">
  // Help (Nov 2026, Mekkman): "How to hunt" is one labelled picture of the hunt screen; Hunter's Notes is every game
  // term the player has met, in the same words as the tags and tips (one source, so it can't drift); Controls is the
  // controller map. Opens on the tab that fits where you are.
  import * as E from '../../engine';
  import Rich from '../parts/Rich.svelte';
  import { help, known } from '../notes.svelte';
  import { game } from '../game.svelte';

  let q = $state('');
  const all = Object.values(E.NOTES);
  const shown = $derived(all.filter(n => known(n.id) && (!q.trim() || [n.name, n.head, ...(n.aka ?? [])].join(' ').toLowerCase().includes(q.trim().toLowerCase()))));
  const hidden = $derived(all.filter(n => !known(n.id)).length);
  const cur = $derived(help.entry && known(help.entry) ? E.NOTES[help.entry] : (shown[0] ?? null));
  const TABS = [['hunt', 'How to hunt'], ['notes', 'Hunter’s Notes'], ['controls', 'Controls']] as const;

  const STEPS = [
    ['Your dice', 'You roll 4 each turn, each a Fang, Claw or blank.'],
    ['Moves', 'Each needs the faces on its right. Select one to attack.'],
    ['Its next move', 'What it does next, and how hard. Read it every turn.'],
    ['Parts', 'Aim at one. Breaking it drops its material.'],
    ['**Block**, **Charge**, **Swap**', 'Where the rest of your dice go.'],
    ['End turn', 'It makes its move, then you roll again.']
  ];
</script>

<div class="help-tabs" role="tablist" aria-label="Help">
  {#each TABS as [k, label]}<button role="tab" aria-selected={help.tab === k} onclick={() => { help.tab = k; }}>{label}</button>{/each}
</div>

{#if help.tab === 'hunt'}
  <div class="howto" role="tabpanel">
    <div class="scheme" aria-hidden="true">
      <div class="s-hp">HP</div>
      <div class="s-left">
        <div class="s-box s-mon">Monster</div>
        <div class="s-box s-tele"><i>3</i>Its next move</div>
        <div class="s-box s-parts"><i>4</i>Parts</div>
      </div>
      <div class="s-right">
        <div class="s-box s-dice"><i>1</i><span class="pips"><b></b><b></b><b></b><b></b></span></div>
        <div class="s-box s-moves"><i>2</i>Moves</div>
        <div class="s-box s-dash"><i>5</i>Block · Charge · Swap</div>
        <div class="s-box s-end"><i>6</i>End turn</div>
      </div>
    </div>
    <ol class="steps">
      {#each STEPS as [h, t], i}<li><span class="n">{i + 1}</span><span><strong><Rich text={h} /></strong>{t}</span></li>{/each}
    </ol>
    <p class="loop">Hunt, break parts, bring the materials to the Forge, make better gear, hunt again. Progress saves itself.</p>
    <!-- the island's lessons, to replay (8 Nov 2026): played on a copy, so nothing in them is kept -->
    <section class="lessons" aria-labelledby="lessons-h">
      <h3 id="lessons-h">Lessons</h3>
      <p class="md">Replay a lesson from the Foothills. Nothing you do in one is kept.</p>
      <ol>
        {#each E.LESSONS as l, i}
          <li><span><strong>{l.name}</strong><span class="md">{l.teaches}</span></span><button class="btn" disabled={game.inHunt || !!game.lesson} onclick={() => { help.open = false; game.startLesson(i); }}>Play</button></li>
        {/each}
      </ol>
      {#if game.inHunt}<p class="md">Finish this hunt first.</p>{/if}
    </section>
  </div>
{:else if help.tab === 'notes'}
  <div class="notes" role="tabpanel">
    <div class="nl">
      <input type="search" placeholder="Search your notes" aria-label="Search your notes" bind:value={q} />
      {#each E.NOTE_GROUPS as g}
        {@const items = shown.filter(n => n.group === g)}
        {#if items.length}
          <p class="ng">{g}</p>
          {#each items as n (n.id)}<button class="ni" aria-current={cur?.id === n.id} onclick={() => { help.entry = n.id; }}>{n.name}</button>{/each}
        {/if}
      {/each}
      {#if !shown.length}<p class="md">Nothing matches.</p>{/if}
      {#if hidden && !q}<p class="md more">{hidden} more to find on your hunts.</p>{/if}
    </div>
    {#if cur}
      <article class="ne" aria-live="polite">
        <p class="ng">{cur.group}</p>
        <h3>{cur.name}</h3>
        <p class="nh"><Rich text={cur.head} self={cur.id} /></p>
        {#each cur.lines as l}<p><Rich text={l} self={cur.id} /></p>{/each}
      </article>
    {/if}
  </div>
{:else}
  <div role="tabpanel"><ul class="helplist">
    <li><strong>Mouse or touch:</strong> select dice, then a move.</li>
    <li><strong>Controller:</strong> d-pad moves, <kbd>A</kbd> selects, <kbd>B</kbd> back. In a hunt: <kbd>Y</kbd> end turn · <kbd>X</kbd> reroll · <kbd>LB</kbd> <kbd>RB</kbd> aim · <kbd>LT</kbd> undo · <kbd>RT</kbd> swap. Elsewhere <kbd>LB</kbd> <kbd>RB</kbd> switch screens. <kbd>Menu</kbd> settings, <kbd>View</kbd> this help.</li>
    <li>Progress saves itself. Reset it in Settings.</li>
  </ul></div>
{/if}

<style>
  .help-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 16px; }
  .help-tabs button { background: none; border: 0; border-bottom: 2px solid transparent; color: var(--muted); padding: 8px 12px; font: inherit; font-weight: 600; cursor: pointer; }
  .help-tabs button[aria-selected='true'] { color: var(--fg); border-bottom-color: var(--gold-hi); }
  .howto { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 24px; align-items: start; }
  @media (max-width: 720px) { .howto { grid-template-columns: 1fr; } }
  .scheme { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--raise); font-size: 13px; color: var(--soft); }
  .s-hp { grid-column: 1 / -1; height: 18px; border-radius: 3px; background: linear-gradient(90deg, color-mix(in srgb, var(--ember-soft) 55%, transparent) 62%, var(--line) 62%); font-size: 11px; padding-left: 6px; line-height: 18px; color: var(--fg); }
  .s-left, .s-right { display: flex; flex-direction: column; gap: 8px; }
  .s-box { position: relative; border: 1px dashed var(--line); border-radius: 3px; padding: 10px 10px 10px 34px; min-height: 28px; display: flex; align-items: center; }
  .s-mon { min-height: 96px; padding-left: 10px; justify-content: center; color: var(--muted); }
  .s-box i { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; border-radius: 50%; background: var(--gold-hi); color: #1e140c; font: 700 11px/18px var(--f-body); text-align: center; font-style: normal; }
  .s-dice .pips { display: flex; gap: 6px; } .s-dice .pips b { width: 22px; height: 22px; border-radius: 4px; border: 1.5px solid var(--soft); }
  .s-moves { min-height: 48px; }
  .steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: var(--fs-sm); color: var(--soft); }
  .steps li { display: flex; gap: 10px; align-items: baseline; }
  .steps .n { flex: none; width: 20px; height: 20px; border-radius: 50%; background: var(--gold-hi); color: #1e140c; font-weight: 700; font-size: 12px; display: grid; place-items: center; transform: translateY(3px); }
  .steps strong { color: var(--fg); display: block; }
  .loop { grid-column: 1 / -1; margin: 0; color: var(--muted); font-size: var(--fs-sm); }
  .lessons { grid-column: 1 / -1; border-top: 1px solid var(--line); padding-top: 14px; }
  .lessons h3 { margin: 0 0 4px; font-size: 18px; }
  .lessons > .md { margin: 0 0 10px; }
  .lessons ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
  .lessons li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--raise); }
  .lessons li > span { display: flex; flex-direction: column; min-width: 0; }
  .lessons strong { color: var(--fg); }
  .notes { display: grid; grid-template-columns: minmax(180px, 220px) minmax(0, 1fr); gap: 24px; min-height: 320px; }
  @media (max-width: 640px) { .notes { grid-template-columns: 1fr; } }
  .nl { display: flex; flex-direction: column; gap: 2px; max-height: 60vh; overflow: auto; padding-right: 4px; }
  .nl input { margin-bottom: 8px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 3px; background: var(--raise); color: var(--fg); font: inherit; }
  .ng { margin: 10px 0 4px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .ni { text-align: left; background: none; border: 0; border-left: 2px solid transparent; padding: 5px 10px; color: var(--soft); font: inherit; cursor: pointer; }
  .ni[aria-current='true'] { color: var(--fg); border-left-color: var(--gold-hi); background: var(--raise); }
  .ni:hover { color: var(--fg); }
  .more { margin-top: 12px; }
  .ne { max-width: 60ch; }
  .ne h3 { margin: 0 0 4px; font-size: 22px; }
  .ne .nh { color: var(--gold-hi); font-weight: 700; margin: 0 0 12px; }
  .ne p { margin: 0 0 8px; color: var(--soft); }
</style>
