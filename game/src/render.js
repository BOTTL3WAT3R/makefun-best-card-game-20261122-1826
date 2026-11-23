// Every pixel of Emberfall Duel is drawn here, on a 1280x720 canvas: the
// felt, the heroes, the fields, the hands, and the title, victory and defeat
// screens. Nothing in this file changes the game; it reads the duel state
// and a small view object (selection, hover, damage floaters, animation
// offsets) and paints what it finds. The layout helpers are exported so
// main.js can hit-test clicks against exactly the rectangles drawn here.
//
// Cards are told apart by colour and shape, never by text alone: each suit
// paints its band and gem in its own colour and draws its own picture - a
// flame, a droplet, a leaf, a crescent moon - in the card's art window.

import { CARD_BY_ID, SUITS } from './cards.js';
import { MAX_ENERGY } from './duel.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

const FELT_TOP = '#103c3a';
const FELT_BOTTOM = '#081f26';
const GOLD = '#d9a441';
const GOLD_LIGHT = '#f2cd7e';
const PARCHMENT = '#f4e8cd';
const PARCHMENT_DARK = '#e2d0a4';
const INK = '#2a2018';

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2);
  ctx.lineTo(x + radius, y + h);
  ctx.arc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + radius);
  ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, style) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = style;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r, style, width) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.stroke();
}

function circle(ctx, cx, cy, r, style) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = style;
  ctx.fill();
}

function verticalGradient(ctx, y0, y1, stops) {
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  return gradient;
}

function text(ctx, value, x, y, font, style, align = 'center', baseline = 'middle') {
  ctx.font = font;
  ctx.fillStyle = style;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(value, x, y);
}

function wrapLines(ctx, value, font, maxWidth) {
  ctx.font = font;
  const words = value.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The four suit pictures, drawn with paths at (cx, cy) inside `size`. */
export function drawSuitIcon(ctx, suit, cx, cy, size, color) {
  const s = size;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  if (suit === 'ember') {
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.75, cy - s * 0.15, cx + s * 0.55, cy + s * 0.35, cx + s * 0.42, cy + s * 0.62);
    ctx.bezierCurveTo(cx + s * 0.3, cy + s * 0.95, cx - s * 0.3, cy + s * 0.95, cx - s * 0.42, cy + s * 0.62);
    ctx.bezierCurveTo(cx - s * 0.55, cy + s * 0.35, cx - s * 0.75, cy - s * 0.15, cx, cy - s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.25);
    ctx.bezierCurveTo(cx + s * 0.34, cy + s * 0.2, cx + s * 0.26, cy + s * 0.45, cx + s * 0.16, cy + s * 0.62);
    ctx.bezierCurveTo(cx + s * 0.08, cy + s * 0.8, cx - s * 0.08, cy + s * 0.8, cx - s * 0.16, cy + s * 0.62);
    ctx.bezierCurveTo(cx - s * 0.26, cy + s * 0.45, cx - s * 0.34, cy + s * 0.2, cx, cy - s * 0.25);
    ctx.closePath();
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fill();
  } else if (suit === 'tide') {
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.62, cy - s * 0.1, cx + s * 0.72, cy + s * 0.3, cx + s * 0.72, cy + s * 0.52);
    ctx.bezierCurveTo(cx + s * 0.72, cy + s * 0.92, cx - s * 0.72, cy + s * 0.92, cx - s * 0.72, cy + s * 0.52);
    ctx.bezierCurveTo(cx - s * 0.72, cy + s * 0.3, cx - s * 0.62, cy - s * 0.1, cx, cy - s);
    ctx.closePath();
    ctx.fill();
  } else if (suit === 'grove') {
    ctx.moveTo(cx - s * 0.7, cy + s * 0.75);
    ctx.bezierCurveTo(cx - s * 0.75, cy - s * 0.45, cx + s * 0.1, cy - s * 0.85, cx + s * 0.78, cy - s * 0.78);
    ctx.bezierCurveTo(cx + s * 0.8, cy + s * 0.15, cx + s * 0.25, cy + s * 0.72, cx - s * 0.7, cy + s * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.62, cy + s * 0.68);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
    ctx.strokeStyle = FELT_BOTTOM;
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.stroke();
  } else {
    // Gloom: a crescent from two arcs.
    ctx.arc(cx, cy, s * 0.85, Math.PI * 0.32, Math.PI * 1.68);
    ctx.arc(cx + s * 0.42, cy - s * 0.12, s * 0.68, Math.PI * 1.55, Math.PI * 0.45, true);
    ctx.closePath();
    ctx.fill();
    circle(ctx, cx + s * 0.52, cy - s * 0.52, s * 0.11, color);
  }
}

