// npm run sim — prints a balance report from simulated hunts on the real engine.
import { gorehornCampaign, matchup, median, type Setup } from './scenarios';
import type { Skill } from './bot';

const N = Number(process.argv[2]) || 1500;
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);

const SETUPS: [string, Setup][] = [
  ['Gorehorn · starter, 3 Salves', { weapons: [['blade', 0], ['maul', 0]], armor: 'jerkin', item: 'salve', target: 'gorehorn' }],
  ['Gorehorn · starter, no item', { weapons: [['blade', 0], ['maul', 0]], armor: 'jerkin', target: 'gorehorn' }],
  ['Gorehorn · Saber + Tuskbreaker, Vest', { weapons: [['saber', 0], ['tusk', 0]], armor: 'vest', item: 'salve', target: 'gorehorn' }],
  ['Galeshrike · starter, 3 Salves', { weapons: [['blade', 0], ['maul', 0]], armor: 'jerkin', item: 'salve', target: 'galeshrike' }],
  ['Galeshrike · starter, 2 Nets', { weapons: [['blade', 0], ['maul', 0]], armor: 'jerkin', item: 'net', items: 2, target: 'galeshrike' }],
  ['Galeshrike · Bow + Blade, 3 Salves', { weapons: [['bow', 0], ['blade', 0]], armor: 'jerkin', item: 'salve', target: 'galeshrike' }],
  ['Galeshrike · Gorehorn gear, Vest', { weapons: [['saber', 0], ['tusk', 0]], armor: 'vest', item: 'salve', target: 'galeshrike' }],
  ['Galeshrike · Galeshrike gear, Coat', { weapons: [['windbow', 0], ['gale', 0]], armor: 'coat', item: 'salve', target: 'galeshrike' }]
];

console.log(`\nSingle hunts (${N} each)\n`);
console.log('setup                                   | player  | win  | capt | turns | HP left | parts');
for (const [name, s] of SETUPS) for (const skill of ['skilled', 'casual'] as Skill[]) {
  const r = matchup(s, { skill, capture: true }, N);
  console.log(`${name.padEnd(39)} | ${skill.padEnd(7)} | ${pct(r.win)} | ${pct(r.captured)} | ${r.turns.toFixed(1).padStart(5)} | ${pct(r.hpLeft).padStart(7)} | ${r.parts.toFixed(2)}`);
}

const P = Math.min(400, N);
console.log(`\nGorehorn progression (${P} campaigns, skilled, always capture)\n`);
const C = Array.from({ length: P }, (_, i) => gorehornCampaign(i + 1, { skill: 'skilled', capture: true }));
for (const [k, label] of [['tusk', 'Tuskbreaker (first upgrade)'], ['vest', 'Bristlehide Vest'], ['saber', 'Bristle Saber'], ['heartstone', 'First Heartstone'], ['crusher', 'Gorehorn Crusher'], ['done', 'Everything at +3']] as const) {
  const v = C.map(c => c.t[k]).filter((x): x is number => x != null);
  console.log(`${label.padEnd(30)} median hunt ${String(v.length ? median(v) : '—').padStart(3)}   reached ${pct(v.length / P)}`);
}
