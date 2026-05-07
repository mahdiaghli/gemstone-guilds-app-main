import { normalizeTurnTimeSeconds } from "./server-utils.js";

const DISCONNECT_GRACE_MS = 30000;

export function getOrCreateRoom(rooms, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      gameState: null,
      gameId: null,
      status: "waiting",
      maxPlayers: 4,
      createdAt: Date.now(),
      turn: {
        timer: null,
        endsAt: null,
        currentIndex: 0,
        durationMs: 45000,
        missedByIndex: new Map(),
        playersInGame: [],
      },
      rematch: null,
      disconnectTimers: new Map(),
    });
  }
  return rooms.get(roomId);
}

export function clearDisconnectTimer(room, playerId) {
  const existing = room?.disconnectTimers?.get(playerId);
  if (existing) {
    clearTimeout(existing);
    room.disconnectTimers.delete(playerId);
  }
}

export function buildPlayerIndexMap(room) {
  const map = {};
  if (!room?.turn?.playersInGame?.length) return map;
  room.turn.playersInGame.forEach((player, idx) => {
    if (player?.socketId) {
      map[player.socketId] = idx;
    }
  });
  return map;
}

export function resetMissedCounts(room) {
  if (!room?.turn) return;
  room.turn.missedByIndex = new Map();
}

export function removePlayerFromGame(rooms, roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room || !room.gameState || !room.turn?.playersInGame?.length) return null;

  const playersInGame = [...room.turn.playersInGame];
  const removedPlayerMeta = playersInGame[playerIndex];

  if (removedPlayerMeta?.id) {
    room.players.delete(removedPlayerMeta.id);
  }

  const removedPlayerState = room.gameState.players[playerIndex];
  const remainingPlayers = room.gameState.players
    .filter((_, idx) => idx !== playerIndex)
    .map((p, idx) => ({ ...p, id: idx }));

  const newTokenPool = { ...room.gameState.tokenPool };
  if (removedPlayerState?.tokens) {
    for (const key of Object.keys(newTokenPool)) {
      newTokenPool[key] += removedPlayerState.tokens[key] || 0;
    }
  }

  room.turn.playersInGame = playersInGame.filter((_, idx) => idx !== playerIndex);
  resetMissedCounts(room);

  const currentPlayerIndex = room.gameState.currentPlayerIndex || 0;
  const nextCurrentPlayerIndex =
    currentPlayerIndex > playerIndex
      ? currentPlayerIndex - 1
      : currentPlayerIndex === playerIndex
        ? Math.min(playerIndex, Math.max(remainingPlayers.length - 1, 0))
        : currentPlayerIndex;

  room.gameState = {
    ...room.gameState,
    players: remainingPlayers,
    tokenPool: newTokenPool,
    currentPlayerIndex: nextCurrentPlayerIndex,
  };

  const remainingCount = room.gameState.players.length;
  if (remainingCount <= 1) {
    room.gameState = {
      ...room.gameState,
      gameOver: true,
      winner: 0,
    };
    room.status = "finished";
    clearTurnTimer(room);
  } else {
    room.status = "playing";
  }

  return {
    removedPlayerMeta,
    gameState: room.gameState,
    playerIndexMap: buildPlayerIndexMap(room),
    roomStatus: room.status,
  };
}

export function removeDeadMansDrawPlayerFromGame(rooms, roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room || !room.gameState || !room.turn?.playersInGame?.length) return null;

  const playersInGame = [...room.turn.playersInGame];
  const removedPlayerMeta = playersInGame[playerIndex];
  if (removedPlayerMeta?.id) {
    room.players.delete(removedPlayerMeta.id);
  }

  const remainingPlayers = room.gameState.players
    .filter((_, idx) => idx !== playerIndex)
    .map((player, idx) => ({ ...player, id: idx }));

  const currentPlayerIndex = room.gameState.currentPlayerIndex || 0;
  const ringSelectionIndex = room.gameState.ringSelectionIndex;
  const targetSelection = room.gameState.powerTargetSelection;

  room.turn.playersInGame = playersInGame.filter((_, idx) => idx !== playerIndex);
  resetMissedCounts(room);

  const nextCurrentPlayerIndex =
    currentPlayerIndex > playerIndex
      ? currentPlayerIndex - 1
      : currentPlayerIndex === playerIndex
        ? Math.min(playerIndex, Math.max(remainingPlayers.length - 1, 0))
        : currentPlayerIndex;

  room.gameState = {
    ...room.gameState,
    players: remainingPlayers,
    currentPlayerIndex: nextCurrentPlayerIndex,
    pendingEffect:
      room.gameState.pendingEffect?.kind === "pistol" || room.gameState.pendingEffect?.kind === "dagger"
        ? {
            ...room.gameState.pendingEffect,
            options: room.gameState.pendingEffect.options
              .filter((option) => option.playerIndex !== playerIndex)
              .map((option) => ({
                ...option,
                playerIndex: option.playerIndex > playerIndex ? option.playerIndex - 1 : option.playerIndex,
              })),
          }
        : room.gameState.pendingEffect,
    ringSelectionIndex:
      ringSelectionIndex === null
        ? null
        : ringSelectionIndex > playerIndex
          ? ringSelectionIndex - 1
          : ringSelectionIndex === playerIndex
            ? null
            : ringSelectionIndex,
    powerTargetSelection:
      targetSelection && targetSelection.playerIndex === playerIndex
        ? null
        : targetSelection
          ? {
              ...targetSelection,
              playerIndex:
                targetSelection.playerIndex > playerIndex
                  ? targetSelection.playerIndex - 1
                  : targetSelection.playerIndex,
              options: targetSelection.options
                .filter((idx) => idx !== playerIndex)
                .map((idx) => (idx > playerIndex ? idx - 1 : idx)),
            }
          : null,
    winnerIndices: room.gameState.winnerIndices
      .filter((idx) => idx !== playerIndex)
      .map((idx) => (idx > playerIndex ? idx - 1 : idx)),
  };

  const remainingCount = room.gameState.players.length;
  if (remainingCount <= 1) {
    room.gameState = {
      ...room.gameState,
      gameOver: true,
      winnerIndices: remainingCount === 1 ? [0] : [],
    };
    room.status = "finished";
    clearTurnTimer(room);
  } else {
    room.status = "playing";
  }

  return {
    removedPlayerMeta,
    gameState: room.gameState,
    playerIndexMap: buildPlayerIndexMap(room),
    roomStatus: room.status,
  };
}

