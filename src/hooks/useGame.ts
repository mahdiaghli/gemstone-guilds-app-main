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

function cloneGameState(state: GameState) {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function useGame(playerCount: number, initialState?: GameState) {
  const [state, setState] = useState<GameState>(() =>
    initialState ? cloneGameState(initialState) : initializeGame(playerCount),
  );

  const takeTokens = useCallback((gems: GemType[]) => {
    setState(s => performTakeTokens(s, gems));
  }, []);

  const purchaseCard = useCallback((cardId: string | number) => {
    setState(s => performPurchaseCard(s, cardId));
  }, []);

  const reserveCard = useCallback((cardId: string | number, fromDeckLevel?: 1 | 2 | 3) => {
    setState(s => performReserveCard(s, cardId, fromDeckLevel));
  }, []);

  const returnToken = useCallback((playerIndex: number, tokenType: TokenType) => {
    setState(s => performReturnToken(s, playerIndex, tokenType));
  }, []);

  const endTurn = useCallback(() => {
    setState(s => advanceTurn(s));
  }, []);

  const resetGame = useCallback((nextState?: GameState) => {
    if (nextState) {
      setState(cloneGameState(nextState));
      return;
    }

    if (initialState) {
      setState(cloneGameState(initialState));
      return;
    }

    setState(initializeGame(playerCount));
  }, [initialState, playerCount]);

  return { state, setState, takeTokens, purchaseCard, reserveCard, returnToken, endTurn, resetGame };
}
