// The screenshot scenes behind ?shot=title|play|win|loss. Each scene is a
// real game state reached by playing the actual rules forward from a seeded
// shuffle - the play scene is a genuine mid-duel position found by letting
// the greedy brain play both sides for three rounds, and the win and loss
// scenes are finished duels the same brain really played to the end. A fixed
// seed search order means the same scene comes back every time.

import { playWholeTurn } from './ai.js';
import { createDuel, endTurn } from './duel.js';
import { fieldCardRect } from './render.js';

function baseView() {
  return {
    screen: 'play',
    selectedHand: null,
    selectedAttacker: null,
    targeting: false,
    hover: null,
    banner: null,
    hint: null,
    floaters: [],
    offsets: new Map(),
    pulse: true,
  };
}

function stageTitle() {
  return { state: createDuel(1), view: { ...baseView(), screen: 'title' } };
}

function stagePlay() {
  for (let seed = 1; seed <= 600; seed += 1) {
    const state = createDuel(seed);
    for (let round = 0; round < 3 && !state.winner; round += 1) {
      playWholeTurn(state, 'player', endTurn);
      if (!state.winner) playWholeTurn(state, 'ai', endTurn);
    }
    const player = state.sides.player;
    const ai = state.sides.ai;
    const rich = !state.winner && player.field.length >= 2 && ai.field.length >= 2
      && player.hand.length >= 3 && player.life >= 5 && ai.life >= 5;
    if (!rich) continue;
    state.events.length = 0;
    const view = baseView();
    const affordable = player.hand.findIndex((card) => card.cost <= player.energy);
    view.selectedHand = affordable >= 0 ? affordable : null;
    view.hint = 'Click a card to play it · Click your creature, then a target, to attack · END TURN when you are done';
    const target = fieldCardRect('ai', 0, ai.field.length);
    view.floaters = [{ x: target.x + target.w / 2, y: target.y + 30, value: '-2', color: '#ff8a6a', t: 0.25 }];
    return { state, view };
  }
  throw new Error('no rich mid-game scene found');
}

function stageEnd(wantWinner) {
  for (let seed = 1; seed <= 600; seed += 1) {
    const state = createDuel(seed);
    let turns = 0;
    while (!state.winner && turns < 120) {
      playWholeTurn(state, state.active, endTurn);
      turns += 1;
    }
    if (state.winner !== wantWinner) continue;
    state.events.length = 0;
    const view = baseView();
    view.screen = wantWinner === 'player' ? 'win' : 'loss';
    return { state, view };
  }
  throw new Error(`no finished duel found for winner ${wantWinner}`);
}

/** Build the named scene: 'title', 'play', 'win' or 'loss' (anything else is the title). */
export function stageShot(name) {
  if (name === 'play') return stagePlay();
  if (name === 'win') return stageEnd('player');
  if (name === 'loss') return stageEnd('ai');
  return stageTitle();
}
