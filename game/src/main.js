// Emberfall Duel's entry point: it owns the canvas, the mouse and keyboard,
// the animation clock and the Warden's turn timer, and it translates the
// duel's events into lunges and floating damage numbers. The rules live in
// duel.js, the Warden's choices in ai.js and every drawing in render.js;
// this file only connects them to the player.
//
// With ?shot=title|play|win|loss in the address it stages one screenshot
// scene from shots.js and holds it still, which is how the entry's
// screenshots were taken.

import { takeTurnAction } from './ai.js';
import {
  attack, canPlay, endTurn, otherSide, playCard,
} from './duel.js';
import { createDuel } from './duel.js';
import {
  VIEW_H, VIEW_W, aiHandRect, deckRect, drawGame, endTurnRect, fieldCardRect,
  handCardRect, heroBadgeRect, playAgainRect, playButtonRect,
} from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const view = {
  screen: 'title',
  selectedHand: null,
  selectedAttacker: null,
  targeting: false,
  hover: null,
  banner: null,
  hint: 'Click a card to play it · Click your creature, then a target, to attack',
  floaters: [],
  offsets: new Map(),
  pulse: false,
};

let state = createDuel((Date.now() % 100000) + 1);
let lunges = [];
let aiClock = 0;
let bannerClock = 0;
let pulseClock = 0;

function inRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function creatureAt(side, x, y) {
  const field = state.sides[side].field;
  for (let index = field.length - 1; index >= 0; index -= 1) {
    if (inRect(x, y, fieldCardRect(side, index, field.length))) return field[index];
  }
  return null;
}

/** Turn the events an action produced into floaters and lunges the eye can follow. */
function drainEvents() {
  for (const event of state.events.splice(0)) {
    if (event.type === 'hit-creature') {
      const field = state.sides[event.side].field;
      const index = field.findIndex((creature) => creature.uid === event.uid);
      const rect = index >= 0 ? fieldCardRect(event.side, index, field.length) : deckRect(event.side);
      view.floaters.push({ x: rect.x + rect.w / 2, y: rect.y + 26, value: `-${event.amount}`, color: '#ff8a6a', t: 0 });
    } else if (event.type === 'hit-hero') {
      const rect = heroBadgeRect(event.side);
      view.floaters.push({ x: rect.x + 123, y: rect.y + 20, value: `-${event.amount}`, color: '#ff8a6a', t: 0 });
    } else if (event.type === 'heal-hero') {
      const rect = heroBadgeRect(event.side);
      view.floaters.push({ x: rect.x + 123, y: rect.y + 20, value: `+${event.amount}`, color: '#7fe2a0', t: 0 });
    } else if (event.type === 'attack') {
      lunges.push({ uid: event.uid, dir: event.side === 'player' ? -1 : 1, t: 0 });
    } else if (event.type === 'turn') {
      view.banner = event.side === 'player' ? 'Your turn' : "The Warden's turn";
      bannerClock = 0;
    } else if (event.type === 'game-over') {
      view.screen = event.winner === 'player' ? 'win' : 'loss';
    }
  }
}

function clearSelection() {
  view.selectedHand = null;
  view.selectedAttacker = null;
  view.targeting = false;
}

function startGame() {
  state = createDuel((Date.now() % 100000) + 1);
  state.events.length = 0;
  clearSelection();
  lunges = [];
  view.floaters = [];
  view.screen = 'play';
  view.banner = 'Your turn - good luck, duelist';
  bannerClock = 0;
}

function onTitleClick(x, y) {
  if (inRect(x, y, playButtonRect())) startGame();
}

function onEndClick() {
  startGame();
}