/** Spell pictures, keyed by the spell's effect name. */
function drawSpellIcon(ctx, spell, cx, cy, size, color) {
  const s = size;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (spell === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.28, cy - s);
    ctx.lineTo(cx - s * 0.42, cy + s * 0.18);
    ctx.lineTo(cx - s * 0.02, cy + s * 0.18);
    ctx.lineTo(cx - s * 0.28, cy + s);
    ctx.lineTo(cx + s * 0.45, cy - s * 0.22);
    ctx.lineTo(cx + s * 0.05, cy - s * 0.22);
    ctx.closePath();
    ctx.fill();
  } else if (spell === 'frost') {
    ctx.lineWidth = Math.max(2, s * 0.13);
    for (let arm = 0; arm < 3; arm += 1) {
      const angle = (arm * Math.PI) / 3;
      const dx = Math.cos(angle) * s * 0.85;
      const dy = Math.sin(angle) * s * 0.85;
      ctx.beginPath();
      ctx.moveTo(cx - dx, cy - dy);
      ctx.lineTo(cx + dx, cy + dy);
      ctx.stroke();
    }
    circle(ctx, cx, cy, s * 0.16, color);
  } else if (spell === 'mend') {
    const w = s * 0.34;
    fillRoundRect(ctx, cx - w / 2, cy - s * 0.85, w, s * 1.7, w / 3, color);
    fillRoundRect(ctx, cx - s * 0.85, cy - w / 2, s * 1.7, w, w / 3, color);
  } else {
    // Insight: an open eye.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.9, cy);
    ctx.bezierCurveTo(cx - s * 0.4, cy - s * 0.75, cx + s * 0.4, cy - s * 0.75, cx + s * 0.9, cy);
    ctx.bezierCurveTo(cx + s * 0.4, cy + s * 0.75, cx - s * 0.4, cy + s * 0.75, cx - s * 0.9, cy);
    ctx.closePath();
    ctx.fill();
    circle(ctx, cx, cy, s * 0.3, FELT_BOTTOM);
    circle(ctx, cx, cy, s * 0.16, color);
  }
}

/**
 * One card face (or back) at x, y with width w and height h. `card` is a
 * duel instance (or a pool card); options carry the table states: faceDown,
 * selected, hover, dimmed, affordable.
 */
