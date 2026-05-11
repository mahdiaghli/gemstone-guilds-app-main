import { createServer } from "http";
import { Server } from "socket.io";
import { setupHttpRoutes } from "./server-http.js";
import { handleMatchmaking } from "./server-matchmaking.js";
import { handleGameStart, handleGameStateUpdate, handleRematchRequest, handleJoinRoom, handlePlayerDeparture, getRoomPlayersArray } from "./server-game-logic.js";
import { getOrCreateRoom, buildPlayerIndexMap, clearDisconnectTimer, startTurnTimer, clearTurnTimer } from "./server-rooms.js";
import { getMatchmakingQueue, broadcastQueueStatus } from "./server-matchmaking.js";

const httpServer = createServer();

setupHttpRoutes(httpServer);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedPatterns = [
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
        /^http:\/\/192\.168\./,
        /^http:\/\/10\./,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^https:\/\/.*\.ngrok\.io$/,
        /^https:\/\/.*\.ngrok-free\.app$/,
        /^https:\/\/.*\.trycloudflare\.com$/,
      ];

      if (!origin || allowedPatterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("برای دسترسی اجازه نیست | Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`✅ [CONNECTION] Player connected | بازیکن متصل شد: ${socket.id}`);
  console.log(`📱 Client address: ${socket.handshake.address}`);
  console.log(`🌍 Headers:`, {
    agent: socket.handshake.headers["user-agent"]?.substring(0, 50),
    origin: socket.handshake.headers["origin"],
  });

  handleMatchmaking(socket, rooms, io);

  socket.on("join-room", (data) => {
    handleJoinRoom(rooms, io, socket, data);
  });

  socket.on("leave-room", (data) => {
    const { roomId, playerId } = data;
    console.log(`👋 [LEAVE-ROOM] Player ${playerId} leaving room ${roomId} | بازیکن ترک اتاق`);
    handlePlayerDeparture(rooms, io, roomId, playerId, socket.id, true);
    socket.leave(roomId);
  });

  socket.on("start-game", (data) => {
    const { roomId, gameState, turnTime } = data;
    console.log(`🎮 [START-GAME] Starting game in room ${roomId} | شروع بازی`);
    handleGameStart(rooms, io, roomId, gameState, turnTime);
  });

  socket.on("sync-game-state", (data) => {
    handleGameStateUpdate(rooms, io, data.roomId, data.gameState);
  });

  socket.on("game-action", (data) => {
    handleGameStateUpdate(rooms, io, data.roomId, data.gameState);
  });

  socket.on("card-purchased", (data) => {
    const { roomId, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit("game-state-updated", gameState);
    }
  });

  socket.on("tokens-taken", (data) => {
    const { roomId, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit("game-state-updated", gameState);
    }
  });

  socket.on("send-chat-message", (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (room) {
      io.to(roomId).emit("chat-message", message);
      console.log(`💬 [CHAT] Room ${roomId} - ${message.playerName}: ${message.message}`);
    }
  });

  socket.on("microphone-toggled", (data) => {
    const { roomId, playerId, enabled } = data;
    const room = rooms.get(roomId);
    if (room) {
      io.to(roomId).emit("player-microphone-toggled", { playerId, enabled });
      const status = enabled ? "ON 🎤" : "OFF 🔇";
      console.log(`🎤 [MIC] Microphone ${status} for ${playerId} in room ${roomId}`);
    }
  });

  socket.on("voice-offer", (data) => {
    const { to, offer, roomId } = data;
    if (to) {
      io.to(to).emit("voice-offer", { from: socket.id, offer, roomId });
    }
  });

  socket.on("voice-answer", (data) => {
    const { to, answer, roomId } = data;
    if (to) {
      io.to(to).emit("voice-answer", { from: socket.id, answer, roomId });
    }
  });

  socket.on("voice-ice", (data) => {
    const { to, candidate, roomId } = data;
    if (to) {
      io.to(to).emit("voice-ice", { from: socket.id, candidate, roomId });
    }
  });

  socket.on("voice-end", (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit("voice-end", { from: socket.id });
    }
  });

  socket.on("end-game", (data) => {
    const { roomId } = data;
    console.log(`🏁 [END-GAME] Ending game in room ${roomId} | پایان بازی`);
    const room = rooms.get(roomId);
    if (room) {
      room.status = "finished";
      room.gameState = null;
      room.rematch = null;
      room.postGame = null;
      clearTurnTimer(room);
      io.to(roomId).emit("game-ended", { playersInRoom: getRoomPlayersArray(rooms, roomId) });
    }
  });

  socket.on("post-game-action", (data) => {
    const { roomId, playerId, playerName, action, initialGameState } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    socket.to(roomId).emit("post-game-action", {
      playerId,
      playerName,
      action,
    });

    if (action !== "play-again") {
      return;
    }

    if (!room.postGame) {
      room.postGame = {
        playAgainVotes: new Set(),
        initialGameState: null,
      };
    }

    room.postGame.playAgainVotes.add(playerId);
    if (initialGameState) {
      room.postGame.initialGameState = initialGameState;
    }

    io.to(roomId).emit("post-game-votes", {
      playerIds: Array.from(room.postGame.playAgainVotes),
    });

    if (
      room.postGame.playAgainVotes.size === room.players.size
      && room.postGame.initialGameState
    ) {
      handleGameStart(
        rooms,
        io,
        roomId,
        room.postGame.initialGameState,
        Math.max(15, Math.round((room.turn.durationMs || 45000) / 1000)),
      );
    }
  });

  socket.on("request-rematch", (data) => {
    handleRematchRequest(rooms, io, data.roomId, data.playerId, data.initialGameState);
  });

  socket.on("respond-rematch", (data) => {
    handleRematchRequest(rooms, io, data.roomId, data.playerId, null, data.accept);
  });

  socket.on("disconnect", () => {
    console.log(`❌ [DISCONNECT] Player disconnected | قطع شده: ${socket.id}`);
    const matchmakingQueue = getMatchmakingQueue();
    Object.keys(matchmakingQueue).forEach((countKey) => {
      const playerCount = Number(countKey);
      const queue = matchmakingQueue[playerCount];
      const nextQueue = queue.filter((player) => player.socketId !== socket.id);
      if (nextQueue.length !== queue.length) {
        matchmakingQueue[playerCount] = nextQueue;
        broadcastQueueStatus(io, playerCount);
      }
    });

    for (const [roomId, room] of rooms.entries()) {
      const matchingPlayer = Array.from(room.players.values()).find((player) => player.socketId === socket.id);
      if (!matchingPlayer) continue;
      handlePlayerDeparture(rooms, io, roomId, matchingPlayer.id, socket.id);
      socket.leave(roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(
    `\n🎮 [SERVER] Splendor Server running on http://localhost:${PORT}`,
  );
  console.log(`📡 [SERVER] سرور Splendor در حال کار است`);
  console.log(
    `\n📱 [MOBILE] For mobile/remote connection, use your laptop IP:`,
  );
  console.log(`   http://YOUR_LAPTOP_IP:${PORT}`);
  console.log(
    `\n💡 [TIP] Find your IP: Run 'ipconfig' and look for IPv4 Address\n`,
  );
});
