import { getOrCreateRoom, buildPlayerIndexMap } from "./server-rooms.js";
import { normalizeTurnTimeSeconds } from "./server-utils.js";

const matchmakingQueue = {
  2: [],
  3: [],
  4: [],
};

export function getMatchmakingQueue() {
  return matchmakingQueue;
}

export function broadcastQueueStatus(io, playerCount) {
  const queue = matchmakingQueue[playerCount] || [];
  queue.forEach((player) => {
    const sameGameCount = queue.filter((entry) => entry.gameId === player.gameId).length;
    io.to(player.socketId).emit("players-waiting", {
      playerCount,
      currentPlayers: sameGameCount,
    });
  });
}

function generateRoomId() {
  return `ROOM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function tryMatchPlayers(rooms, playerCount, io) {
  const queue = matchmakingQueue[playerCount];

  console.log(
    `\n[MATCH-CHECK] Checking if we can match ${playerCount}-player game...`,
  );
  console.log(`   Queue length: ${queue.length}`);
  console.log(`   Required: ${playerCount}`);
  console.log(
    `   Can match: ${queue.length >= playerCount ? "YES ✅" : "NO ❌"}`,
  );

  const groupedByGame = new Map();
  queue.forEach((player) => {
    const key = player.gameId || "splendor";
    if (!groupedByGame.has(key)) {
      groupedByGame.set(key, []);
    }
    groupedByGame.get(key).push(player);
  });

  const eligibleGroup = Array.from(groupedByGame.values()).find((group) => group.length >= playerCount);

  if (eligibleGroup) {
    // Match found! Take playerCount players from the same game
    const matchedPlayers = eligibleGroup.slice(0, playerCount);
    const matchedIds = new Set(matchedPlayers.map((player) => player.playerId));
    matchmakingQueue[playerCount] = queue.filter((player) => !matchedIds.has(player.playerId));

    // Create new room for this match
    const roomId = generateRoomId();
    const room = getOrCreateRoom(rooms, roomId);
    room.maxPlayers = playerCount;
    room.gameId = matchedPlayers[0]?.gameId || null;
    room.turn.durationMs = normalizeTurnTimeSeconds(matchedPlayers[0]?.turnTime) * 1000;

    console.log(`\n${"#".repeat(60)}`);
    console.log(`🎮 MATCH CREATED: ${roomId}`);
    console.log(`${"#".repeat(60)}`);

    // Add players to room
    const playerList = [];
    matchedPlayers.forEach((player, idx) => {
      room.players.set(player.playerId, {
        id: player.playerId,
        name: player.playerName,
        socketId: player.socketId,
        connected: true,
        joinedAt: Date.now(),
      });
      playerList.push(player);
      console.log(`   [${idx + 1}] ${player.playerName} (${player.socketId})`);
    });

    console.log(`\nℹ️  Notifying ${playerCount} players about match...`);

    // Notify all matched players that game is ready
    matchedPlayers.forEach((player, idx) => {
      io.to(player.socketId).emit("match-found", {
        roomId,
        playerIndex: idx,
        players: playerList.map((p) => ({ id: p.playerId, name: p.playerName })),
        gameId: room.gameId,
        turnTime: Math.round(room.turn.durationMs / 1000),
      });
    });

    console.log(`✅ [MATCH SUCCESS] Room created: ${roomId}\n`);

    return { roomId, players: playerList };
  }

  console.log(`❌ [MATCH FAILED] Not enough players for ${playerCount}-player game\n`);
  return null;
}

export function handleMatchmaking(socket, rooms, io) {
  // Find match
  socket.on("find-match", (data) => {
    const { playerCount, playerId, playerName, gameId, turnTime } = data;
    console.log(
      `🔍 [MATCHMAKING] Player ${playerName} (${playerId}) searching for ${playerCount}-player game...`,
    );

    // Ensure queue exists for this playerCount
    if (!matchmakingQueue[playerCount]) {
      matchmakingQueue[playerCount] = [];
    }

    // Add to matchmaking queue
    matchmakingQueue[playerCount].push({
      socketId: socket.id,
      playerId,
      playerName,
      gameId,
      turnTime: normalizeTurnTimeSeconds(turnTime),
      timestamp: Date.now(),
    });

    console.log(`📊 [QUEUE] Current ${playerCount}-player queue:`);
    console.log(
      `   Total players waiting: ${matchmakingQueue[playerCount].length}/${playerCount}`,
    );
    matchmakingQueue[playerCount].forEach((p, i) => {
      console.log(
        `   [${i + 1}] ${p.playerName} (${p.playerId.substring(0, 8)}...)`,
      );
    });

    // Check if we can match
    if (matchmakingQueue[playerCount].length >= playerCount) {
      console.log(`\n${"*".repeat(60)}`);
      console.log(
        `🎉 MATCH FOUND! Attempting to match ${playerCount} players...`,
      );
      console.log(`${"*".repeat(60)}\n`);
    }

    // Try to match players
    const matchResult = tryMatchPlayers(rooms, playerCount, io);
    if (matchResult) {
      console.log(`✅ [MATCH SUCCESS] Room created: ${matchResult.roomId}`);
      broadcastQueueStatus(io, playerCount);
      // Match found, players will be notified via 'match-found' event
    } else {
      console.log(`⏳ [WAITING] Not enough players yet. Broadcasting queue count...`);
      broadcastQueueStatus(io, playerCount);
    }
  });

  // Cancel matchmaking
  socket.on("cancel-match", (data) => {
    const { playerCount, playerId } = data;
    console.log(
      `❌ [MATCHMAKING] Player ${playerId} cancelled search for ${playerCount}-player game`,
    );

    // Remove from queue
    const queue = matchmakingQueue[playerCount];
    const index = queue.findIndex((p) => p.playerId === playerId);
    if (index !== -1) {
      queue.splice(index, 1);
      console.log(
        `📊 [MATCHMAKING] Queue for ${playerCount}-player games: ${queue.length} player(s)`,
      );
    }

    socket.emit("match-cancelled");
    broadcastQueueStatus(io, playerCount);
  });

  // Handle disconnect - remove from matchmaking queue
  socket.on("disconnect", () => {
    console.log(`❌ [DISCONNECT] Player disconnected | قطع شده: ${socket.id}`);

    Object.keys(matchmakingQueue).forEach((countKey) => {
      const playerCount = Number(countKey);
      const queue = matchmakingQueue[playerCount];
      const nextQueue = queue.filter((player) => player.socketId !== socket.id);
      if (nextQueue.length !== queue.length) {
        matchmakingQueue[playerCount] = nextQueue;
        broadcastQueueStatus(io, playerCount);
      }
    });
  });
}