export function drawCard(ctx, x, y, w, h, card, options = {}) {
  const suit = SUITS[card.suit];
  if (options.faceDown) {
    fillRoundRect(ctx, x, y, w, h, 9, verticalGradient(ctx, y, y + h, [[0, '#2c3e70'], [1, '#191f42']]));
    strokeRoundRect(ctx, x + 2, y + 2, w - 4, h - 4, 7, GOLD, 2);
    drawSuitIcon(ctx, 'gloom', x + w / 2, y + h / 2 - 4, Math.min(w, h) * 0.2, GOLD);
    if (h >= 100) {
      text(ctx, 'EMBERFALL', x + w / 2, y + h - 14, `700 ${Math.round(h * 0.075)}px 'Trebuchet MS', sans-serif`, GOLD_LIGHT);
    }
    return;
  }
  const lift = options.selected ? -10 : options.hover ? -6 : 0;
  const top = y + lift;
  // Body and suit frame.
  fillRoundRect(ctx, x, top, w, h, 10, verticalGradient(ctx, top, top + h, [[0, PARCHMENT], [1, PARCHMENT_DARK]]));
  strokeRoundRect(ctx, x + 1, top + 1, w - 2, h - 2, 9, suit.dark, 3);
  if (options.selected) strokeRoundRect(ctx, x - 3, top - 3, w + 6, h + 6, 12, GOLD, 4);
  // Name band: the name starts clear of the cost gem and shrinks to fit.
  fillRoundRect(ctx, x + 5, top + 5, w - 10, h * 0.17, 6, suit.color);
  let nameSize = Math.max(9, Math.round(h * 0.085));
  ctx.font = `700 ${nameSize}px 'Trebuchet MS', sans-serif`;
  while (ctx.measureText(card.name).width > w - 33 && nameSize > 8) {
    nameSize -= 0.5;
    ctx.font = `700 ${nameSize}px 'Trebuchet MS', sans-serif`;
  }
  let name = card.name;
  while (ctx.measureText(name).width > w - 33 && name.length > 4) name = name.slice(0, -1);
  if (name !== card.name) name = `${name}…`;
  text(ctx, name, x + 27, top + 5 + h * 0.085, `700 ${nameSize}px 'Trebuchet MS', sans-serif`, '#ffffff', 'left');
  // Cost gem.
  circle(ctx, x + 13, top + 13, 11, '#274b8f');
  ctx.beginPath();
  ctx.arc(x + 13, top + 13, 11, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, String(card.cost), x + 13, top + 14, `700 14px 'Trebuchet MS', sans-serif`, '#ffffff');
  // Art window with the suit picture (or the spell's picture).
  const artY = top + h * 0.245;
  const artH = h * 0.34;
  fillRoundRect(ctx, x + 7, artY, w - 14, artH, 6, verticalGradient(ctx, artY, artY + artH, [[0, suit.color], [1, suit.dark]]));
  if (card.kind === 'spell') drawSpellIcon(ctx, card.spell, x + w / 2, artY + artH / 2, artH * 0.34, '#ffffff');
  else drawSuitIcon(ctx, card.suit, x + w / 2, artY + artH / 2, artH * 0.36, '#ffffff');
  // Rules text.
  const bodySize = Math.max(9, Math.round(h * 0.068));
  const lines = card.text ? wrapLines(ctx, card.text, `${bodySize}px 'Trebuchet MS', sans-serif`, w - 16) : [];
  lines.slice(0, 3).forEach((line, index) => {
    text(ctx, line, x + w / 2, top + h * 0.635 + index * (bodySize + 3), `${bodySize}px 'Trebuchet MS', sans-serif`, INK);
  });
  if (card.kind === 'creature') {
    // Attack and health gems.
    circle(ctx, x + 14, top + h - 14, 12, '#c2432a');
    text(ctx, String(card.attack), x + 14, top + h - 13, `700 14px 'Trebuchet MS', sans-serif`, '#ffffff');
    const hurt = card.health < card.maxHealth;
    circle(ctx, x + w - 14, top + h - 14, 12, hurt ? '#b03030' : '#2e7d46');
    text(ctx, String(card.health), x + w - 14, top + h - 13, `700 14px 'Trebuchet MS', sans-serif`, '#ffffff');
  } else {
    text(ctx, 'SPELL', x + w / 2, top + h - 13, `700 ${Math.round(h * 0.07)}px 'Trebuchet MS', sans-serif`, suit.dark);
  }
  if (options.dimmed) {
    ctx.globalAlpha = 0.45;
    fillRoundRect(ctx, x, top, w, h, 10, '#10131c');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// Layout: the rectangles main.js hit-tests are the ones drawn below.

export const HAND_W = 118;
export const HAND_H = 164;
export const FIELD_W = 106;
export const FIELD_H = 148;

export function handCardRect(index, count) {
  const step = count > 1 ? Math.min(126, (852 - HAND_W) / (count - 1)) : 0;
  const total = HAND_W + step * (count - 1);
  return { x: VIEW_W / 2 - total / 2 + step * index, y: 512, w: HAND_W, h: HAND_H };
}

export function fieldCardRect(side, index, count) {
  const step = count > 1 ? Math.min(120, (880 - FIELD_W) / (count - 1)) : 0;
  const total = FIELD_W + step * (count - 1);
  return { x: VIEW_W / 2 - total / 2 + step * index, y: side === 'ai' ? 106 : 300, w: FIELD_W, h: FIELD_H };
}

export function aiHandRect(index, count) {
  const step = count > 1 ? Math.min(36, 380 / (count - 1)) : 0;
  const total = 52 + step * (count - 1);
  return { x: VIEW_W / 2 - total / 2 + step * index, y: 12, w: 52, h: 72 };
}

export function heroBadgeRect(side) {
  return side === 'ai' ? { x: 30, y: 16, w: 190, h: 74 } : { x: 30, y: 452, w: 190, h: 74 };
}

export function endTurnRect() {
  return { x: 1082, y: 458, w: 168, h: 62 };
}

export function deckRect(side) {
  return side === 'ai' ? { x: 1176, y: 106, w: 56, h: 76 } : { x: 1176, y: 300, w: 56, h: 76 };
}

export function playButtonRect() {
  return { x: VIEW_W / 2 - 130, y: 470, w: 260, h: 68 };
}

export function playAgainRect() {
  return { x: VIEW_W / 2 - 120, y: 452, w: 240, h: 64 };
}

// ---------------------------------------------------------------------------
// The table and the screens.

function drawFelt(ctx) {
  ctx.fillStyle = verticalGradient(ctx, 0, VIEW_H, [[0, FELT_TOP], [1, FELT_BOTTOM]]);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A quiet diamond pattern across the felt.
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = GOLD_LIGHT;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      const cx = 40 + col * 80 + (row % 2 ? 40 : 0);
      const cy = 40 + row * 80;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9);
      ctx.lineTo(cx + 9, cy);
      ctx.lineTo(cx, cy + 9);
      ctx.lineTo(cx - 9, cy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  strokeRoundRect(ctx, 8, 8, VIEW_W - 16, VIEW_H - 16, 18, GOLD, 3);
}

function drawHero(ctx, side, state, view) {
  const rect = heroBadgeRect(side);
  const data = state.sides[side];
  const cx = rect.x + 40;
  const cy = rect.y + 37;
  circle(ctx, cx, cy, 33, side === 'ai' ? '#3a2340' : '#23403a');
  ctx.beginPath();
  ctx.arc(cx, cy, 33, 0, Math.PI * 2);
  ctx.strokeStyle = view.targeting && side !== state.active ? GOLD : GOLD_LIGHT;
  ctx.lineWidth = view.targeting && side !== state.active ? 4 : 2;
  ctx.stroke();
  if (side === 'ai') drawSuitIcon(ctx, 'gloom', cx, cy, 17, '#c9a6ff');
  else drawSuitIcon(ctx, 'ember', cx, cy, 17, GOLD_LIGHT);
  text(ctx, side === 'ai' ? 'THE WARDEN' : 'YOU', rect.x + 84, rect.y + 16, `700 15px 'Trebuchet MS', sans-serif`, '#ffffff', 'left');
  // Life pill.
  fillRoundRect(ctx, rect.x + 80, rect.y + 32, 86, 30, 15, verticalGradient(ctx, rect.y + 32, rect.y + 62, [[0, '#c9403a'], [1, '#8f1f1c']]));
  text(ctx, `♥ ${data.life}`, rect.x + 123, rect.y + 48, `700 17px 'Trebuchet MS', sans-serif`, '#ffffff');
  if (side === 'player') {
    // Energy gems under the badge.
    for (let gem = 0; gem < MAX_ENERGY; gem += 1) {
      const gx = rect.x + 12 + gem * 24;
      const gy = rect.y + 88;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 9);
      ctx.lineTo(gx + 8, gy);
      ctx.lineTo(gx, gy + 9);
      ctx.lineTo(gx - 8, gy);
      ctx.closePath();
      if (gem < data.energy) {
        ctx.fillStyle = '#57b6ff';
        ctx.fill();
      } else if (gem < data.maxEnergy) {
        ctx.fillStyle = '#274b5e';
        ctx.fill();
      } else {
        ctx.strokeStyle = '#274b5e';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    text(ctx, `${data.energy}/${data.maxEnergy} energy`, rect.x + 12, rect.y + 112, `600 13px 'Trebuchet MS', sans-serif`, '#bcd6de', 'left');
  }
}

function drawDeck(ctx, side, state) {
  const rect = deckRect(side);
  fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6, verticalGradient(ctx, rect.y, rect.y + rect.h, [[0, '#2c3e70'], [1, '#191f42']]));
  strokeRoundRect(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, 5, GOLD, 1.5);
  drawSuitIcon(ctx, 'gloom', rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, 13, GOLD);
  text(ctx, String(state.sides[side].deck.length), rect.x + rect.w / 2, rect.y + rect.h + 14, `700 14px 'Trebuchet MS', sans-serif`, '#bcd6de');
  text(ctx, 'deck', rect.x + rect.w / 2, rect.y + rect.h + 30, `11px 'Trebuchet MS', sans-serif`, '#7d99a3');
}

function drawField(ctx, side, state, view) {
  const field = state.sides[side].field;
  if (field.length === 0) {
    text(ctx, side === 'ai' ? 'The Warden has no creatures in play' : 'Your field is empty - play a creature from your hand',
      VIEW_W / 2, side === 'ai' ? 180 : 374, `15px 'Trebuchet MS', sans-serif`, 'rgba(220,235,240,0.4)');
    return;
  }
  field.forEach((creature, index) => {
    const rect = fieldCardRect(side, index, field.length);
    const offset = view.offsets?.get(creature.uid) ?? { x: 0, y: 0 };
    const isTarget = view.targeting && side !== state.active;
    drawCard(ctx, rect.x + offset.x, rect.y + offset.y, rect.w, rect.h, creature, {
      selected: view.selectedAttacker === creature.uid,
      dimmed: side === state.active && !creature.ready && !state.winner,
    });
    if (isTarget) strokeRoundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 12, 'rgba(217,164,65,0.65)', 2.5);
  });
}

function drawHand(ctx, state, view) {
  const hand = state.sides.player.hand;
  hand.forEach((card, index) => {
    const rect = handCardRect(index, hand.length);
    const playable = state.active === 'player' && !state.winner && card.cost <= state.sides.player.energy
      && (card.kind !== 'creature' || state.sides.player.field.length < 6);
    drawCard(ctx, rect.x, rect.y, rect.w, rect.h, card, {
      selected: view.selectedHand === index,
      hover: view.hover?.type === 'hand' && view.hover.index === index,
      dimmed: state.active === 'player' && !playable,
    });
  });
  // The Warden's hand, face down.
  const aiHand = state.sides.ai.hand;
  aiHand.forEach((card, index) => {
    const rect = aiHandRect(index, aiHand.length);
    drawCard(ctx, rect.x, rect.y, rect.w, rect.h, card, { faceDown: true });
  });
}

function drawEndTurn(ctx, state, view) {
  const rect = endTurnRect();
  const mine = state.active === 'player' && !state.winner;
  fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12,
    mine ? verticalGradient(ctx, rect.y, rect.y + rect.h, [[0, '#e8b34b'], [1, '#b97f1e']]) : '#33424c');
  if (mine) strokeRoundRect(ctx, rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4, 14, GOLD_LIGHT, 2);
  text(ctx, mine ? 'END TURN' : "WARDEN'S TURN", rect.x + rect.w / 2, rect.y + rect.h / 2,
    `700 19px 'Trebuchet MS', sans-serif`, mine ? '#2a1c05' : '#9fb6bf');
}

