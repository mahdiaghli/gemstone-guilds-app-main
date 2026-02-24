import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { useGame } from '@/hooks/useGame';
import { useAudio } from '@/hooks/useAudio';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { cn } from '@/lib/utils';
import { GemType, TokenType, Card, GEM_TYPES, TOKEN_TYPES, GEM_INFO, LEVEL_COLORS, GameState } from '@/lib/gameData';
import { canPlayerAffordCard, getPlayerScore, getTotalTokens, getPlayerBonuses } from '@/lib/gameLogic';
import { getAIAction, AIDifficulty } from '@/lib/aiPlayer';
import { audioManager } from '@/lib/audioManager';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import GemToken from '@/components/game/GemToken';
import CardDisplay from '@/components/game/CardDisplay';
import NobleDisplay from '@/components/game/NobleDisplay';
import PlayerPanel from '@/components/game/PlayerPanel';
import MusicControl from '@/components/game/MusicControl';
import VoiceChatControl from '@/components/game/VoiceChatControl';
import Chat from '@/components/game/Chat';
import backcard1Img from '@/assets/backcard1.png';
import backcard2Img from '@/assets/backcard2.png';
import backcard3Img from '@/assets/backcard3.png';

const backCardsByLevel = { 1: backcard1Img, 2: backcard2Img, 3: backcard3Img };

type Phase = 'idle' | 'selectingTokens' | 'mustReturnTokens' | 'cardAction' | 'aiThinking';

interface GameProps {
  mode?: 'local' | 'ai' | 'online';
  roomId?: string;
  playerId?: string;
  playerName?: string;
  socket?: Socket | null;
  serverGameState?: GameState | null;
  onGameStateChange?: (state: GameState) => void;
  onGameEnd?: () => void;
}

