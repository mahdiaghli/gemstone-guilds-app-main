import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Socket.IO Server Running', port: 3001 }));
});

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // ✅ اجازه دسترسی به localhost، 127.0.0.1، و IP‌های محلی
      // ✅ Allow localhost, 127.0.0.1, and local network IPs
      const allowedPatterns = [
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
        /^http:\/\/192\.168\./,
        /^http:\/\/10\./,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
      ];
      
      if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('برای دسترسی اجازه نیست | Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

// In-memory room storage
const rooms = new Map();

// Helper function to get or create room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      gameState: null,
      status: 'waiting',
      maxPlayers: 4,
      createdAt: Date.now(),
    });
  }
  return rooms.get(roomId);
}

// Helper function to get room players as array
function getRoomPlayersArray(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players.values());
}

io.on('connection', (socket) => {
  console.log(`✅ [CONNECTION] Player connected | بازیکن متصل شد: ${socket.id}`);

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, playerId, playerName, playerCount, isHost } = data;
    console.log(`👤 [JOIN-ROOM] ${playerName} (Tab-ID: ${playerId}) joining room ${roomId}`);
    console.log(`   Socket ID: ${socket.id} | نام: ${playerName}`);

    const room = getOrCreateRoom(roomId);
    
    // Add player to room
    room.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      connected: true,
      joinedAt: Date.now(),
    });

    // Update max players if host is setting it
    if (isHost && playerCount) {
      room.maxPlayers = playerCount;
      console.log(`   Max Players set to: ${playerCount}`);
    }

    // Join socket to room namespace
    socket.join(roomId);

    // Broadcast updated player list to all in room
    io.to(roomId).emit('players-updated', {
      players: getRoomPlayersArray(roomId),
      roomStatus: room.status,
    });

    console.log(`📊 [PLAYERS] Room ${roomId} now has ${room.players.size} players | تعداد بازیکنان: ${room.players.size}`);
  });

  // Leave room
  socket.on('leave-room', (data) => {
    const { roomId, playerId } = data;
    console.log(`👋 [LEAVE-ROOM] Player ${playerId} leaving room ${roomId} | بازیکن ترک اتاق`);

    const room = rooms.get(roomId);
    if (room) {
      room.players.delete(playerId);

      if (room.players.size === 0) {
        // Delete room if empty
        rooms.delete(roomId);
        console.log(`🗑️  [CLEANUP] Room ${roomId} deleted (empty) | اتاق حذف شد`);
      } else {
        // Broadcast updated player list
        io.to(roomId).emit('players-updated', {
          players: getRoomPlayersArray(roomId),
          roomStatus: room.status,
        });
        console.log(`📊 [PLAYERS] Room ${roomId} now has ${room.players.size} players | تعداد باقی‌مانده: ${room.players.size}`);
      }
    }

    socket.leave(roomId);
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomId, gameState } = data;
    console.log(`🎮 [START-GAME] Starting game in room ${roomId} | شروع بازی`);

    const room = rooms.get(roomId);
    if (room && room.players.size >= 2) {
      room.status = 'playing';
      room.gameState = gameState;

      // Notify all players in room that game started
      io.to(roomId).emit('game-started', {
        gameState,
        playersInGame: getRoomPlayersArray(roomId),
      });
      console.log(`✅ [START-GAME] Game started with ${room.players.size} players | بازی آغاز شد`);
    } else {
      console.log(`❌ [START-GAME] Not enough players (${room?.players.size || 0}/2)`);
    }
  });

  // Sync game state - main action that broadcasts to all players
  socket.on('sync-game-state', (data) => {
    const { roomId, gameState } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.gameState = gameState;
      // Broadcast updated game state to ALL players in room (including sender)
      io.to(roomId).emit('game-state-updated', gameState);
      console.log(`📡 [SYNC] Game state synced in room ${roomId} | وضعیت بروزرسانی شد`);
    }
  });

  // Handle general game actions - broadcasts to all players
  socket.on('game-action', (data) => {
    const { roomId, playerId, gameState, timestamp } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.gameState = gameState;
      // Broadcast to all players in room
      io.to(roomId).emit('game-state-updated', gameState);
      console.log(`⚡ [ACTION] Game action from ${playerId} in room ${roomId} | عملیات بازی`);
    }
  });

  // Card purchase action
  socket.on('card-purchased', (data) => {
    const { roomId, cardId, playerIndex, playerId, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit('card-purchase-action', {
        cardId,
        playerIndex,
        gameState,
      });
      console.log(`💳 [CARD] Card ${cardId} purchased by player ${playerIndex} (${playerId}) | خریداری کارت`);
    }
  });

  // Token action
  socket.on('tokens-taken', (data) => {
    const { roomId, gems, playerIndex, playerId, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit('tokens-action', {
        gems,
        playerIndex,
        gameState,
      });
      console.log(`🪙 [TOKEN] Tokens ${gems.join(',')} taken by player ${playerIndex} (${playerId}) | گرفتن سکه‌ها`);
    }
  });

  // Chat message
  socket.on('send-chat-message', (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (room) {
      // Broadcast message to all in room
      io.to(roomId).emit('chat-message', message);
      console.log(`💬 [CHAT] Room ${roomId} - ${message.playerName}: ${message.message}`);
    }
  });

  // Microphone toggle
  socket.on('microphone-toggled', (data) => {
    const { roomId, playerId, enabled } = data;
    const room = rooms.get(roomId);
    if (room) {
      // Broadcast microphone status to all in room
      io.to(roomId).emit('player-microphone-toggled', {
        playerId,
        enabled,
      });
      const status = enabled ? 'ON 🎤' : 'OFF 🔇';
      console.log(`🎤 [MIC] Microphone ${status} for ${playerId} in room ${roomId} | میکروفون ${enabled ? 'روشن' : 'خاموش'}`);
    }
  });

  // End game
  socket.on('end-game', (data) => {
    const { roomId } = data;
    console.log(`🏁 [END-GAME] Ending game in room ${roomId} | پایان بازی`);

    const room = rooms.get(roomId);
    if (room) {
      room.status = 'finished';
      room.gameState = null;

      io.to(roomId).emit('game-ended', {
        playersInRoom: getRoomPlayersArray(roomId),
      });
      console.log(`✅ [END-GAME] Game ended | بازی پایان یافت`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ [DISCONNECT] Player disconnected | قطع شده: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎮 [SERVER] Splendor Server running on http://localhost:${PORT}`);
  console.log(`📡 [SERVER] سرور Splendor در حال کار است\n`);
});
