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

  // Sync game state
  socket.on('sync-game-state', (data) => {
    const { roomId, gameState } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.gameState = gameState;
      // Broadcast updated game state to all in room
      socket.to(roomId).emit('game-state-updated', gameState);
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
