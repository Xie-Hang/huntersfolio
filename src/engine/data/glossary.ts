// Hunter's Notes (Nov 2026, Mekkman): one entry per game term, the bold words of the text rules. Each entry is the
// same shape as a tip: a short header (the caption) and a few plain lines. Help shows only the terms a player has
// met (or the basics, `always`), and a bold term anywhere in the game opens its entry. Keep these in step with the
// tags, card and perks: same words (see the word list in the status doc).

export type NoteGroup = 'Your turn' | 'Damage types' | 'Weapon tags' | 'Monster states' | 'On you' | 'Hunting' | 'Gear';
export const NOTE_GROUPS: NoteGroup[] = ['Your turn', 'Damage types', 'Weapon tags', 'Monster states', 'On you', 'Hunting', 'Gear'];

export interface NoteDef {
  id: string;
  name: string;
  group: NoteGroup;
  /** other spellings a bold term may take (plurals, verb forms, a tag's own label) */
  aka?: string[];
  head: string;
  lines: string[];
  /** listed from the start, before it's met */
  always?: boolean;
}

const notes: NoteDef[] = [
  // Your turn
  { id: 'dice', name: 'Dice', group: 'Your turn', aka: ['Fang', 'Fangs', 'Claw', 'Claws', 'blank', 'blanks'], always: true,
    head: 'Fangs, Claws and blanks',
    lines: ['You roll 4 dice each turn.', 'Each move needs certain faces, shown on its right.', 'A blank is not wild. It fits no move.'] },
  { id: 'block', name: 'Block', group: 'Your turn', always: true,
    head: 'Takes less damage from its next move',
    lines: ['**Block** is used to take less damage from its next move.', 'Your armour sets how much each die blocks.', 'Some moves weaken or ignore **Block**.'] },
  { id: 'reroll', name: 'Reroll', group: 'Your turn', aka: ['Rerolls'], always: true,
    head: 'Rolls the selected dice again',
    lines: ['Select one or more dice, then **Reroll**.', 'Your armour sets how many you get for the whole hunt.'] },
  { id: 'undo', name: 'Undo', group: 'Your turn', always: true,
    head: 'Takes back your last action',
    lines: ['Changed your mind? **Undo** takes back the last thing you did this turn.'] },
  { id: 'swap', name: 'Swap', group: 'Your turn',
    head: 'Switch to your other weapon',
    lines: ['You carry two weapons. **Swap** costs any 1 die.'] },
  { id: 'charge', name: 'Charge', group: 'Your turn', aka: ['Charged'],
    head: 'Your first hit next turn does double',
    lines: ['Spend 2 dice. Your first hit next turn does double damage.', 'If its attack damages you, the charge fails.'] },
  // Damage types
  { id: 'cut', name: 'Cut', group: 'Damage types',
    head: 'Blades',
    lines: ['Every blade hits as **Cut**.', 'The parts table shows which parts it breaks best.'] },
  { id: 'blunt', name: 'Blunt', group: 'Damage types',
    head: 'Mauls',
    lines: ['Every maul hits as **Blunt**.', 'Only **Blunt** reaches a monster underground, and a heavy **Blunt** hit drives it up.'] },
  { id: 'pierce', name: 'Pierce', group: 'Damage types',
    head: 'Bows',
    lines: ['Every bow hits as **Pierce**.', 'Only **Pierce** reaches a monster in the air.'] },
  // Weapon tags
  { id: 'flow', name: 'Flow', group: 'Weapon tags',
    head: '+1 Reroll, once a turn',
    lines: ['A **Flow** move gives +1 **Reroll**, once a turn.', 'Its dice are still spent.'] },
  { id: 'daze', name: 'Daze', group: 'Weapon tags', aka: ['Dazed'],
    head: 'Fills its Daze meter',
    lines: ['On its **Daze** part, a **Daze** move fills the **Daze** meter.', 'A full meter makes it lose its turn, then it recovers for a turn.'] },
  { id: 'expose', name: 'Expose', group: 'Weapon tags', aka: ['Exposes', 'Exposed'],
    head: 'The part takes more damage for 2 turns',
    lines: ['An **Expose** move marks the part for 2 turns.', 'Every hit there, from either weapon, gets +20% and counts double toward breaking it.'] },
  // Monster states
  { id: 'enraged', name: 'Enraged', group: 'Monster states',
    head: 'Hits harder',
    lines: ['Below half its HP, its attacks hit harder, and some of its moves change.'] },
  { id: 'airborne', name: 'Airborne', group: 'Monster states',
    head: 'Only Pierce hits',
    lines: ['Only **Pierce** can hit until it lands.', '**Pinning Shot** or a **Weighted Net** brings it down.'] },
  { id: 'underground', name: 'Underground', group: 'Monster states',
    head: 'Only Blunt hits',
    lines: ['Only **Blunt** can hit until it comes up, and some burrowers take half damage there.', 'A heavy **Blunt** hit or **Blast Powder** forces it up, dazed, and stops its next move.'] },
  { id: 'plating', name: 'Ice and slate', group: 'Monster states', aka: ['Ice', 'Slate', 'Scales'],
    head: 'Takes hits before HP',
    lines: ['Each hit breaks a layer instead of taking its HP.', 'A **Cut** hit breaks two.', '**Charge** and whetstone bonuses are used up on the layers.', 'A **Firepot** breaks all of it at once.'] },
  { id: 'mud', name: 'Muddy hide', group: 'Monster states',
    head: 'Hide takes half damage',
    lines: ['Your hits on its hide do half damage until the mud dries.', 'Except **Pierce** hits do full damage.'] },
  { id: 'molten', name: 'Molten', group: 'Monster states',
    head: 'Cut and Blunt hits burn you',
    lines: ['Your **Cut** and **Blunt** hits on it burn you until it cools.'] },
  { id: 'shell', name: 'In its shell', group: 'Monster states',
    head: 'Takes half damage until it acts',
    lines: ['Your hits do half damage until its next move.'] },
  { id: 'mirage', name: 'Images', group: 'Monster states', aka: ['Steam'],
    head: 'First hit only',
    lines: ['Only your first hit each turn lands.'] },
  { id: 'shroud', name: 'Iced feathers', group: 'Monster states',
    head: 'Only Cut and Blunt hits',
    lines: ['Only **Cut** and **Blunt** can hit until the ice melts.', 'The ice melts after it acts 3 times on the ground.'] },
  { id: 'trapped', name: 'Trapped', group: 'Monster states',
    head: 'Loses its turns',
    lines: ['It loses its turns while it’s held.', 'A **Snare** you set now always closes.'] },
  { id: 'capturable', name: 'Capturable', group: 'Monster states', aka: ['Capture'],
    head: 'Ready to Snare',
    lines: ['At 20% HP or less, set a **Snare** with 2 dice.', 'It closes at the end of your turn, unless it hits you for 30 or more.', 'A capture gives double part materials.'] },
  // On you
  { id: 'infect', name: 'Infect', group: 'On you', aka: ['Infected'],
    head: 'Takes HP every turn',
    lines: ['**Infect** takes a little HP at the end of each turn until it wears off.', 'Some weapons put it on the monster instead.'] },
  { id: 'spark', name: 'Spark', group: 'On you',
    head: 'Goes off at 3',
    lines: ['Each **Spark** on you builds up. At 3 it goes off through your **Block**.', 'Any **Blunt** move grounds 1.'] },
  { id: 'static', name: 'Static', group: 'On you',
    head: 'Goes off on Block or if unused',
    lines: ['A **Static** die is safe on a move, **Charge**, **Swap** or **Snare**.', 'Used for **Block** or left unused, it goes off and does 15 damage to you.'] },
  { id: 'drain', name: 'Drain', group: 'On you', aka: ['Leeching', 'Latched on'],
    head: 'Takes HP to heal',
    lines: ['It takes HP from you, through your **Block**, and heals what it takes.', 'A **Drain** weapon heals you the same way.'] },
  // Hunting
  { id: 'parts', name: 'Breaking parts', group: 'Hunting', aka: ['Daze part'], always: true,
    head: 'Aim, break, drop materials',
    lines: ['Aim at a part under the monster. Its chip says how fast your weapon breaks it.', 'A broken part weakens the monster and drops its material.', 'Every hit still counts against its HP.'] },
  { id: 'snare', name: 'Snare', group: 'Hunting', aka: ['Snares'],
    head: 'Needed to capture',
    lines: ['You carry **Snares** on every hunt, outside your item slot.', 'Each try uses one.'] },
  { id: 'elements', name: 'Elements', group: 'Hunting', aka: ['Stone', 'Gale', 'Ember', 'Frost'],
    head: 'Weakness and resist',
    lines: ['Every monster has an element. A hit on its weakness takes more. A resisted one takes less.', 'Armour that resists its element takes 30% off its elemental attacks.'] },
  // Gear
  { id: 'armour', name: 'Armour', group: 'Gear',
    head: 'Your HP, Block and Rerolls',
    lines: ['Armour sets your HP, how much each die blocks, and your **Rerolls**.', 'Most armour also resists one element.'] },
  { id: 'charms', name: 'Charms', group: 'Gear',
    head: 'One small perk',
    lines: ['A charm gives one small perk. You wear one at a time.'] },
  { id: 'items', name: 'Items', group: 'Gear',
    head: 'Free, once a turn',
    lines: ['Items cost no dice. One item a turn.', 'Lose a hunt, and the items you carried are gone.'] },
  { id: 'reinforce', name: 'Reinforcing', group: 'Gear',
    head: 'Up to +3',
    lines: ['Each step adds 5% to a weapon’s hits, or 10 HP and +1 **Block** to armour.', 'Upgrading keeps it.'] },
  { id: 'tracking', name: 'Tracking', group: 'Gear',
    head: 'Flags what to hunt',
    lines: ['Track a recipe at the Forge. Its materials are flagged on the Hunt Board and in the Shop.'] }
];

export const NOTES: Record<string, NoteDef> = Object.fromEntries(notes.map(n => [n.id, n]));
const BY_TERM = new Map<string, string>();
for (const n of notes) for (const t of [n.name, ...(n.aka ?? [])]) BY_TERM.set(t.toLowerCase(), n.id);
/** the entry a bold term or tag label belongs to, if any */
export const noteFor = (term: string): string | undefined => BY_TERM.get(term.replace(/\s*×\d+$/, '').trim().toLowerCase());
