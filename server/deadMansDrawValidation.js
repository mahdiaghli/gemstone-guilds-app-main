const suits = ["astrolabe", "pistol", "dagger", "carpet", "snake", "coin", "horseshoe", "map", "chest", "key"];
const rings = new Set(["le-corsaire", "madam-margot", "ghallegar", "scurvy-pete", "zahara", "gunnie", "black-bonnie", "sir-lovesword", "seamus-quinn"]);
const cards = new Map();
for (const suit of suits) {
  for (let offset = 0; offset < 6; offset++) {
    const value = (suit === "coin" ? 4 : 2) + offset;
    const card = { id: `${suit}-${value}-${offset}`, suit, value };
    cards.set(card.id, card);
  }
}

function score(player) {
  return suits.reduce((total, suit) => total + (player.collected[suit].at(-1)?.value || 0), 0);
}

export function isValidDeadMansDrawState(state, playerCount) {
  try {
    if (!state || !Array.isArray(state.players) || state.players.length !== playerCount ||
      !Number.isInteger(state.currentPlayerIndex) || state.currentPlayerIndex < 0 ||
      state.currentPlayerIndex >= playerCount || !Array.isArray(state.drawPile) ||
      !Array.isArray(state.discardPile) || !Array.isArray(state.treasureArea) ||
      !Array.isArray(state.winnerIndices)) return false;
    const seen = new Set();
    const zones = [state.drawPile, state.discardPile, state.treasureArea];
    for (let index = 0; index < playerCount; index++) {
      const player = state.players[index];
      if (!player || player.id !== index || !player.collected || !Array.isArray(player.ringOptions) ||
        !player.ringOptions.every((ring) => rings.has(ring)) ||
        (player.ring !== null && !player.ringOptions.includes(player.ring))) return false;
      for (const suit of suits) {
        const stack = player.collected[suit];
        if (!Array.isArray(stack) || stack.some((card) => card.suit !== suit) ||
          stack.some((card, cardIndex) => cardIndex > 0 && stack[cardIndex - 1].value > card.value)) return false;
        zones.push(stack);
      }
    }
    for (const zone of zones) {
      for (const card of zone) {
        const canonical = cards.get(card?.id);
        if (!canonical || canonical.suit !== card.suit || canonical.value !== card.value || seen.has(card.id)) return false;
        seen.add(card.id);
      }
    }
    if (seen.size !== cards.size) return false;
    if (state.gameOver) {
      if (state.drawPile.length || !state.winnerIndices.length) return false;
      const highest = Math.max(...state.players.map(score));
      const tied = state.players.map((player, index) => ({ index, points: score(player), count: suits.reduce((sum, suit) => sum + player.collected[suit].length, 0) }))
        .filter((player) => player.points === highest);
      const largestCount = Math.max(...tied.map((player) => player.count));
      const winners = tied.filter((player) => player.count === largestCount).map((player) => player.index);
      if (JSON.stringify(state.winnerIndices) !== JSON.stringify(winners)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isValidInitialDeadMansDrawState(state, playerCount) {
  if (!isValidDeadMansDrawState(state, playerCount) || state.currentPlayerIndex !== 0 ||
    state.gameOver || state.treasureArea.length || state.winnerIndices.length ||
    state.drawPile.length !== 50 || state.discardPile.length !== 10) return false;
  const starters = new Set(suits.map((suit) => `${suit}-${suit === "coin" ? 4 : 2}-0`));
  return state.discardPile.every((card) => starters.has(card.id)) &&
    state.players.every((player) => suits.every((suit) => player.collected[suit].length === 0) && player.ring === null);
}
