import {
  removePlayerFromGame,
  removeDeadMansDrawPlayerFromGame,
  clearDisconnectTimer,
  startTurnTimer,
  buildPlayerIndexMap,
} from "./server-rooms.js";

const DISCONNECT_GRACE_MS = 30000;

export function getRoomPlayersArray(rooms, roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players.values()).map((player) => ({
    id: player.id,
    name: player.name,
    connected: player.connected,
  }));
}

export function handlePlayerDeparture(rooms, io, roomId, playerId, socketId = null, forceRemove = false) {
  const room = rooms.get(roomId);
  if (!room) return;

  const waitingPlayer = room.players.get(playerId)
    || Array.from(room.players.values()).find((player) => player.socketId === socketId);
  const resolvedPlayerId = waitingPlayer?.id || playerId;

  if (room.status === "playing" && room.gameState && !forceRemove) {
    const reconnectingPlayer = waitingPlayer
      || Array.from(room.players.values()).find((player) => player.socketId === socketId);
    if (reconnectingPlayer) {
      reconnectingPlayer.connected = false;
      io.to(roomId).emit("players-updated", {
        players: getRoomPlayersArray(rooms, roomId),
        roomStatus: room.status,
      });
      clearDisconnectTimer(room, reconnectingPlayer.id);
      room.disconnectTimers.set(
        reconnectingPlayer.id,
        setTimeout(() => {
          const latestRoom = rooms.get(roomId);
          if (!latestRoom) return;
          latestRoom.disconnectTimers.delete(reconnectingPlayer.id);
          handlePlayerDeparture(rooms, io, roomId, reconnectingPlayer.id, socketId, true);
        }, DISCONNECT_GRACE_MS),
      );
      return;
    }

    const playerIndex = room.turn.playersInGame.findIndex(
      (player) => player.id === resolvedPlayerId || player.socketId === socketId,
    );

    if (playerIndex !== -1) {
      const removalResult = room.gameId === "dead-mans-draw"
        ? removeDeadMansDrawPlayerFromGame(rooms, roomId, playerIndex)
        : removePlayerFromGame(rooms, roomId, playerIndex);

      if (removalResult) {
        io.to(roomId).emit("players-updated", {
          players: getRoomPlayersArray(rooms, roomId),
          roomStatus: room.status,
        });
        io.to(roomId).emit("player-removed", removalResult);
        io.to(roomId).emit("game-state-updated", removalResult.gameState);
        if (room.status === "playing") {
          startTurnTimer(rooms, roomId, io);
        }
        return;
      }
    }
  }

  if (resolvedPlayerId) {
    room.players.delete(resolvedPlayerId);
    io.to(roomId).emit("players-updated", {
      players: getRoomPlayersArray(rooms, roomId),
      roomStatus: room.status,
    });

    if (room.players.size === 0) {
      rooms.delete(roomId);
    }
  }
}

export function handleGameStart(rooms, io, roomId, gameState, turnTime) {
  const room = rooms.get(roomId);
  if (!room || room.players.size < 2) return;

  room.status = "playing";
  room.gameState = gameState;
  room.postGame = null;

  // Get players in a consistent order (sorted by socket ID to ensure consistency)
  const playersArray = Array.from(room.players.values()).sort((a, b) =>
    a.socketId.localeCompare(b.socketId),
  );
  room.turn.playersInGame = playersArray;
  room.turn.missedByIndex = new Map();
  room.turn.durationMs = turnTime * 1000;
  room.rematch = null;

  // Create mapping of socket ID to player index in game
  const playerIndexMap = {};
  playersArray.forEach((player, idx) => {
    playerIndexMap[player.socketId] = idx;
  });

  // Notify all players in room that game started
  io.to(roomId).emit("game-started", {
    playerIndexMap,
    gameState: room.gameState,
  });

  // Start turn timer
  startTurnTimer(rooms, roomId, io);
}

export function handleGameStateUpdate(rooms, io, roomId, gameState) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.gameState = gameState;

  // Broadcast updated state to all players in room
  io.to(roomId).emit("game-state-updated", gameState);

  // Start turn timer if game is still playing
  if (room.status === "playing" && !gameState.gameOver) {
    startTurnTimer(rooms, roomId, io);
  }
}

export function handleRematchRequest(rooms, io, roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== "finished") return;

  if (!room.rematch) {
    room.rematch = {
      requestedBy: playerId,
      acceptedBy: new Set([playerId]),
    };
  } else {
    room.rematch.acceptedBy.add(playerId);
  }

  const playerCount = room.turn.playersInGame.length;
  const allAccepted = room.rematch.acceptedBy.size === playerCount;

  io.to(roomId).emit("rematch-status", {
    requestedBy: room.rematch.requestedBy,
    acceptedBy: Array.from(room.rematch.acceptedBy),
    playerCount,
  });

  if (allAccepted) {
    // Reset game state for rematch
    room.status = "waiting";
    room.gameState = null;
    room.turn.missedByIndex = new Map();
    room.rematch = null;

    io.to(roomId).emit("rematch-accepted");
  }
}

export function handleJoinRoom(rooms, io, socket, data) {
  const { roomId, playerId, playerName, playerCount, isHost, turnTime, gameId } = data;
  console.log(
    `👤 [JOIN-ROOM] ${playerName} (Tab-ID: ${playerId}) joining room ${roomId}`,
  );
  console.log(`   Socket ID: ${socket.id} | نام: ${playerName}`);

  const existingRoom = rooms.get(roomId);
  const room = isHost ? rooms.get(roomId) || (() => {
    const newRoom = {
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
    };
    rooms.set(roomId, newRoom);
    return newRoom;
  })() : existingRoom;

  if (!room) return;

  if (!isHost && room.status !== "waiting") {
    socket.emit("join-room-error", {
      message: "Game already started in this room.",
    });
    return;
  }

  if (isHost) {
    room.maxPlayers = playerCount;
    room.gameId = gameId;
    room.turn.durationMs = turnTime * 1000;
  }

  if (room.players.has(playerId)) {
    // Reconnecting player
    const existingPlayer = room.players.get(playerId);
    existingPlayer.socketId = socket.id;
    existingPlayer.connected = true;
    existingPlayer.name = playerName;
    clearDisconnectTimer(room, playerId);
  } else {
    // New player
    room.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      connected: true,
      joinedAt: Date.now(),
    });
  }

  socket.join(roomId);

  io.to(roomId).emit("players-updated", {
    players: getRoomPlayersArray(rooms, roomId),
    roomStatus: room.status,
  });

  if (room.status === "playing" && room.gameState) {
    socket.emit("game-state-updated", room.gameState);
    socket.emit("player-index-map", buildPlayerIndexMap(room));
  }
}
