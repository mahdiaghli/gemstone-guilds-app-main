import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGame';
import { useAudio } from '@/hooks/useAudio';
import { GemType, TokenType, Card, GEM_TYPES, TOKEN_TYPES, GEM_INFO, LEVEL_COLORS } from '@/lib/gameData';
import { canPlayerAffordCard, getPlayerScore, getTotalTokens } from '@/lib/gameLogic';
import { getAIAction, AIDifficulty } from '@/lib/aiPlayer';
import { audioManager } from '@/lib/audioManager';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import GemToken from '@/components/game/GemToken';
import CardDisplay from '@/components/game/CardDisplay';
import NobleDisplay from '@/components/game/NobleDisplay';
import PlayerPanel from '@/components/game/PlayerPanel';

type Phase = 'idle' | 'selectingTokens' | 'mustReturnTokens' | 'cardAction' | 'aiThinking';

export default function Game() {
  const [searchParams] = useSearchParams();
  const playerCount = Math.min(4, Math.max(2, parseInt(searchParams.get('players') || '2')));
  const gameMode = searchParams.get('mode') || 'local';
  const aiDifficulty = (searchParams.get('difficulty') || 'medium') as AIDifficulty;
  const navigate = useNavigate();

  const { state, takeTokens, purchaseCard, reserveCard, returnToken, endTurn, resetGame } = useGame(playerCount);

  const isAIPlayer = useCallback((index: number) => {
    if (gameMode !== 'ai') return false;
    return index !== 0; // Player 0 is human, rest are AI
  }, [gameMode]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedGems, setSelectedGems] = useState<GemType[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const currentPlayer = state.players[state.currentPlayerIndex];

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

  // AI turn
  useEffect(() => {
    if (state.gameOver) return;
    if (phase !== 'idle') return;
    if (!isAIPlayer(state.currentPlayerIndex)) return;

    setPhase('aiThinking');
    
    // سریع جواب بدن بدون خسته شدن کاربر - Fast response based on difficulty
    let delayMs = 400;
    if (aiDifficulty === 'easy') {
      delayMs = 200 + Math.random() * 150; // 200-350ms
    } else if (aiDifficulty === 'medium') {
      delayMs = 300 + Math.random() * 150; // 300-450ms
    } else if (aiDifficulty === 'hard') {
      delayMs = 350 + Math.random() * 150; // 350-500ms
    }
    
    const timer = setTimeout(() => {
      const action = getAIAction(state, aiDifficulty);
      switch (action.type) {
        case 'purchaseCard':
          purchaseCard(action.cardId);
          endTurn();
          break;
        case 'takeTokens':
          takeTokens(action.gems);
          endTurn();
          break;
        case 'reserveCard':
          reserveCard(action.cardId);
          endTurn();
          break;
        case 'reserveDeck':
          reserveCard(0, action.level);
          endTurn();
          break;
      }
      setPhase('idle');
    }, delayMs);
    return () => clearTimeout(timer);
  }, [state.currentPlayerIndex, phase, state.gameOver, isAIPlayer, state, aiDifficulty, purchaseCard, takeTokens, reserveCard, endTurn]);

  const handleGemClick = useCallback((gem: GemType) => {
    if (phase !== 'idle' && phase !== 'selectingTokens') return;
    if (state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)) return;

    setSelectedGems(prev => {
      const count = prev.filter(g => g === gem).length;
      if (count === 0) {
        if (prev.length === 2 && prev[0] === prev[1]) return prev;
        if (prev.length >= 3) return prev;
        return [...prev, gem];
      }
      if (count === 1 && prev.length === 1 && state.tokenPool[gem] >= 4) {
        return [gem, gem];
      }
      return prev.filter(g => g !== gem);
    });
  }, [phase, state.tokenPool, selectedGems]);

  const handleConfirmTokens = useCallback(() => {
    const currentTotal = getTotalTokens(currentPlayer);
    const adding = selectedGems.length;
    audioManager.playSound('takeTokens');
    takeTokens(selectedGems);
    setSelectedGems([]);

    if (currentTotal + adding > 10) {
      setPhase('mustReturnTokens');
    } else {
      endTurn();
      setPhase('idle');
    }
  }, [selectedGems, currentPlayer, takeTokens, endTurn]);

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
              className="w-[4.5rem] h-24 md:w-20 md:h-28 rounded-lg border-2 flex flex-col items-center justify-center shrink-0 transition-colors hover:border-primary/40"
              style={{ borderColor: LEVEL_COLORS[level] + '60', backgroundColor: LEVEL_COLORS[level] + '08' }}
            >
              <span className="font-cinzel text-lg font-bold" style={{ color: LEVEL_COLORS[level] }}>
                {level}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {state.decks[level].length}
              </span>
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
          {GEM_TYPES.map(gem => (
            <GemToken
              key={gem}
              type={gem}
              count={state.tokenPool[gem]}
              onClick={() => handleGemClick(gem)}
              selected={selectedGems.includes(gem)}
              disabled={state.tokenPool[gem] <= 0 && !selectedGems.includes(gem)}
              size="md"
            />
          ))}
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
            className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 shadow-2xl max-w-xs w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="transform scale-150">
                  <CardDisplay card={selectedCard} affordable={canPlayerAffordCard(currentPlayer, selectedCard)} />
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="flex justify-center gap-3 mb-4">
                {GEM_TYPES.map(gem => {
                  const cost = selectedCard.cost[gem];
                  if (!cost) return null;
                  return (
                    <div key={gem} className="text-center">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto"
                        style={{ backgroundColor: GEM_INFO[gem].darkColor, color: '#fff' }}
                      >
                        {cost}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{GEM_INFO[gem].name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                {canPlayerAffordCard(currentPlayer, selectedCard) && (
                  <Button variant="game" onClick={handleBuyCard} className="w-full">
                    {t('purchase')}
                  </Button>
                )}
                {!isReserved && currentPlayer.reservedCards.length < 3 && (
                  <Button variant="game-secondary" onClick={handleReserveCard} className="w-full">
                    {t('reserve')}
                  </Button>
                )}
                <Button variant="ghost" onClick={handleCancel} className="w-full text-muted-foreground">
                  {t('cancel')}
                </Button>
              </div>
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
    </div>
  );
}
