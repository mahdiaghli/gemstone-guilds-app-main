const GEM_TYPES = ["diamond", "sapphire", "emerald", "ruby", "onyx"];

function getPlayerBonuses(player) {
  const b = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
  for (const card of player.cards || []) {
    if (card?.gemBonus && b[card.gemBonus] !== undefined) b[card.gemBonus]++;
  }
  return b;
}

function getPlayerScore(player) {
  let score = 0;
  for (const card of player.cards || []) score += card.points || 0;
  for (const noble of player.nobles || []) score += noble.points || 0;
  return score;
}

function checkNobles(state) {
  const players = (state.players || []).map((p) => ({ ...p, nobles: [...(p.nobles || [])] }));
  const index = state.currentPlayerIndex || 0;
  const player = players[index];
  if (!player) return state;
  const bonuses = getPlayerBonuses(player);
  const nobles = [...(state.nobles || [])];

  for (let i = 0; i < nobles.length; i++) {
    const noble = nobles[i];
    let ok = true;
    for (const gem of GEM_TYPES) {
      if ((noble.requirements?.[gem] || 0) > bonuses[gem]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      player.nobles.push(noble);
      nobles.splice(i, 1);
      break;
    }
  }

  players[index] = player;
  return { ...state, players, nobles };
}

export function advanceSplendorTurn(state, targetScore = 15) {
  if (!state || !Array.isArray(state.players) || state.players.length === 0) {
    return state;
  }

  let next = checkNobles(state);
  const score = getPlayerScore(next.players[next.currentPlayerIndex || 0]);

  if (score >= targetScore && !next.isLastRound) {
    next = {
      ...next,
      isLastRound: true,
      lastRoundTriggerIndex: next.currentPlayerIndex,
    };
  }

  const playerCount = next.players.length;
  const upcoming = ((next.currentPlayerIndex || 0) + 1) % playerCount;

  if (
    next.isLastRound &&
    next.lastRoundTriggerIndex !== null &&
    next.lastRoundTriggerIndex !== undefined &&
    upcoming === next.lastRoundTriggerIndex
  ) {
    let maxScore = -1;
    let winnerId = next.players[0]?.id ?? 0;
    for (const player of next.players) {
      const playerScore = getPlayerScore(player);
      const winner = next.players.find((entry) => entry.id === winnerId) || next.players[0];
      if (
        playerScore > maxScore ||
        (playerScore === maxScore && (player.cards?.length || 0) < (winner?.cards?.length || 0))
      ) {
        maxScore = playerScore;
        winnerId = player.id;
      }
    }
    return {
      ...next,
      gameOver: true,
      winner: winnerId,
      currentPlayerIndex: upcoming,
    };
  }

  return { ...next, currentPlayerIndex: upcoming };
}

export function timeoutDeadMansDraw(state) {
  if (!state || typeof state !== "object") return state;
  const playerCount = Array.isArray(state.players) ? Math.max(1, state.players.length) : 1;
  return {
    ...state,
    pendingEffect: null,
    treasureArea: [],
    forcedRevealRemaining: 0,
    currentPlayerIndex: ((state.currentPlayerIndex || 0) + 1) % playerCount,
    lastAction: "Turn timed out.",
  };
}
