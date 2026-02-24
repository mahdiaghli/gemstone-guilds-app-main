import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/lib/gameData';

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
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !playerId || !playerName || joinedRef.current) return;

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
        console.log('Connected to socket server');
        setError(null);
        setLoading(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to server');
      });

      socket.on('players-updated', (data) => {
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

      socket.on('game-started', (data) => {
        const { gameState } = data;
        setGameState(gameState);
        setRoomStatus('playing');
      });

      socket.on('game-state-updated', (data) => {
        setGameState(data);
      });

      socket.on('game-ended', () => {
        setRoomStatus('waiting');
        setGameState(null);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
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
          isHost: true, // Will be determined by client
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

  // Sync game state with full server-side validation
  const syncGameState = useCallback(
    (newState: GameState) => {
      if (!socketRef.current) return;

      // Update local state immediately for responsiveness
      setGameState(newState);
      
      // Broadcast to all players in the room
      socketRef.current.emit('game-action', {
        roomId,
        playerId,
        gameState: newState,
        timestamp: Date.now(),
      });
    },
    [roomId, playerId]
  );

  // Broadcast card purchase to all players
  const broadcastCardPurchase = useCallback(
    (cardId: number, playerIndex: number) => {
      if (!socketRef.current) return;
      socketRef.current.emit('card-purchased', { roomId, cardId, playerIndex });
    },
    [roomId]
  );

  // Broadcast token action to all players
  const broadcastTokenAction = useCallback(
    (gems: string[], playerIndex: number) => {
      if (!socketRef.current) return;
      socketRef.current.emit('tokens-taken', { roomId, gems, playerIndex });
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
    socket: socketRef.current,
    syncGameState,
    broadcastCardPurchase,
    broadcastTokenAction,
    joinRoom,
    leaveRoom,
    startGame,
    finishGame,
  };
}