export function clearTurnTimer(room) {
  if (room?.turn?.timer) {
    clearTimeout(room.turn.timer);
    room.turn.timer = null;
  }
  if (room?.turn) {
    room.turn.endsAt = null;
  }
}

export function startTurnTimer(rooms, roomId, io) {
  const room = rooms.get(roomId);
  if (!room || room.status !== "playing" || !room.gameState) return;

  clearTurnTimer(room);
  const durationMs = normalizeTurnTimeSeconds(Math.round((room.turn?.durationMs || 45000) / 1000)) * 1000;
  room.turn.durationMs = durationMs;

  room.turn.currentIndex = room.gameState.currentPlayerIndex || 0;
  room.turn.endsAt = Date.now() + durationMs;
  io.to(roomId).emit("turn-timer-updated", {
    endsAt: room.turn.endsAt,
    currentPlayerIndex: room.turn.currentIndex,
  });

  room.turn.timer = setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r || r.status !== "playing" || !r.gameState) return;

    const idx = r.gameState.currentPlayerIndex || 0;
    console.log(`⏱️  [TURN] Timeout in room ${roomId} | playerIndex=${idx}`);

    if (r.gameId !== "dead-mans-draw") {
      normalizeTimedOutPlayer(r);
      r.gameState = finishSplendorTurn(r.gameState);
    } else {
      r.gameState = finishDeadMansDrawTurn(r.gameState);
    }

    io.to(roomId).emit("game-state-updated", r.gameState);
    startTurnTimer(rooms, roomId, io);
  }, durationMs);
}

function normalizeTimedOutPlayer(room) {
  if (!room?.gameState) return;
  const playerIndex = room.gameState.currentPlayerIndex || 0;
  const player = room.gameState.players?.[playerIndex];
  if (!player?.tokens) return;

  const tokenOrder = ["diamond", "sapphire", "emerald", "ruby", "onyx", "gold"];
  const totalTokens = () =>
    tokenOrder.reduce((sum, token) => sum + (player.tokens[token] || 0), 0);

  while (totalTokens() > 10) {
    const tokenToReturn = tokenOrder
      .filter((token) => (player.tokens[token] || 0) > 0)
      .sort((a, b) => {
        if (a === "gold" && b !== "gold") return 1;
        if (b === "gold" && a !== "gold") return -1;
        return (player.tokens[b] || 0) - (player.tokens[a] || 0);
      })[0];

    if (!tokenToReturn) break;
    player.tokens[tokenToReturn] -= 1;
    room.gameState.tokenPool[tokenToReturn] += 1;
  }
}

function getSplendorPlayerScore(player) {
  const cardPoints = (player?.cards || []).reduce((sum, card) => sum + (card?.points || 0), 0);
  const noblePoints = (player?.nobles || []).reduce((sum, noble) => sum + (noble?.points || 0), 0);
  return cardPoints + noblePoints;
}

function finishSplendorTurn(state) {
  if (!state) return state;
  const nextState = {
    ...state,
    players: [...state.players],
  };

  const currentIndex = nextState.currentPlayerIndex || 0;
  const currentScore = getSplendorPlayerScore(nextState.players[currentIndex]);
  if (currentScore >= 15 && !nextState.isLastRound) {
    nextState.isLastRound = true;
    nextState.lastRoundTriggerIndex = currentIndex;
  }

  const nextIndex = (currentIndex + 1) % nextState.players.length;
  nextState.currentPlayerIndex = nextIndex;

  if (
    nextState.isLastRound &&
    nextState.lastRoundTriggerIndex !== null &&
    nextIndex === nextState.lastRoundTriggerIndex
  ) {
    let winner = 0;
    let bestScore = -1;
    nextState.players.forEach((player, index) => {
      const score = getSplendorPlayerScore(player);
      const currentWinnerCards = nextState.players[winner]?.cards?.length ?? Number.MAX_SAFE_INTEGER;
      const playerCards = player?.cards?.length ?? Number.MAX_SAFE_INTEGER;
      if (score > bestScore || (score === bestScore && playerCards < currentWinnerCards)) {
        bestScore = score;
        winner = index;
      }
    });
    nextState.gameOver = true;
    nextState.winner = winner;
  }

  return nextState;
}

function finishDeadMansDrawTurn(state) {
  if (!state) return state;
  const nextState = { ...state };
  const nextIndex = (nextState.currentPlayerIndex + 1) % nextState.players.length;
  nextState.currentPlayerIndex = nextIndex;
  return nextState;
}
