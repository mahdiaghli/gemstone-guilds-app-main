import { Card, Noble, Player, GameState, GemType, TokenType, GEM_TYPES, ALL_CARDS, ALL_NOBLES } from './gameData';

function shuffle<T>(array: T[]): T[] {
  const s = [...array];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function emptyTokens(): Record<TokenType, number> {
  return { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
}

export function getPlayerBonuses(player: Player): Record<GemType, number> {
  const b: Record<GemType, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
  for (const c of player.cards) b[c.gemBonus]++;
  return b;
}

export function getPlayerScore(player: Player): number {
  let s = 0;
  for (const c of player.cards) s += c.points;
  for (const n of player.nobles) s += n.points;
  return s;
}

export function getTotalTokens(player: Player): number {
  return Object.values(player.tokens).reduce((a, b) => a + b, 0);
}

export function canPlayerAffordCard(player: Player, card: Card): boolean {
  const bonuses = getPlayerBonuses(player);
  let goldNeeded = 0;
  for (const gem of GEM_TYPES) {
    const cost = card.cost[gem] || 0;
    const have = player.tokens[gem] + bonuses[gem];
    if (have < cost) goldNeeded += cost - have;
  }
  return goldNeeded <= player.tokens.gold;
}

export function initializeGame(playerCount: number): GameState {
  const gemCount = playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7;
  const nobleCount = playerCount + 1;

  const tokenPool: Record<TokenType, number> = {
    diamond: gemCount, sapphire: gemCount, emerald: gemCount,
    ruby: gemCount, onyx: gemCount, gold: 5,
  };

  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: i, tokens: emptyTokens(), cards: [], reservedCards: [], nobles: [],
  }));

  const l1 = shuffle(ALL_CARDS.filter(c => c.level === 1));
  const l2 = shuffle(ALL_CARDS.filter(c => c.level === 2));
  const l3 = shuffle(ALL_CARDS.filter(c => c.level === 3));

  return {
    players,
    currentPlayerIndex: 0,
    tokenPool,
    decks: { 1: l1.slice(4), 2: l2.slice(4), 3: l3.slice(4) },
    visibleCards: {
      1: l1.slice(0, 4) as (Card | null)[],
      2: l2.slice(0, 4) as (Card | null)[],
      3: l3.slice(0, 4) as (Card | null)[],
    },
    nobles: shuffle(ALL_NOBLES).slice(0, nobleCount),
    isLastRound: false,
    lastRoundTriggerIndex: null,
    gameOver: false,
    winner: null,
  };
}

function refillSlot(state: GameState, level: 1 | 2 | 3, index: number): GameState {
  const newDecks = { ...state.decks, [level]: [...state.decks[level]] };
  const newVisible = { ...state.visibleCards, [level]: [...state.visibleCards[level]] };

  if (newDecks[level].length > 0) {
    newVisible[level][index] = newDecks[level].shift()!;
  } else {
    newVisible[level][index] = null;
  }

  return { ...state, decks: newDecks, visibleCards: newVisible };
}

export function performTakeTokens(state: GameState, gems: GemType[]): GameState {
  const newPool = { ...state.tokenPool };
  const newPlayers = state.players.map(p => ({ ...p }));
  const player = { ...newPlayers[state.currentPlayerIndex], tokens: { ...newPlayers[state.currentPlayerIndex].tokens } };
  const availableColors = GEM_TYPES.filter((g) => newPool[g] > 0);

  if (gems.length === 2 && gems[0] === gems[1]) {
    if (newPool[gems[0]] < 4) return state;
    newPool[gems[0]] -= 2;
    player.tokens[gems[0]] += 2;
  } else {
    const unique = new Set(gems);
    if (unique.size !== gems.length) return state;
    const expectedCount = Math.min(3, availableColors.length);
    if (gems.length !== expectedCount) return state;
    for (const g of gems) {
      if (newPool[g] <= 0) return state;
      newPool[g]--;
      player.tokens[g]++;
    }
  }

  newPlayers[state.currentPlayerIndex] = player;
  return { ...state, players: newPlayers, tokenPool: newPool };
}

