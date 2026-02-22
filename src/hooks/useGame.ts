import { useState, useCallback } from 'react';
import { GameState, GemType, TokenType } from '@/lib/gameData';
import {
  initializeGame,
  performTakeTokens,
  performPurchaseCard,
  performReserveCard,
  performReturnToken,
  advanceTurn,
} from '@/lib/gameLogic';

export function useGame(playerCount: number) {
  const [state, setState] = useState<GameState>(() => initializeGame(playerCount));

  const takeTokens = useCallback((gems: GemType[]) => {
    setState(s => performTakeTokens(s, gems));
  }, []);

  const purchaseCard = useCallback((cardId: number) => {
    setState(s => performPurchaseCard(s, cardId));
  }, []);

  const reserveCard = useCallback((cardId: number, fromDeckLevel?: 1 | 2 | 3) => {
    setState(s => performReserveCard(s, cardId, fromDeckLevel));
  }, []);

  const returnToken = useCallback((playerIndex: number, tokenType: TokenType) => {
    setState(s => performReturnToken(s, playerIndex, tokenType));
  }, []);

  const endTurn = useCallback(() => {
    setState(s => advanceTurn(s));
  }, []);

  const resetGame = useCallback(() => {
    setState(initializeGame(playerCount));
  }, [playerCount]);

  return { state, takeTokens, purchaseCard, reserveCard, returnToken, endTurn, resetGame };
}
