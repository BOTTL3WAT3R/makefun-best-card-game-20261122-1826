// The Warden's brain, and the greedy stand-in the headless tests use for the
// human seat. It takes one action at a time so the table can animate between
// its moves: cast a spell that clearly pays, play the biggest creature it
// can afford, then attack - a Guard first because it must, a dangerous enemy
// it can kill next, and the enemy hero with everything else. Its choices are
// meant to be read across the table: no hidden information is used, only the
// board a player can see.

import {
  attack, canPlay, guardsOf, otherSide, playCard,
} from './duel.js';

function handCard(state, who, predicate) {
  const hand = state.sides[who].hand;
  for (let index = 0; index < hand.length; index += 1) {
    if (predicate(hand[index]) && canPlay(state, who, index)) return index;
  }
  return -1;
}

/** Choose Ember Bolt's victim: a Guard in the way, a killable threat, or a hero near death. */
function boltTarget(state, who) {
  const foe = otherSide(who);
  const enemy = state.sides[foe];
  const guards = guardsOf(state, foe);
  const readyAttackers = state.sides[who].field.some((creature) => creature.ready);
  if (readyAttackers) {
    const weakGuard = guards.find((creature) => creature.health <= 3);
    if (weakGuard) return { kind: 'creature', uid: weakGuard.uid };
  }
  const killable = enemy.field
    .filter((creature) => creature.health <= 3 && creature.attack >= 3)
    .sort((a, b) => b.attack - a.attack)[0];
  if (killable) return { kind: 'creature', uid: killable.uid };
  if (enemy.life <= 3) return { kind: 'hero' };
  return null;
}

/** Cast the one spell that clearly pays for itself, if the hand holds it. Returns true on a cast. */
function castSpell(state, who) {
  const me = state.sides[who];
  const foe = state.sides[otherSide(who)];

  const mend = handCard(state, who, (card) => card.spell === 'mend');
  if (mend >= 0 && me.life <= 9) return playCard(state, who, mend);

  const frost = handCard(state, who, (card) => card.spell === 'frost');
  if (frost >= 0) {
    const hits = foe.field.length;
    const kills = foe.field.filter((creature) => creature.health <= 1).length;
    if (hits >= 3 || (hits >= 1 && kills >= 1 && foe.field.some((c) => c.attack >= 3 && c.health <= 1))) {
      return playCard(state, who, frost);
    }
    if (kills >= 2) return playCard(state, who, frost);
  }

  const insight = handCard(state, who, (card) => card.spell === 'insight');
  if (insight >= 0 && me.hand.length <= 4) return playCard(state, who, insight);

  const bolt = handCard(state, who, (card) => card.spell === 'bolt');
  if (bolt >= 0) {
    const target = boltTarget(state, who);
    if (target) return playCard(state, who, bolt, target);
  }
  return false;
}

/** Play the most expensive affordable creature. Returns true on a play. */
function playCreature(state, who) {
  const hand = state.sides[who].hand;
  let best = -1;
  for (let index = 0; index < hand.length; index += 1) {
    if (hand[index].kind !== 'creature') continue;
    if (!canPlay(state, who, index)) continue;
    if (best < 0 || hand[index].cost > hand[best].cost) best = index;
  }
  if (best < 0) return false;
  return playCard(state, who, best);
}

/** Decide one ready creature's attack. Returns true when an attack was made. */
function attackWith(state, who) {
  const foe = otherSide(who);
  const enemy = state.sides[foe];
  const attacker = state.sides[who].field.find((creature) => creature.ready && creature.attack > 0);
  if (!attacker) return false;

  const guards = guardsOf(state, foe);
  if (guards.length > 0) {
    const guard = [...guards].sort((a, b) => a.health - b.health)[0];
    const killsIt = attacker.attack >= guard.health;
    const survives = guard.attack < attacker.health;
    // Do not throw a creature away on a Guard it can neither kill nor survive.
    if (killsIt || survives || attacker.attack >= 3) {
      return attack(state, who, attacker.uid, { kind: 'creature', uid: guard.uid });
    }
    attacker.ready = false; // holds back rather than feeds the Guard
    return true;
  }

  // A kill worth taking: a big threat we can destroy, or any creature we
  // destroy while surviving the trade.
  const prey = enemy.field
    .filter((creature) => creature.health <= attacker.attack && (creature.attack >= 4 || creature.attack < attacker.health))
    .sort((a, b) => b.attack - a.attack)[0];
  if (prey) return attack(state, who, attacker.uid, { kind: 'creature', uid: prey.uid });

  return attack(state, who, attacker.uid, { kind: 'hero' });
}

/**
 * Perform a single action for `who`: a spell, a creature, or one attack.
 * Returns false when the side has nothing left worth doing and should end
 * its turn.
 */
export function takeTurnAction(state, who) {
  if (state.winner || state.active !== who) return false;
  if (castSpell(state, who)) return true;
  if (playCreature(state, who)) return true;
  if (attackWith(state, who)) return true;
  return false;
}

/** Play a whole turn at once (the headless tests use this; the table animates takeTurnAction). */
export function playWholeTurn(state, who, endTurn) {
  let guard = 0;
  while (!state.winner && takeTurnAction(state, who) && guard < 200) guard += 1;
  if (!state.winner) endTurn(state, who);
}
