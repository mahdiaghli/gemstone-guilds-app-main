import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/lib/gameData';
import { Socket } from 'socket.io-client';

/**
 * Hook for managing synchronized game state in online multiplayer
 * Handles both local actions and server updates
 */
export function useOnlineGameState(
  socket: Socket | null,
  roomId: string,
  playerId: string,
  initialGameState: GameState | null
) {
  const [gameState, setGameState] = useState<GameState | null>(initialGameState);
  const lastSyncRef = useRef<number>(0);
  const pendingActionsRef = useRef<any[]>([]);

  // Initialize game state from server when it arrives
  useEffect(() => {
    if (initialGameState && !gameState) {
      setGameState(initialGameState);
    }
  }, [initialGameState]);

  // Listen for game state updates from server
  useEffect(() => {
    if (!socket) return;

    const handleGameStateUpdate = (newGameState: GameState) => {
      console.log('📡 Game state update from server');
      setGameState(newGameState);
      lastSyncRef.current = Date.now();
    };

    socket.on('game-state-updated', handleGameStateUpdate);

    return () => {
      socket.off('game-state-updated', handleGameStateUpdate);
    };
  }, [socket]);

  // Update local game state and sync to server
  const updateGameState = useCallback(
    (newState: GameState) => {
      setGameState(newState);

      // Emit to server to broadcast to other players
      if (socket) {
        socket.emit('sync-game-state', {
          roomId,
          gameState: newState,
          playerId,
          timestamp: Date.now(),
        });
      }
    },
    [socket, roomId, playerId]
  );

  return {
    gameState,
    updateGameState,
  };
}
