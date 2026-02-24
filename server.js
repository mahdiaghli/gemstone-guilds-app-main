import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Socket.IO Server Running', port: 3001 }));
});

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:8082', 'http://localhost:8081', 'http://localhost:8080', 'http://127.0.0.1:8082', 'http://127.0.0.1:5173'],
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
  console.log(`✅ Player connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, playerId, playerName, playerCount, isHost } = data;
    console.log(`👤 Player ${playerName} (${playerId}) joining room ${roomId}`);

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
    }

    // Join socket to room namespace
    socket.join(roomId);

    // Broadcast updated player list to all in room
    io.to(roomId).emit('players-updated', {
      players: getRoomPlayersArray(roomId),
      roomStatus: room.status,
    });

    console.log(`📊 Room ${roomId} now has ${room.players.size} players`);
  });

  // Leave room
  socket.on('leave-room', (data) => {
    const { roomId, playerId } = data;
    console.log(`👋 Player ${playerId} leaving room ${roomId}`);

    const room = rooms.get(roomId);
    if (room) {
      room.players.delete(playerId);

      if (room.players.size === 0) {
        // Delete room if empty
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty)`);
      } else {
        // Broadcast updated player list
        io.to(roomId).emit('players-updated', {
          players: getRoomPlayersArray(roomId),
          roomStatus: room.status,
        });
      }
    }

    socket.leave(roomId);
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomId, gameState } = data;
    console.log(`🎮 Starting game in room ${roomId}`);

    const room = rooms.get(roomId);
    if (room && room.players.size >= 2) {
      room.status = 'playing';
      room.gameState = gameState;

      // Notify all players in room that game started
      io.to(roomId).emit('game-started', {
        gameState,
        playersInGame: getRoomPlayersArray(roomId),
      });
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
      console.log(`🔄 Game state synced in room ${roomId}`);
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
      console.log(`⚡ Game action from ${playerId} in room ${roomId}`);
    }
  });

  // Card purchase action
  socket.on('card-purchased', (data) => {
    const { roomId, cardId, playerIndex, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit('card-purchase-action', {
        cardId,
        playerIndex,
        gameState,
      });
      console.log(`💳 Card ${cardId} purchased by player ${playerIndex} in room ${roomId}`);
    }
  });

  // Token action
  socket.on('tokens-taken', (data) => {
    const { roomId, gems, playerIndex, gameState } = data;
    const room = rooms.get(roomId);
    if (room && gameState) {
      room.gameState = gameState;
      io.to(roomId).emit('tokens-action', {
        gems,
        playerIndex,
        gameState,
      });
      console.log(`💰 Tokens ${gems.join(',')} taken by player ${playerIndex} in room ${roomId}`);
    }
  });

  // Chat message
  socket.on('send-chat-message', (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (room) {
      // Broadcast message to all in room
      io.to(roomId).emit('chat-message', message);
      console.log(`💬 Chat in room ${roomId}: ${message.playerName}: ${message.message}`);
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
      console.log(`🎤 Microphone ${enabled ? 'ON' : 'OFF'} for ${playerId} in room ${roomId}`);
    }
  });

  // End game
  socket.on('end-game', (data) => {
    const { roomId } = data;
    console.log(`🏁 Ending game in room ${roomId}`);

    const room = rooms.get(roomId);
    if (room) {
      room.status = 'finished';
      room.gameState = null;

      io.to(roomId).emit('game-ended', {
        playersInRoom: getRoomPlayersArray(roomId),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎮 Splendor Server running on http://localhost:${PORT}\n`);
});
