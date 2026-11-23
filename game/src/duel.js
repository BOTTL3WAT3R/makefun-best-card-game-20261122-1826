// The rules of Emberfall Duel, with no drawing and no DOM: this module is
// the whole game on paper. Two heroes at 20 life. On your turn you gain an
// energy crystal (up to 8), refill your energy and draw a card, then spend
// energy on creatures and spells from your hand. A creature must wait a
// turn before it attacks, unless it has Rush; a Guard must be attacked
// before anything it protects. Attacking trades blows both ways at once.
// First hero at 0 life loses. An empty deck bites back: every card you
// would draw instead deals you one more fatigue damage than the last.
//
// Everything the table needs to animate or announce is appended to
// state.events as it happens; render.js and main.js only read state.

import { CARD_BY_ID, DECK_LIST } from './cards.js';
import { createRng, shuffle } from './random.js';

export const START_LIFE = 20;
export const MAX_ENERGY = 8;
export const MAX_FIELD = 6;
export const MAX_HAND = 9;
export const OPENING_HAND = 4;

export const SIDE_NAMES = { player: 'You', ai: 'The Warden' };

export function otherSide(who) {
  return who === 'player' ? 'ai' : 'player';
}

function makeSide(rng) {
  const deck = shuffle(rng, DECK_LIST.map((cardId) => ({ cardId })));
  return {
    life: START_LIFE,
    energy: 0,
    maxEnergy: 0,
    turnsTaken: 0,
    fatigue: 0,
    deck,
    hand: [],
    field: [],
  };
}

function instantiate(state, cardId) {
  const card = CARD_BY_ID.get(cardId);
  state.nextUid += 1;
  return {
    uid: state.nextUid,
    cardId,
    name: card.name,
    kind: card.kind,
    suit: card.suit,
    cost: card.cost,
    attack: card.attack ?? 0,
    health: card.health ?? 0,
    maxHealth: card.health ?? 0,
    keywords: card.keywords ? [...card.keywords] : [],
    battlecry: card.battlecry ?? null,
    spell: card.spell ?? null,
    needsTarget: card.needsTarget ?? false,
    text: card.text ?? '',
    ready: false,
  };
}

/** A fresh duel: shuffled decks, opening hands, and the player's first turn begun. */
export function createDuel(seed) {
  const rng = createRng(seed);
  const state = {
    seed,
    rng,
    nextUid: 0,
    active: 'player',
    round: 1,
    winner: null,
    sides: { player: makeSide(rng), ai: makeSide(rng) },
    events: [],
    log: [],
  };
  drawCards(state, 'player', OPENING_HAND);
  drawCards(state, 'ai', OPENING_HAND);
  beginTurn(state, 'player');
  note(state, 'Your turn. Play a card, or end the turn.');
  return state;
}