function onPlayClick(x, y) {
  if (state.winner) return;
  if (inRect(x, y, endTurnRect())) {
    if (state.active === 'player') {
      clearSelection();
      endTurn(state, 'player');
      drainEvents();
    }
    return;
  }
  if (state.active !== 'player') return;

  // A target click, while a spell or an attacker is waiting for one.
  if (view.targeting || view.selectedAttacker !== null) {
    const victim = creatureAt('ai', x, y);
    if (victim) {
      if (view.targeting) {
        const index = view.selectedHand;
        if (playCard(state, 'player', index, { kind: 'creature', uid: victim.uid })) clearSelection();
      } else if (attack(state, 'player', view.selectedAttacker, { kind: 'creature', uid: victim.uid })) {
        view.selectedAttacker = null;
      }
      drainEvents();
      return;
    }
    if (inRect(x, y, heroBadgeRect('ai'))) {
      if (view.targeting) {
        if (playCard(state, 'player', view.selectedHand, { kind: 'hero' })) clearSelection();
      } else if (attack(state, 'player', view.selectedAttacker, { kind: 'hero' })) {
        view.selectedAttacker = null;
      }
      drainEvents();
      return;
    }
    clearSelection();
    return;
  }

  // Pick one of my creatures to attack with.
  const mine = creatureAt('player', x, y);
  if (mine) {
    if (mine.ready && mine.attack > 0) {
      view.selectedAttacker = mine.uid;
      view.targeting = false;
      view.hint = 'Now click the creature - or the Warden - it should attack';
    }
    return;
  }

  // Play a card from my hand.
  const hand = state.sides.player.hand;
  for (let index = hand.length - 1; index >= 0; index -= 1) {
    if (!inRect(x, y, handCardRect(index, hand.length))) continue;
    if (!canPlay(state, 'player', index)) {
      view.hint = hand[index].cost > state.sides.player.energy
        ? `Not enough energy for ${hand[index].name} - it costs ${hand[index].cost}`
        : 'That card cannot be played right now';
      return;
    }
    if (hand[index].needsTarget) {
      view.selectedHand = index;
      view.targeting = true;
      view.hint = `Choose a target for ${hand[index].name}`;
      return;
    }
    playCard(state, 'player', index);
    drainEvents();
    return;
  }
  clearSelection();
}

canvas.addEventListener('click', (event) => {
  const box = canvas.getBoundingClientRect();
  const x = (event.clientX - box.left) * (VIEW_W / box.width);
  const y = (event.clientY - box.top) * (VIEW_H / box.height);
  if (view.screen === 'title') onTitleClick(x, y);
  else if (view.screen === 'win' || view.screen === 'loss') {
    if (inRect(x, y, playAgainRect())) onEndClick();
  } else onPlayClick(x, y);
});

canvas.addEventListener('mousemove', (event) => {
  const box = canvas.getBoundingClientRect();
  const x = (event.clientX - box.left) * (VIEW_W / box.width);
  const y = (event.clientY - box.top) * (VIEW_H / box.height);
  view.hover = null;
  if (view.screen !== 'play') return;
  const hand = state.sides.player.hand;
  for (let index = 0; index < hand.length; index += 1) {
    if (inRect(x, y, handCardRect(index, hand.length))) view.hover = { type: 'hand', index };
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') clearSelection();
  if ((event.key === 'Enter' || event.key === ' ') && view.screen !== 'play') startGame();
  else if (event.key === 'Enter' && view.screen === 'play' && state.active === 'player' && !state.winner) {
    endTurn(state, 'player');
    drainEvents();
  }
});

/** Advance floaters, lunges and the Warden's clock; repaint. */
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - (frame.last ?? timestamp)) / 1000);
  frame.last = timestamp;

  pulseClock += dt;
  view.pulse = Math.floor(pulseClock * 1.6) % 2 === 0;
  if (view.banner) {
    bannerClock += dt;
    if (bannerClock > 1.5) view.banner = null;
  }
  for (const floater of view.floaters) floater.t += dt;
  view.floaters = view.floaters.filter((floater) => floater.t < 1.1);
  view.offsets.clear();
  lunges = lunges.filter((lunge) => lunge.t < 0.32);
  for (const lunge of lunges) {
    lunge.t += dt;
    const reach = Math.sin((lunge.t / 0.32) * Math.PI) * 26;
    view.offsets.set(lunge.uid, { x: 0, y: lunge.dir * reach });
  }

  if (view.screen === 'play' && !state.winner && state.active === 'ai') {
    aiClock += dt;
    if (aiClock > 0.62) {
      aiClock = 0;
      if (!takeTurnAction(state, 'ai')) endTurn(state, 'ai');
      drainEvents();
    }
  } else {
    aiClock = 0;
  }

  drawGame(ctx, state, view);
  requestAnimationFrame(frame);
}

// Screenshot mode: stage one scene and hold it still.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  const staged = stageShot(shot);
  state = staged.state;
  Object.assign(view, staged.view);
  drawGame(ctx, state, view);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
