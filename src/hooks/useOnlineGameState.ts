import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/lib/gameData';
import { Socket } from 'socket.io-client';

/**
 * Hook for managing synchronized game state in online multiplayer
 * Handles both local actions and server updates
 * 
 * ⚠️ NOTE: Prefer using useOnlineGame_v2 for all game state management.
 * This hook is kept for backwards compatibility but should be phased out.
 */
export function useOnlineGameState(
  socket: Socket | null,
  roomId: string,
  playerId: string,
  initialGameState: GameState | null
) {
  const [gameState, setGameState] = useState<GameState | null>(initialGameState);
  const lastSyncRef = useRef<number>(0);
  const lastStateHashRef = useRef<string>('');
  const isMountedRef = useRef(true);

  // Initialize game state from server when it arrives
  useEffect(() => {
    if (initialGameState && !gameState) {
      setGameState(initialGameState);
    }
  }, [initialGameState]); // Deliberately not including gameState to avoid infinite loops

  // Listen for game state updates from server
  useEffect(() => {
    if (!socket) return;

    const handleGameStateUpdate = (newGameState: GameState) => {
      // Create a hash of the state to detect actual changes
      const stateHash = JSON.stringify(newGameState);
      
      // Only update if state actually changed
      if (stateHash !== lastStateHashRef.current && isMountedRef.current) {
        console.log('📡 Game state update from server | بروزرسانی وضعیت بازی از سرور');
        lastStateHashRef.current = stateHash;
        setGameState(newGameState);
        lastSyncRef.current = Date.now();
      }
    };

    socket.on('game-state-updated', handleGameStateUpdate);

    return () => {
      socket.off('game-state-updated', handleGameStateUpdate);
    };
  }, [socket]);

  // Cleanup mounted flag
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update local game state and sync to server
  const updateGameState = useCallback(
    (newState: GameState) => {
      const stateHash = JSON.stringify(newState);
      
      // Only update if state actually changed
      if (stateHash !== lastStateHashRef.current) {
        lastStateHashRef.current = stateHash;
        setGameState(newState);

        // Emit to server to broadcast to other players
        if (socket) {
          socket.emit('sync-game-state', {
            roomId,
            gameState: newState,
            playerId,
            timestamp: Date.now(),
          });
          console.log('📤 [SYNC] Game state sent to server | وضعیت بازی به سرور ارسال شد');
        }
      }
    },
    [socket, roomId, playerId]
  );

  return {
    gameState,
    updateGameState,
  };
}

