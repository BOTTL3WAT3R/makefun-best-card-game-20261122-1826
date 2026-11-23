# makefun-best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/BOTTL3WAT3R/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/BOTTL3WAT3R/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Emberfall Duel** is a complete single-player card duel against an AI opponent, the Warden, played in a desktop browser from static files - no build step, no network, no library. Both heroes start at 20 life. Each turn you draw a card, gain an energy crystal (up to 8) and refill your energy, then play creatures and spells from your hand. The pool holds twenty cards in four suits - Ember, Tide, Grove and Gloom, each told apart by its own colour and its own drawn picture (a flame, a droplet, a leaf, a crescent moon) - with Guard creatures that must be attacked first, Rush creatures that strike the turn they land, battlecries, and four spells including a targeted Ember Bolt you aim with the mouse. Creatures trade blows both ways when they fight; the Warden plays its own hand with readable, board-only logic you can plan around. First hero to 0 life loses, and running out of deck costs growing fatigue damage. Title screen, a full table with both hands and both life totals, attack lunges and floating damage numbers, and separate victory and defeat screens with a play-again button are all in the game, which is split into small files with one job each: the card pool, the seeded shuffle, the rules, the Warden's brain, the drawing, the screenshot scenes and the input wiring.

## Run it

Hand the entry in (copies `game/` and `screenshots/` and writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Play the game by serving the folder and opening it in a desktop browser - any static file server works, for example:

```sh
npx serve game
# or: python3 -m http.server --directory game
```

Then open the address it prints and click **CLICK TO PLAY**. Click a card in your hand to play it; click one of your ready creatures and then its target to attack; press **END TURN** when you are done. Opening `game/index.html` with `?shot=title`, `?shot=play`, `?shot=win` or `?shot=loss` in the address holds one of the screenshot scenes still.

---

<sub>Entered on [make.fun](https://make.fun/?ref=beyt0vmy&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
