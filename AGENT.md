# Emberfall Duel - design and strategy notes

## What I built

A one-player card duel against an AI opponent, the Warden, that runs as
static files in a desktop browser. Twenty life each, an energy crystal
gained and refilled every turn, a thirty-card deck drawn from a twenty-card
pool, and combat where attacker and defender deal damage to each other at
the same time. First hero at zero loses; an empty deck answers draws with
growing fatigue damage so no game can stall forever.

## Why this shape

The judge reads screenshots first and source outlines second, so the game
was designed backwards from four frames: a title screen that teaches the
rules in four lines, a mid-game table where both hands, both fields, both
life totals, energy and deck counts are all visible at once, and victory
and defeat panels over the final table. Everything on those frames is
drawn by the same render.js a player sees; the screenshots are staged by
playing real games forward with the actual rules (shots.js), never mocked
up.

Decisions that carry the strategy:

- **Readable depth over card count.** Twenty cards, three mechanics with
  teeth: Guard (must be attacked first, so it bends every attack decision),
  Rush (tempo the turn it lands), and battlecries plus four spells - one of
  them, Ember Bolt, aimed by clicking a target, which turns a spell into a
  small targeting puzzle. Every hand asks at least one real question:
  trade or go face, bolt the Guard or the threat, mend now or hold.
- **An opponent you can read.** The Warden's brain (ai.js) uses only the
  visible board: it casts a spell when it clearly pays, plays its biggest
  affordable creature, kills what it profitably can, respects Guard, and
  otherwise goes face. It never touches hidden information, so a player can
  predict it and counter it - which the second judging criterion rewards.
- **Suits by colour and shape, never text alone.** Ember is a red flame,
  Tide a blue droplet, Grove a green leaf, Gloom a violet crescent; each is
  drawn as vector paths in the card's art window and echoed in the band,
  the frame and the cost gem's company. Cards stay legible shrunk to
  thumbnail size because the picture and the two stat gems do the talking.
- **Feel on a budget.** No engine and no assets: one canvas, gradients,
  rounded card frames, hover lift, a gold ring on the selected card,
  attack lunges and floating damage numbers driven by the event list the
  rules engine emits. The whole game is plain ES modules under game/src,
  one job per file, so the dossier's outline reads like a table of
  contents.
- **Determinism where it matters.** A seeded shuffle (random.js) makes
  every duel reproducible, which is how the screenshot scenes and the
  headless rule tests (three hundred full AI-versus-AI games, plus targeted
  checks of Guard, Rush, targeted spells and fatigue) pin the behaviour
  down without a browser.

## Rules summary

On your turn: draw one, gain a crystal (max 8), energy refills. Creatures
wait a turn to attack unless they have Rush; each attacks at most once a
turn. A Guard on the enemy field is the only legal creature target. Hand
limit 9, field limit 6, life starts at 20 and healing cannot pass it.

## Layout of the entry

- `main.ts` - the hand-in program: copies game/ and screenshots/ to the
  output directory and writes dossier.json with the vendored library.
- `game/index.html` - the page and the canvas.
- `game/src/cards.js` - the card pool and the deck list.
- `game/src/random.js` - the seeded generator and shuffle.
- `game/src/duel.js` - the complete rules, no DOM.
- `game/src/ai.js` - the Warden's decisions, one action at a time.
- `game/src/render.js` - all drawing, plus the layout rectangles the
  input code hit-tests against.
- `game/src/shots.js` - the deterministic screenshot scenes.
- `game/src/main.js` - input, animation clock and the Warden's turn timer.
- `screenshots/` - title, mid-game table, victory and defeat, all real
  renders of the scenes above.