export function performPurchaseCard(state: GameState, cardId: string | number): GameState {
  const newPlayers = state.players.map(p => ({ ...p }));
  const player = { ...newPlayers[state.currentPlayerIndex] };
  player.tokens = { ...player.tokens };
  player.cards = [...player.cards];
  player.reservedCards = [...player.reservedCards];

  // Find card
  let card: Card | null = null;
  let source: 'visible' | 'reserved' = 'visible';
  let level: 1 | 2 | 3 = 1;
  let idx = -1;

  for (const lvl of [1, 2, 3] as const) {
    const i = state.visibleCards[lvl].findIndex(c => c?.id === cardId);
    if (i !== -1) { card = state.visibleCards[lvl][i]!; source = 'visible'; level = lvl; idx = i; break; }
  }
  if (!card) {
    const i = player.reservedCards.findIndex(c => c.id === cardId);
    if (i !== -1) { card = player.reservedCards[i]; source = 'reserved'; idx = i; }
  }
  if (!card || !canPlayerAffordCard(player, card)) return state;

  // Pay
  const bonuses = getPlayerBonuses(player);
  const newPool = { ...state.tokenPool };
  let goldUsed = 0;
  for (const gem of GEM_TYPES) {
    const cost = card.cost[gem] || 0;
    const remaining = Math.max(0, cost - bonuses[gem]);
    const fromTokens = Math.min(remaining, player.tokens[gem]);
    player.tokens[gem] -= fromTokens;
    newPool[gem] += fromTokens;
    goldUsed += remaining - fromTokens;
  }
  player.tokens.gold -= goldUsed;
  newPool.gold += goldUsed;

  player.cards.push(card);
  if (source === 'reserved') {
    player.reservedCards = player.reservedCards.filter((_, i) => i !== idx);
  }

  newPlayers[state.currentPlayerIndex] = player;
  let newState = { ...state, players: newPlayers, tokenPool: newPool };
  if (source === 'visible') newState = refillSlot(newState, level, idx);
  return newState;
}

export function performReserveCard(state: GameState, cardId: string | number, fromDeckLevel?: 1 | 2 | 3): GameState {
  const newPlayers = state.players.map(p => ({ ...p }));
  const player = { ...newPlayers[state.currentPlayerIndex] };
  player.tokens = { ...player.tokens };
  player.reservedCards = [...player.reservedCards];

  if (player.reservedCards.length >= 3) return state;

  let card: Card | null = null;
  let newState = { ...state };

  if (fromDeckLevel) {
    const newDecks = { ...state.decks, [fromDeckLevel]: [...state.decks[fromDeckLevel]] };
    if (newDecks[fromDeckLevel].length === 0) return state;
    card = newDecks[fromDeckLevel].shift()!;
    newState.decks = newDecks;
  } else {
    for (const lvl of [1, 2, 3] as const) {
      const i = state.visibleCards[lvl].findIndex(c => c?.id === cardId);
      if (i !== -1) {
        card = state.visibleCards[lvl][i]!;
        newState = refillSlot(newState, lvl, i);
        break;
      }
    }
  }

  if (!card) return state;

  player.reservedCards.push(card);
  const newPool = { ...newState.tokenPool };
  if (newPool.gold > 0) { newPool.gold--; player.tokens.gold++; }

  newPlayers[state.currentPlayerIndex] = player;
  return { ...newState, players: newPlayers, tokenPool: newPool };
}

export function performReturnToken(state: GameState, playerIndex: number, tokenType: TokenType): GameState {
  const newPlayers = state.players.map(p => ({ ...p }));
  const player = { ...newPlayers[playerIndex], tokens: { ...newPlayers[playerIndex].tokens } };
  if (player.tokens[tokenType] <= 0) return state;

  const newPool = { ...state.tokenPool };
  player.tokens[tokenType]--;
  newPool[tokenType]++;
  newPlayers[playerIndex] = player;
  return { ...state, players: newPlayers, tokenPool: newPool };
}

function checkNobles(state: GameState): GameState {
  const newPlayers = state.players.map(p => ({ ...p }));
  const player = { ...newPlayers[state.currentPlayerIndex] };
  player.nobles = [...player.nobles];
  const bonuses = getPlayerBonuses(player);
  const newNobles = [...state.nobles];

  for (let i = 0; i < newNobles.length; i++) {
    const noble = newNobles[i];
    let ok = true;
    for (const gem of GEM_TYPES) {
      if ((noble.requirements[gem] || 0) > bonuses[gem]) { ok = false; break; }
    }
    if (ok) {
      player.nobles.push(noble);
      newNobles.splice(i, 1);
      break;
    }
  }

  newPlayers[state.currentPlayerIndex] = player;
  return { ...state, players: newPlayers, nobles: newNobles };
}

export function advanceTurn(state: GameState, targetScore = 15): GameState {
  let s = checkNobles(state);
  const score = getPlayerScore(s.players[s.currentPlayerIndex]);

  if (score >= targetScore && !s.isLastRound) {
    s = {
      ...s,
      isLastRound: true,
      lastRoundTriggerIndex: s.currentPlayerIndex,
    };
  }

  const next = (s.currentPlayerIndex + 1) % s.players.length;

  if (
    s.isLastRound &&
    s.lastRoundTriggerIndex !== null &&
    next === s.lastRoundTriggerIndex
  ) {
    let maxScore = -1, winnerId = 0;
    for (const p of s.players) {
      const ps = getPlayerScore(p);
      if (ps > maxScore || (ps === maxScore && p.cards.length < s.players[winnerId].cards.length)) {
        maxScore = ps;
        winnerId = p.id;
      }
    }
    return {
      ...s,
      gameOver: true,
      winner: winnerId,
      currentPlayerIndex: next,
    };
  }

  return { ...s, currentPlayerIndex: next };
}