function drawLog(ctx, state, view) {
  const line = view.banner ?? state.log[state.log.length - 1] ?? '';
  if (line) text(ctx, line, VIEW_W / 2, 282, `600 16px 'Trebuchet MS', sans-serif`, GOLD_LIGHT);
  text(ctx, `Round ${state.round}`, 1210, 282, `600 13px 'Trebuchet MS', sans-serif`, '#7d99a3');
  if (view.hint) text(ctx, view.hint, VIEW_W / 2, 700, `13px 'Trebuchet MS', sans-serif`, '#8fb0ba');
}

function drawFloaters(ctx, view) {
  for (const floater of view.floaters ?? []) {
    ctx.globalAlpha = Math.max(0, 1 - floater.t / 1.1);
    text(ctx, floater.value, floater.x, floater.y - floater.t * 34, `700 22px 'Trebuchet MS', sans-serif`, floater.color);
  }
  ctx.globalAlpha = 1;
}

/** Paint the whole table for a game in progress (or just ended). */
export function drawTable(ctx, state, view) {
  drawFelt(ctx);
  drawHero(ctx, 'ai', state, view);
  drawHero(ctx, 'player', state, view);
  drawDeck(ctx, 'ai', state);
  drawDeck(ctx, 'player', state);
  drawField(ctx, 'ai', state, view);
  drawField(ctx, 'player', state, view);
  drawHand(ctx, state, view);
  drawEndTurn(ctx, state, view);
  drawLog(ctx, state, view);
  drawFloaters(ctx, view);
}

