// The Emberfall Duel card pool: sixteen creatures and four spells across
// four suits. A suit is a colour and a shape, never just a word: Ember is a
// red flame, Tide a blue droplet, Grove a green leaf and Gloom a violet
// crescent moon, and render.js draws each one as its own picture.
//
// Keywords a creature can carry:
//   guard    - the enemy must attack this creature before any other target
//   rush     - may attack on the turn it is played (others must wait a turn)
//   battlecry - an effect that fires the moment the creature is played;
//               the effect is named by the card's `battlecry` field.

export const SUITS = {
  ember: { name: 'Ember', color: '#e2543e', dark: '#8f2d1d' },
  tide: { name: 'Tide', color: '#3e7fe2', dark: '#1d4b8f' },
  grove: { name: 'Grove', color: '#43a854', dark: '#22662f' },
  gloom: { name: 'Gloom', color: '#8a5fc0', dark: '#53357e' },
};

export const CARDS = [
  // Ember: fast, hot and fragile.
  { id: 'spark-imp', name: 'Spark Imp', kind: 'creature', suit: 'ember', cost: 1, attack: 2, health: 1, text: '' },
  { id: 'cinder-hound', name: 'Cinder Hound', kind: 'creature', suit: 'ember', cost: 2, attack: 3, health: 2, text: '' },
  { id: 'forge-golem', name: 'Forge Golem', kind: 'creature', suit: 'ember', cost: 4, attack: 4, health: 5, keywords: ['guard'], text: 'Guard' },
  { id: 'pyre-drake', name: 'Pyre Drake', kind: 'creature', suit: 'ember', cost: 6, attack: 6, health: 5, text: '' },
  // Tide: patient, sturdy, fond of card draw.
  { id: 'brook-sprite', name: 'Brook Sprite', kind: 'creature', suit: 'tide', cost: 1, attack: 1, health: 2, battlecry: 'draw', text: 'Battlecry: draw a card' },
  { id: 'wave-serpent', name: 'Wave Serpent', kind: 'creature', suit: 'tide', cost: 3, attack: 3, health: 4, text: '' },
  { id: 'reef-warden', name: 'Reef Warden', kind: 'creature', suit: 'tide', cost: 3, attack: 2, health: 5, keywords: ['guard'], text: 'Guard' },
  { id: 'storm-herald', name: 'Storm Herald', kind: 'creature', suit: 'tide', cost: 5, attack: 4, health: 5, battlecry: 'burn', text: 'Battlecry: deal 2 damage to the enemy hero' },
  // Grove: grows big bodies and mends its hero.
  { id: 'sprout-pup', name: 'Sprout Pup', kind: 'creature', suit: 'grove', cost: 1, attack: 1, health: 3, text: '' },
  { id: 'thornback-boar', name: 'Thornback Boar', kind: 'creature', suit: 'grove', cost: 2, attack: 2, health: 3, keywords: ['rush'], text: 'Rush' },
  { id: 'elder-treant', name: 'Elder Treant', kind: 'creature', suit: 'grove', cost: 5, attack: 4, health: 7, keywords: ['guard'], text: 'Guard' },
  { id: 'grove-matriarch', name: 'Grove Matriarch', kind: 'creature', suit: 'grove', cost: 6, attack: 5, health: 6, battlecry: 'mend', text: 'Battlecry: restore 4 life to your hero' },
  // Gloom: cheap tricks and heavy shadows.
  { id: 'dusk-bat', name: 'Dusk Bat', kind: 'creature', suit: 'gloom', cost: 1, attack: 1, health: 1, keywords: ['rush'], text: 'Rush' },
  { id: 'shade-stalker', name: 'Shade Stalker', kind: 'creature', suit: 'gloom', cost: 3, attack: 4, health: 2, text: '' },
  { id: 'night-revenant', name: 'Night Revenant', kind: 'creature', suit: 'gloom', cost: 4, attack: 3, health: 5, text: '' },
  { id: 'void-caller', name: 'Void Caller', kind: 'creature', suit: 'gloom', cost: 7, attack: 7, health: 7, text: '' },
  // Spells. `spell` names the effect duel.js resolves; `needsTarget` spells
  // wait for the player to click a victim before they resolve.
  { id: 'ember-bolt', name: 'Ember Bolt', kind: 'spell', suit: 'ember', cost: 2, spell: 'bolt', needsTarget: true, text: 'Deal 3 damage to an enemy creature or the enemy hero' },
  { id: 'frost-shards', name: 'Frost Shards', kind: 'spell', suit: 'tide', cost: 3, spell: 'frost', text: 'Deal 1 damage to ALL enemy creatures' },
  { id: 'mend-wounds', name: 'Mend Wounds', kind: 'spell', suit: 'grove', cost: 2, spell: 'mend', text: 'Restore 5 life to your hero' },
  { id: 'insight', name: 'Insight', kind: 'spell', suit: 'gloom', cost: 2, spell: 'insight', text: 'Draw 2 cards' },
];

export const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));

/** Both duelists play from this thirty-card list; the shuffle makes the games differ. */
export const DECK_LIST = [
  'spark-imp', 'spark-imp', 'cinder-hound', 'cinder-hound', 'forge-golem', 'pyre-drake',
  'brook-sprite', 'brook-sprite', 'wave-serpent', 'wave-serpent', 'reef-warden', 'storm-herald',
  'sprout-pup', 'sprout-pup', 'thornback-boar', 'thornback-boar', 'elder-treant', 'grove-matriarch',
  'dusk-bat', 'dusk-bat', 'shade-stalker', 'shade-stalker', 'night-revenant', 'void-caller',
  'ember-bolt', 'ember-bolt', 'frost-shards', 'mend-wounds', 'insight', 'insight',
];
