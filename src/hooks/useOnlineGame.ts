import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/lib/gameData';

// Dynamically import socket.io-client to avoid build issues
let io: any = null;
let Socket: any = null;

(async () => {
  try {
    const socketModule = await import('socket.io-client');
    io = socketModule.io;
    Socket = socketModule.Socket;
  } catch (err) {
    console.warn('Socket.IO client not available - running in offline mode', err);
  }
})();

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface OnlinePlayer {
  id: string;
  name: string;
  socketId: string;
  connected: boolean;
  joinedAt: number;
}

export function useOnlineGame(roomId: string, playerId: string, playerName: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<Record<string, OnlinePlayer>>({});
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any | null>(null);
  const joinedRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !playerId || !playerName || joinedRef.current) return;

    // Check if socket.io is available
    if (!io) {
      setError('Socket.IO library not loaded. Please wait...');
      setLoading(false);
      return;
    }

    try {
      // Connect to socket server
      const socket = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to socket server');
        setError(null);
        setLoading(false);
      });

      socket.on('connect_error', (err: any) => {
        console.error('❌ Socket connection error:', err);
        setError('Failed to connect to server. Make sure server is running: "npm run dev:server"');
      });

      socket.on('players-updated', (data: any) => {
        const { players, roomStatus } = data;
        // Convert array to object keyed by player ID
        const playersObj = players.reduce(
          (acc: Record<string, OnlinePlayer>, p: OnlinePlayer) => {
            acc[p.id] = p;
            return acc;
          },
          {}
        );
        setRoomPlayers(playersObj);
        setRoomStatus(roomStatus || 'waiting');
        setError(null);
      });

      socket.on('game-started', (data: any) => {
        const { gameState } = data;
        setGameState(gameState);
        setRoomStatus('playing');
      });

      socket.on('game-state-updated', (data: any) => {
        setGameState(data);
      });

      socket.on('game-ended', () => {
        setRoomStatus('waiting');
        setGameState(null);
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Disconnected from server');
        setError('Disconnected from server');
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error('Socket initialization error:', err);
      setError('Failed to initialize connection');
      setLoading(false);
    }
  }, [roomId, playerId, playerName]);

  // Join room
  const joinRoom = useCallback(
    (playerCount: number = 4) => {
      if (!socketRef.current || joinedRef.current) return;

      try {
        socketRef.current.emit('join-room', {
          roomId,
          playerId,
          playerName,
          playerCount,
          isHost: false,
        });

        joinedRef.current = true;
      } catch (err) {
        console.error('Error joining room:', err);
        setError('Failed to join room');
      }
    },
    [roomId, playerId, playerName]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('leave-room', {
      roomId,
      playerId,
    });

    joinedRef.current = false;
  }, [roomId, playerId]);

  // Start game
  const startGame = useCallback(
    (initialGameState: GameState) => {
      if (!socketRef.current) return;

      socketRef.current.emit('start-game', {
        roomId,
        gameState: initialGameState,
      });
    },
    [roomId]
  );

  // Sync game state
  const syncGameState = useCallback(
    (newState: GameState) => {
      if (!socketRef.current) return;

      setGameState(newState);
      socketRef.current.emit('sync-game-state', {
        roomId,
        gameState: newState,
      });
    },
    [roomId]
  );

  // Finish game
  const finishGame = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('end-game', {
      roomId,
    });
  }, [roomId]);

  return {
    gameState,
    roomPlayers,
    roomStatus,
    loading,
    error,
    syncGameState,
    joinRoom,
    leaveRoom,
    startGame,
    finishGame,
  };
}