export default function Game(props: GameProps = {}) {
  const [searchParams] = useSearchParams();
  const playerCount = Math.min(4, Math.max(2, parseInt(searchParams.get('players') || '2')));
  const gameMode = props.mode || searchParams.get('mode') || 'local';
  const aiDifficulty = (searchParams.get('difficulty') || 'medium') as AIDifficulty;
  const navigate = useNavigate();

  const { state: localGameState, takeTokens, purchaseCard, reserveCard, returnToken, endTurn, resetGame } = useGame(playerCount);

  // For online games, serverGameState is the source of truth
  // We display serverGameState but perform actions on localGameState then sync
  const [displayState, setDisplayState] = useState(localGameState);

  // Update display state based on server updates (for other players' actions)
  useEffect(() => {
    if (gameMode === 'online' && props.serverGameState) {
      setDisplayState(props.serverGameState);
    } else {
      setDisplayState(localGameState);
    }
  }, [props.serverGameState, localGameState, gameMode]);

  const state = displayState;

  const isAIPlayer = useCallback((index: number) => {
    if (gameMode !== 'ai') return false;
    return index !== 0; // Player 0 is human, rest are AI
  }, [gameMode]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedGems, setSelectedGems] = useState<GemType[]>([]);
  const [tempPoolDisplay, setTempPoolDisplay] = useState<Record<TokenType, number> | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const currentPlayer = state.players[state.currentPlayerIndex];

  // Sync game state when it changes (for online games)
  useEffect(() => {
    if (gameMode === 'online' && props.onGameStateChange && state) {
      props.onGameStateChange(state);
    }
  }, [state, gameMode, props.onGameStateChange]);

  // Listen for game state updates from other players (for online games)
  useEffect(() => {
    if (gameMode !== 'online' || !props.socket) return;

    const handleGameStateUpdate = (newGameState: GameState) => {
      // Update local game state with server state
      // Only update if current player is not the one who made the action
      // This prevents double-applying the action
      console.log('📡 Received game state update from server');
      
      // For now, we'll accept the server state as the source of truth
      // In a production app, you might want more sophisticated conflict resolution
      if (newGameState) {
        // We need to sync the entire game state
        // Since we can't directly update useGame state, we'll need to compare
        // and only apply updates for other players' actions
      }
    };

    props.socket.on('game-state-updated', handleGameStateUpdate);

    return () => {
      props.socket?.off('game-state-updated', handleGameStateUpdate);
    };
  }, [gameMode, props.socket]);

  // Phase sync: when all gems deselected, go back to idle
  useEffect(() => {
    if (selectedGems.length === 0 && phase === 'selectingTokens') setPhase('idle');
    if (selectedGems.length > 0 && phase === 'idle') setPhase('selectingTokens');
  }, [selectedGems.length, phase]);

  // Return tokens phase: auto-end when total <= 10
  useEffect(() => {
    if (phase === 'mustReturnTokens' && getTotalTokens(state.players[state.currentPlayerIndex]) <= 10) {
      endTurn();
      setPhase('idle');
    }
  }, [state, phase, endTurn]);

  // AI turn - automatic execution with proper state tracking
  useEffect(() => {
    if (state.gameOver) return;
    if (phase !== 'idle') return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;

    let isMounted = true;
    
    const executeAI = async () => {
      // Simulate thinking time based on difficulty
      let delayMs = 400;
      if (aiDifficulty === 'easy') {
        delayMs = 150 + Math.random() * 100; // 150-250ms
      } else if (aiDifficulty === 'medium') {
        delayMs = 200 + Math.random() * 100; // 200-300ms
      } else if (aiDifficulty === 'hard') {
        delayMs = 250 + Math.random() * 100; // 250-350ms
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      if (!isMounted) return;
      
      setPhase('aiThinking');
      
      // Execute AI action immediately after thinking display
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;
      
      const action = getAIAction(state, aiDifficulty);
      
      if (action.type === 'purchaseCard') {
        purchaseCard(action.cardId);
      } else if (action.type === 'takeTokens') {
        takeTokens(action.gems);
      } else if (action.type === 'reserveCard') {
        reserveCard(action.cardId);
      } else if (action.type === 'reserveDeck') {
        reserveCard(0, action.level);
      }
      
      if (isMounted) {
        endTurn();
        setPhase('idle');
      }
    };

    executeAI();
    
    return () => {
      isMounted = false;
    };
  }, [state.currentPlayerIndex, state.gameOver, isAIPlayer, state, aiDifficulty, purchaseCard, takeTokens, reserveCard, endTurn]);

  const handleGemClick = useCallback((gem: GemType) => {
    if (phase !== 'idle' && phase !== 'selectingTokens') return;
    if (state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)) return;

    let newSelected: GemType[] = [];
    const count = selectedGems.filter(g => g === gem).length;
    
    if (count === 0) {
      if (selectedGems.length === 2 && selectedGems[0] === selectedGems[1]) {
        newSelected = selectedGems; // Can't add to pair
      } else if (selectedGems.length >= 3) {
        newSelected = selectedGems; // Can't exceed 3
      } else {
        newSelected = [...selectedGems, gem];
      }
    } else if (count === 1 && selectedGems.length === 1 && state.tokenPool[gem] >= 4) {
      // Allow picking 2 of the same gem if supply >= 4
      newSelected = [gem, gem];
    } else {
      // Remove this gem selection
      newSelected = selectedGems.filter(g => g !== gem);
    }

    setSelectedGems(newSelected);

    // Immediate visual update: show reduced token pool
    if (newSelected.length > 0) {
      const tempPool = { ...state.tokenPool };
      for (const g of newSelected) {
        tempPool[g] = Math.max(0, tempPool[g] - 1);
      }
      setTempPoolDisplay(tempPool);
    } else {
      setTempPoolDisplay(null); // Reset to normal view
    }
  }, [phase, state.tokenPool, selectedGems]);

  const handleConfirmTokens = useCallback(() => {
    const currentTotal = getTotalTokens(currentPlayer);
    const adding = selectedGems.length;
    audioManager.playSound('takeTokens');
    takeTokens(selectedGems);
    setSelectedGems([]);
    setTempPoolDisplay(null); // Clear temp display

    if (currentTotal + adding > 10) {
      setPhase('mustReturnTokens');
    } else {
      endTurn();
      setPhase('idle');
    }
  }, [selectedGems, currentPlayer, takeTokens, endTurn]);

  const handleCancelTokens = useCallback(() => {
    setSelectedGems([]);
    setTempPoolDisplay(null);
    setPhase('idle');
  }, []);

  const handleCardClick = useCallback((card: Card) => {
    if (phase !== 'idle') return;
    setSelectedCard(card);
    setPhase('cardAction');
  }, [phase]);

  const handleBuyCard = useCallback(() => {
    if (!selectedCard) return;
    audioManager.playSound('buyCard');
    purchaseCard(selectedCard.id);
    setSelectedCard(null);
    endTurn();
    setPhase('idle');
  }, [selectedCard, purchaseCard, endTurn]);

  const handleReserveCard = useCallback(() => {
    if (!selectedCard) return;
    const currentTotal = getTotalTokens(currentPlayer);
    const getsGold = state.tokenPool.gold > 0;
    audioManager.playSound('reserveCard');
    reserveCard(selectedCard.id);
    setSelectedCard(null);

    if (currentTotal + (getsGold ? 1 : 0) > 10) {
      setPhase('mustReturnTokens');
    } else {
      endTurn();
      setPhase('idle');
    }
  }, [selectedCard, currentPlayer, state.tokenPool.gold, reserveCard, endTurn]);

  const handleReserveDeck = useCallback((level: 1 | 2 | 3) => {
    if (phase !== 'idle') return;
    if (currentPlayer.reservedCards.length >= 3 || state.decks[level].length === 0) return;
    const currentTotal = getTotalTokens(currentPlayer);
    const getsGold = state.tokenPool.gold > 0;
    reserveCard(0, level);

    if (currentTotal + (getsGold ? 1 : 0) > 10) {
      setPhase('mustReturnTokens');
    } else {
      endTurn();
      setPhase('idle');
    }
  }, [phase, currentPlayer, state, reserveCard, endTurn]);

  const handleReturnToken = useCallback((tokenType: TokenType) => {
    returnToken(state.currentPlayerIndex, tokenType);
  }, [state.currentPlayerIndex, returnToken]);

  const handleCancel = useCallback(() => {
    setSelectedGems([]);
    setSelectedCard(null);
    setTempPoolDisplay(null);
    setPhase('idle');
  }, []);

  const isReserved = selectedCard ? currentPlayer.reservedCards.some(c => c.id === selectedCard.id) : false;

  const { t, dir } = useLanguage();
  const { soundEffectsEnabled, toggleSoundEffects } = useAudio();

  return (
    <div dir={dir} className="min-h-screen felt-surface p-2 md:p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="font-cinzel text-lg md:text-xl text-primary tracking-widest">SPLENDOR</h1>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground font-body">
            {phase === 'aiThinking' ? (
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                {t('aiThinking')}
              </motion.span>
            ) : (
              <>{t('player')} {state.currentPlayerIndex + 1}{isAIPlayer(state.currentPlayerIndex) ? ' 🤖' : ''}</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Music Control - for all game modes */}
          <MusicControl />
          
          {/* Voice Chat Control - for online games only */}
          {gameMode === 'online' && (
            <VoiceChatControl
              socket={props.socket || null}
              roomId={props.roomId || ''}
              playerId={props.playerId || ''}
              disabled={!props.socket}
            />
          )}
          
          {/* Sound Effects Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleSoundEffects} title={t('soundEffects')}>
            {soundEffectsEnabled ? '🔊' : '🔇'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            ✕
          </Button>
        </div>
      </div>

      {/* Must return tokens banner */}
      <AnimatePresence>
        {phase === 'mustReturnTokens' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-3 text-center"
          >
            <p className="text-sm text-foreground font-body">
              {t('tooManyTokens')} ({getTotalTokens(currentPlayer)} → 10)
            </p>
            <div className="flex gap-2 justify-center mt-2">
              {TOKEN_TYPES.map(type => (
                currentPlayer.tokens[type] > 0 && (
                  <GemToken
                    key={type}
                    type={type}
                    count={currentPlayer.tokens[type]}
                    size="sm"
                    onClick={() => handleReturnToken(type)}
                  />
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nobles */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <span className="text-[10px] text-muted-foreground font-cinzel tracking-wider self-center mr-1">{t('nobles')}</span>
        {state.nobles.map(noble => (
          <NobleDisplay key={noble.id} noble={noble} />
        ))}
      </div>

      {/* Card Grid */}
      <div className="flex-1 space-y-2 mb-3">
        {([3, 2, 1] as const).map(level => (
          <div key={level} className="flex gap-1.5 md:gap-2 items-center">
            {/* Deck */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReserveDeck(level)}
              className="w-[4.5rem] h-24 md:w-20 md:h-28 rounded-lg border-2 flex flex-col items-center justify-center shrink-0 transition-colors hover:border-primary/40 relative overflow-hidden"
              style={{ borderColor: LEVEL_COLORS[level] + '60' }}
            >
              {/* Card back image as deck */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url('${backCardsByLevel[level]}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              {/* Count overlay - no level number */}
              <div className="relative z-10 flex flex-col items-center justify-center p-2 bg-background/70 rounded-md">
                <span className="text-[10px] text-muted-foreground font-bold">
                  {state.decks[level].length}
                </span>
              </div>
            </motion.button>

            {/* Visible cards */}
            {state.visibleCards[level].map((card, i) =>
              card ? (
                <CardDisplay
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  affordable={canPlayerAffordCard(currentPlayer, card)}
                />
              ) : (
                <div key={`e-${level}-${i}`} className="w-[4.5rem] h-24 md:w-20 md:h-28 rounded-lg border border-dashed border-border/30" />
              )
            )}
          </div>
        ))}
      </div>

      {/* Token Bank */}
      <div className="bg-card/50 rounded-xl p-3 mb-3 border border-border/30">
        <div className="flex gap-2 md:gap-3 justify-center items-center flex-wrap">
          {GEM_TYPES.map(gem => {
            const displayCount = tempPoolDisplay ? tempPoolDisplay[gem] : state.tokenPool[gem];
            return (
              <GemToken
                key={gem}
                type={gem}
                count={displayCount}
                onClick={() => handleGemClick(gem)}
                selected={selectedGems.includes(gem)}
                disabled={state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)}
                size="md"
              />
            );
          })}
          <div className="w-px h-8 bg-border/50 mx-1" />
          <GemToken type="gold" count={state.tokenPool.gold} size="md" />
        </div>

        {/* Token selection actions */}
        <AnimatePresence>
          {phase === 'selectingTokens' && selectedGems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex gap-2 justify-center mt-3"
            >
              <Button variant="game" size="sm" onClick={handleConfirmTokens}>
                {t('take')} {selectedGems.length === 2 && selectedGems[0] === selectedGems[1] ? t('takeSame') : selectedGems.length}
              </Button>
              <Button variant="game-secondary" size="sm" onClick={handleCancel}>
                {t('cancel')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player Panels */}
      <div className={`grid gap-2 ${playerCount <= 2 ? 'grid-cols-2' : playerCount === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
        {state.players.map(player => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={player.id === state.currentPlayerIndex}
            isAI={isAIPlayer(player.id)}
            onReservedCardClick={player.id === state.currentPlayerIndex && !isAIPlayer(player.id) ? handleCardClick : undefined}
          />
        ))}
      </div>

      {/* Card Action Modal */}
      <AnimatePresence>
        {phase === 'cardAction' && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm z-50 p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-gradient-to-b from-card to-card/80 border-2 border-primary/30 rounded-2xl p-8 shadow-2xl max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Card Display - Larger and cleaner */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="transform scale-[200%] origin-top">
                  <CardDisplay card={selectedCard} affordable={canPlayerAffordCard(currentPlayer, selectedCard)} />
                </div>
              </motion.div>

              {/* Card Info */}
              <motion.div 
                className="text-center mb-6 space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="inline-block px-4 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-sm font-cinzel text-primary tracking-wider">
                    {selectedCard.points > 0 ? `${selectedCard.points} ${t('pts')}` : 'No Points'}
                  </span>
                </div>
              </motion.div>

              {/* Cost breakdown - prettier */}
              <motion.div 
                className="bg-card/50 rounded-xl p-4 mb-6 border border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs text-muted-foreground text-center mb-3 font-cinzel tracking-wider">{t('cost')}</p>
                <div className="flex justify-center flex-wrap gap-2">
                  {GEM_TYPES.map(gem => {
                    const cost = selectedCard.cost[gem];
                    if (!cost) return null;
                    const have = currentPlayer.tokens[gem] + getPlayerBonuses(currentPlayer)[gem];
                    const canAfford = have >= cost;
                    const gemNameMap: Record<string, string> = {
                      diamond: 'diamond',
                      sapphire: 'sapphire',
                      emerald: 'emerald',
                      ruby: 'ruby',
                      onyx: 'onyx',
                    };
                    return (
                      <motion.div 
                        key={gem} 
                        className="flex flex-col items-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ring-2',
                            canAfford ? 'ring-primary/60 shadow-md shadow-primary/30' : 'ring-muted-foreground/30 opacity-50'
                          )}
                          style={{ backgroundColor: GEM_INFO[gem].darkColor, color: '#fff' }}
                        >
                          {cost}
                        </div>
                        <span className="text-[8px] text-muted-foreground mt-1">{t(gemNameMap[gem] as any)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-col gap-2 space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {canPlayerAffordCard(currentPlayer, selectedCard) && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="game" onClick={handleBuyCard} className="w-full font-cinzel">
                      ✨ {t('purchase')}
                    </Button>
                  </motion.div>
                )}
                {!isReserved && currentPlayer.reservedCards.length < 3 && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="game-secondary" onClick={handleReserveCard} className="w-full font-cinzel">
                      📌 {t('reserve')}
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="ghost" onClick={handleCancel} className="w-full text-muted-foreground font-cinzel">
                    ✕ {t('cancel')}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      <AnimatePresence>
        {state.gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-card border border-primary/30 rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4"
            >
              <span className="text-4xl mb-4 block">👑</span>
              <h2 className="font-cinzel text-2xl text-primary tracking-wider mb-2">
                {t('player')} {(state.winner ?? 0) + 1} {t('wins')}
              </h2>
              <p className="text-muted-foreground font-body text-lg mb-6">
                {t('score')}: {getPlayerScore(state.players[state.winner ?? 0])}
              </p>
              <div className="space-y-2">
                {state.players.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('player')} {p.id + 1}</span>
                    <span className="font-bold text-foreground">{getPlayerScore(p)} {t('pts')}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="game" onClick={resetGame} className="flex-1">
                  {t('playAgain')}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="flex-1">
                  {t('menu')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat - for online games only */}
      {gameMode === 'online' && (
        <Chat
          socket={props.socket || null}
          roomId={props.roomId || ''}
          playerId={props.playerId || ''}
          playerName={props.playerName || ''}
        />
      )}
    </div>
  );
}