function drawTitle(ctx, view) {
  drawFelt(ctx);
  drawSuitIcon(ctx, 'ember', VIEW_W / 2 - 336, 148, 32, '#e2543e');
  drawSuitIcon(ctx, 'gloom', VIEW_W / 2 + 336, 148, 32, '#8a5fc0');
  text(ctx, 'EMBERFALL', VIEW_W / 2, 140, `700 78px 'Trebuchet MS', sans-serif`, GOLD_LIGHT);
  text(ctx, 'D U E L', VIEW_W / 2, 200, `700 30px 'Trebuchet MS', sans-serif`, '#ffffff');
  text(ctx, 'A card duel against the Warden. Twenty life each, one table, no mercy.',
    VIEW_W / 2, 244, `17px 'Trebuchet MS', sans-serif`, '#cfe2e8');
  // Two showcase cards from the pool.
  drawCard(ctx, 84, 318, 150, 210, CARD_BY_ID.get('forge-golem'), {});
  drawCard(ctx, 1046, 318, 150, 210, CARD_BY_ID.get('pyre-drake'), {});
  const how = [
    'Each turn: draw a card, gain a crystal, play creatures and spells.',
    'Creatures attack next turn - unless they have Rush.',
    'Guards must be attacked first. Click a card to play it.',
    'Click your creature, then its target, to attack. First to 0 life loses.',
  ];
  how.forEach((line, index) => {
    text(ctx, line, VIEW_W / 2, 330 + index * 34, `16px 'Trebuchet MS', sans-serif`, '#bcd6de');
  });
  const rect = playButtonRect();
  const pulse = view.pulse ? 3 : 0;
  fillRoundRect(ctx, rect.x - pulse, rect.y - pulse, rect.w + pulse * 2, rect.h + pulse * 2, 14,
    verticalGradient(ctx, rect.y, rect.y + rect.h, [[0, '#e8b34b'], [1, '#b97f1e']]));
  text(ctx, 'CLICK TO PLAY', rect.x + rect.w / 2, rect.y + rect.h / 2, `700 26px 'Trebuchet MS', sans-serif`, '#2a1c05');
  text(ctx, 'Four suits - Ember, Tide, Grove, Gloom - told apart by colour and shape.',
    VIEW_W / 2, 592, `14px 'Trebuchet MS', sans-serif`, '#8fb0ba');
  text(ctx, 'A complete game in your browser: no downloads, no network, just the duel.',
    VIEW_W / 2, 622, `14px 'Trebuchet MS', sans-serif`, '#8fb0ba');
}

