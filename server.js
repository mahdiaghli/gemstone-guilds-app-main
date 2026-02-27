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
      // ✅ ریق ngrok و CloudFlare Tunnel را هم اضافه کنیم
      const allowedPatterns = [
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
        /^http:\/\/192\.168\./,
        /^http:\/\/10\./,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^https:\/\/.*\.ngrok\.io$/, // ngrok
        /^https:\/\/.*\.ngrok-free\.app$/, // ngrok v3+
        /^https:\/\/.*\.trycloudflare\.com$/, // CloudFlare Tunnel
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

// In-memory matchmaking queue (waiting players)
const matchmakingQueue = {
  2: [], // Queue for 2-player games
  3: [], // Queue for 3-player games
  4: [], // Queue for 4-player games
};

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

// Helper function to generate random room ID
function generateRoomId() {
  return 'MM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to match players from queue
function tryMatchPlayers(playerCount) {
  const queue = matchmakingQueue[playerCount];
  
  console.log(`\n[MATCH-CHECK] Checking if we can match ${playerCount}-player game...`);
  console.log(`   Queue length: ${queue.length}`);
  console.log(`   Required: ${playerCount}`);
  console.log(`   Can match: ${queue.length >= playerCount ? 'YES ✅' : 'NO ❌'}`);

  if (queue.length >= playerCount) {
    // Match found! Take playerCount players from queue
    const matchedPlayers = queue.splice(0, playerCount);
    
    // Create new room for this match
    const roomId = generateRoomId();
    const room = getOrCreateRoom(roomId);
    room.maxPlayers = playerCount;
    
    console.log(`\n${'#'.repeat(60)}`);
    console.log(`🎮 MATCH CREATED: ${roomId}`);
    console.log(`${'#'.repeat(60)}`);

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
      console.log(`   📤 Sending 'match-found' to ${player.playerName}...`);
      io.to(player.socketId).emit('match-found', {
        roomId,
        players: Array.from(room.players.values()),
      });
      console.log(`   ✅ Sent to ${player.playerName}`);
    });

    console.log(`\n${'#'.repeat(60)}\n`);

    return {
      roomId,
      players: Array.from(room.players.values()),
    };
  }
  
  console.log(`   ➡️  No match possible. Queue too small.\n`);
  return null;
}

// Helper function to get room players as array
function getRoomPlayersArray(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players.values());
}

io.on('connection', (socket) => {
  console.log(`✅ [CONNECTION] Player connected | بازیکن متصل شد: ${socket.id}`);
  console.log(`📱 Client address: ${socket.handshake.address}`);
  console.log(`🌍 Headers:`, {
    agent: socket.handshake.headers['user-agent']?.substring(0, 50),
    origin: socket.handshake.headers['origin'],
  });

  // Matchmaking: Find a match for this player
  socket.on('find-match', (data) => {
    const { playerCount, playerName, playerId } = data;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 [MATCHMAKING] ${playerName} searching for ${playerCount}-player game`);
    console.log(`   Player ID: ${playerId}`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`${'='.repeat(60)}\n`);

    // Add to matchmaking queue
    matchmakingQueue[playerCount].push({
      socketId: socket.id,
      playerId,
      playerName,
      timestamp: Date.now(),
    });

    console.log(`📊 [QUEUE] Current ${playerCount}-player queue:`);
    console.log(`   Total players waiting: ${matchmakingQueue[playerCount].length}/${playerCount}`);
    matchmakingQueue[playerCount].forEach((p, i) => {
      console.log(`   [${i + 1}] ${p.playerName} (${p.playerId.substring(0, 8)}...)`);
    });

    // Check if we can match
    if (matchmakingQueue[playerCount].length >= playerCount) {
      console.log(`\n${'*'.repeat(60)}`);
      console.log(`🎉 MATCH FOUND! Attempting to match ${playerCount} players...`);
      console.log(`${'*'.repeat(60)}\n`);
    }

    // Try to match players
    const matchResult = tryMatchPlayers(playerCount);
    if (matchResult) {
      console.log(`✅ [MATCH SUCCESS] Room created: ${matchResult.roomId}`);
      // Match found, players will be notified via 'match-found' event
    } else {
      // No match yet, notify player they're waiting
      console.log(`⏳ [WAITING] Not enough players yet. Notifying...`);
      socket.emit('players-waiting', {
        playerCount,
        currentPlayers: matchmakingQueue[playerCount].length,
      });
      console.log(`   Sent 'players-waiting' to player ${playerName}`);
    }
  });

  // Cancel matchmaking
  socket.on('cancel-match', (data) => {
    const { playerCount, playerId } = data;
    console.log(`❌ [MATCHMAKING] Player ${playerId} cancelled search for ${playerCount}-player game`);

    // Remove from queue
    const queue = matchmakingQueue[playerCount];
    const index = queue.findIndex(p => p.playerId === playerId);
    if (index !== -1) {
      queue.splice(index, 1);
      console.log(`📊 [MATCHMAKING] Queue for ${playerCount}-player games: ${queue.length} player(s)`);
    }

    socket.emit('match-cancelled');
  });

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

      // Get players in a consistent order (sorted by socket ID to ensure consistency)
      const playersArray = Array.from(room.players.values()).sort((a, b) => a.socketId.localeCompare(b.socketId));
      
      // Create mapping of socket ID to player index in game
      const playerIndexMap = {};
      playersArray.forEach((player, idx) => {
        playerIndexMap[player.socketId] = idx;
      });

      // Notify all players in room that game started
      io.to(roomId).emit('game-started', {
        gameState,
        playersInGame: playersArray,
        playerIndexMap, // Map socket ID to game index
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
  console.log(`📡 [SERVER] سرور Splendor در حال کار است`);
  console.log(`\n📱 [MOBILE] For mobile/remote connection, use your laptop IP:`);
  console.log(`   http://YOUR_LAPTOP_IP:${PORT}`);
  console.log(`\n💡 [TIP] Find your IP: Run 'ipconfig' and look for IPv4 Address\n`);
});