function note(state, line) {
  state.log.push(line);
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

function emit(state, event) {
  state.events.push(event);
}

export function drawCards(state, who, count) {
  const side = state.sides[who];
  for (let index = 0; index < count; index += 1) {
    if (state.winner) return;
    if (side.deck.length === 0) {
      side.fatigue += 1;
      note(state, `${SIDE_NAMES[who]} ${who === 'player' ? 'are' : 'is'} out of cards and take ${side.fatigue} fatigue damage.`);
      damageHero(state, who, side.fatigue);
      continue;
    }
    const drawn = instantiate(state, side.deck.pop().cardId);
    if (side.hand.length >= MAX_HAND) {
      note(state, `${SIDE_NAMES[who]} ${who === 'player' ? 'burn' : 'burns'} ${drawn.name}: hand full.`);
      continue;
    }
    side.hand.push(drawn);
    emit(state, { type: 'draw', side: who, uid: drawn.uid });
  }
}

function beginTurn(state, who) {
  const side = state.sides[who];
  side.turnsTaken += 1;
  side.maxEnergy = Math.min(MAX_ENERGY, side.turnsTaken);
  side.energy = side.maxEnergy;
  for (const creature of side.field) creature.ready = true;
  state.active = who;
  if (who === 'player') state.round = side.turnsTaken;
  emit(state, { type: 'turn', side: who });
  drawCards(state, who, 1);
}

export function guardsOf(state, who) {
  return state.sides[who].field.filter((creature) => creature.keywords.includes('guard'));
}

/** The targets one of `who`'s creatures may legally attack right now. */
export function attackTargets(state, who, attacker) {
  const foe = otherSide(who);
  const guards = guardsOf(state, foe);
  if (guards.length > 0) return guards.map((creature) => ({ kind: 'creature', uid: creature.uid }));
  const targets = state.sides[foe].field.map((creature) => ({ kind: 'creature', uid: creature.uid }));
  targets.push({ kind: 'hero' });
  return targets;
}

export function findCreature(state, who, uid) {
  return state.sides[who].field.find((creature) => creature.uid === uid) ?? null;
}

export function damageHero(state, who, amount) {
  const side = state.sides[who];
  side.life -= amount;
  emit(state, { type: 'hit-hero', side: who, amount });
  if (side.life <= 0 && !state.winner) {
    state.winner = otherSide(who);
    note(state, `${SIDE_NAMES[who]} ${who === 'player' ? 'fall' : 'falls'}. ${SIDE_NAMES[state.winner]} win${state.winner === 'player' ? '' : 's'} the duel.`);
    emit(state, { type: 'game-over', winner: state.winner });
  }
}

export function healHero(state, who, amount) {
  const side = state.sides[who];
  const healed = Math.min(amount, START_LIFE - side.life);
  side.life += healed;
  if (healed > 0) emit(state, { type: 'heal-hero', side: who, amount: healed });
  return healed;
}

function damageCreature(state, who, creature, amount) {
  creature.health -= amount;
  emit(state, { type: 'hit-creature', side: who, uid: creature.uid, amount });
}

function sweepDeaths(state) {
  for (const who of ['player', 'ai']) {
    const side = state.sides[who];
    const dead = side.field.filter((creature) => creature.health <= 0);
    for (const creature of dead) {
      note(state, `${creature.name} is destroyed.`);
      emit(state, { type: 'die', side: who, uid: creature.uid });
    }
    if (dead.length > 0) side.field = side.field.filter((creature) => creature.health > 0);
  }
}

/** Can `who` play the card at handIndex right now (ignoring target choice)? */
export function canPlay(state, who, handIndex) {
  if (state.winner || state.active !== who) return false;
  const side = state.sides[who];
  const card = side.hand[handIndex];
  if (!card || card.cost > side.energy) return false;
  if (card.kind === 'creature' && side.field.length >= MAX_FIELD) return false;
  return true;
}

/**
 * Play the card at handIndex. A targeted spell (Ember Bolt) needs `target`:
 * { kind: 'creature', uid } on the enemy field, or { kind: 'hero' } for the
 * enemy hero. Returns true when the card was played.
 */
export function playCard(state, who, handIndex, target = null) {
  if (!canPlay(state, who, handIndex)) return false;
  const side = state.sides[who];
  const foe = otherSide(who);
  const card = side.hand[handIndex];
  if (card.needsTarget && !target) return false;
  side.energy -= card.cost;
  side.hand.splice(handIndex, 1);
  note(state, `${SIDE_NAMES[who]} play${who === 'player' ? '' : 's'} ${card.name}.`);
  emit(state, { type: 'play', side: who, uid: card.uid, cardId: card.cardId });

  if (card.kind === 'creature') {
    card.ready = card.keywords.includes('rush');
    side.field.push(card);
    if (card.battlecry === 'draw') drawCards(state, who, 1);
    if (card.battlecry === 'burn') damageHero(state, foe, 2);
    if (card.battlecry === 'mend') healHero(state, who, 4);
    return true;
  }

  // Spells resolve at once.
  if (card.spell === 'bolt') {
    if (target.kind === 'hero') damageHero(state, foe, 3);
    else {
      const victim = findCreature(state, foe, target.uid);
      if (victim) damageCreature(state, foe, victim, 3);
    }
  } else if (card.spell === 'frost') {
    for (const victim of [...state.sides[foe].field]) damageCreature(state, foe, victim, 1);
  } else if (card.spell === 'mend') {
    healHero(state, who, 5);
  } else if (card.spell === 'insight') {
    drawCards(state, who, 2);
  }
  sweepDeaths(state);
  return true;
}

/**
 * Attack with one of `who`'s ready creatures. `target` is { kind: 'hero' }
 * or { kind: 'creature', uid }. Both sides deal their attack at once.
 * Returns true when the attack happened.
 */
export function attack(state, who, attackerUid, target) {
  if (state.winner || state.active !== who) return false;
  const foe = otherSide(who);
  const attacker = findCreature(state, who, attackerUid);
  if (!attacker || !attacker.ready || attacker.attack <= 0) return false;
  const legal = attackTargets(state, who, attacker);
  const allowed = legal.some((entry) => entry.kind === target.kind && entry.uid === target.uid);
  if (!allowed) return false;
  attacker.ready = false;
  emit(state, { type: 'attack', side: who, uid: attacker.uid, target });
  if (target.kind === 'hero') {
    note(state, `${attacker.name} hits ${SIDE_NAMES[foe]} for ${attacker.attack}.`);
    damageHero(state, foe, attacker.attack);
  } else {
    const defender = findCreature(state, foe, target.uid);
    if (!defender) return false;
    note(state, `${attacker.name} fights ${defender.name}.`);
    damageCreature(state, foe, defender, attacker.attack);
    damageCreature(state, who, attacker, defender.attack);
  }
  sweepDeaths(state);
  return true;
}

/** End `who`'s turn and begin the other side's. */
export function endTurn(state, who) {
  if (state.winner || state.active !== who) return;
  beginTurn(state, otherSide(who));
}