function drawEndScreen(ctx, state, view, won) {
  drawTable(ctx, state, { ...view, floaters: [] });
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#05090c';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.globalAlpha = 1;
  fillRoundRect(ctx, VIEW_W / 2 - 300, 168, 600, 384, 20, verticalGradient(ctx, 168, 552, [[0, '#173f3c'], [1, '#0a2329']]));
  strokeRoundRect(ctx, VIEW_W / 2 - 300, 168, 600, 384, 20, GOLD, 3);
  if (won) drawSuitIcon(ctx, 'ember', VIEW_W / 2, 238, 30, GOLD);
  else drawSuitIcon(ctx, 'gloom', VIEW_W / 2, 238, 30, '#8a5fc0');
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', VIEW_W / 2, 316, `700 58px 'Trebuchet MS', sans-serif`, won ? GOLD_LIGHT : '#c9a6ff');
  text(ctx, won ? 'The Warden falls. The table is yours.' : 'The Warden keeps the table this time.',
    VIEW_W / 2, 362, `17px 'Trebuchet MS', sans-serif`, '#cfe2e8');
  text(ctx, `Rounds: ${state.round}      Your life: ${Math.max(0, state.sides.player.life)}      Warden's life: ${Math.max(0, state.sides.ai.life)}`,
    VIEW_W / 2, 402, `600 16px 'Trebuchet MS', sans-serif`, '#bcd6de');
  const rect = playAgainRect();
  fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12, verticalGradient(ctx, rect.y, rect.y + rect.h, [[0, '#e8b34b'], [1, '#b97f1e']]));
  text(ctx, 'PLAY AGAIN', rect.x + rect.w / 2, rect.y + rect.h / 2, `700 22px 'Trebuchet MS', sans-serif`, '#2a1c05');
}

/** Paint whatever screen the view names: title, table, victory or defeat. */
export function drawGame(ctx, state, view) {
  if (view.screen === 'title') {
    drawTitle(ctx, view);
    return;
  }
  if (view.screen === 'win') {
    drawEndScreen(ctx, state, view, true);
    return;
  }
  if (view.screen === 'loss') {
    drawEndScreen(ctx, state, view, false);
    return;
  }
  drawTable(ctx, state, view);
}
