// Seeded randomness for Emberfall Duel.
//
// One small linear-congruential generator drives the deck shuffle and every
// coin the game flips, so a duel with a known seed always plays out the same
// way. That is what lets the screenshot scenes and the headless simulations
// reproduce a game exactly, and it keeps a rematch honest: a new seed is a
// genuinely new shuffle.

/** Create a generator whose next() returns floats in [0, 1). */
export function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return {
    next() {
      // Numerical Recipes constants; the multiply stays exact in a double
      // because state is kept to 32 bits with Math.imul.
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    },
    /** Integer in [0, bound). */
    int(bound) {
      return Math.floor(this.next() * bound);
    },
  };
}

/** Fisher-Yates shuffle in place, driven by the given generator. */
export function shuffle(rng, list) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = rng.int(index + 1);
    const held = list[index];
    list[index] = list[swap];
    list[swap] = held;
  }
  return list;
}
