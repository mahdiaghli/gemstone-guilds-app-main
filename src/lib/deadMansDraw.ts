export type DeadMansDrawSuit =
  | "astrolabe"
  | "pistol"
  | "dagger"
  | "carpet"
  | "snake"
  | "coin"
  | "horseshoe"
  | "map"
  | "chest"
  | "key";

export type DeadMansDrawRing =
  | "le-corsaire"
  | "madam-margot"
  | "ghallegar"
  | "scurvy-pete"
  | "zahara"
  | "gunnie"
  | "black-bonnie"
  | "sir-lovesword"
  | "seamus-quinn";

export type DeadMansDrawCard = {
  id: string;
  suit: DeadMansDrawSuit;
  value: number;
};

export type DeadMansDrawPendingEffect =
  | {
      kind: "astrolabe";
      sourceCardId: string;
      peekCards: DeadMansDrawCard[];
    }
  | {
      kind: "pistol";
      sourceCardId: string;
      options: DeadMansDrawTargetOption[];
    }
  | {
      kind: "dagger";
      sourceCardId: string;
      options: DeadMansDrawTargetOption[];
    }
  | {
      kind: "horseshoe";
      sourceCardId: string;
      options: DeadMansDrawCard[];
      remaining: number;
    }
  | {
      kind: "map";
      sourceCardId: string;
      options: DeadMansDrawCard[];
      chooseAny: boolean;
    }
  | {
      kind: "misfire";
      sourceCardId: string;
      options: DeadMansDrawCard[];
    };

export type DeadMansDrawPowerTargetSelection = {
  playerIndex: number;
  power: "madam-margot";
  options: number[];
};

export type DeadMansDrawTargetOption = {
  playerIndex: number;
  cards: DeadMansDrawCard[];
};

export type DeadMansDrawPlayer = {
  id: number;
  collected: Record<DeadMansDrawSuit, DeadMansDrawCard[]>;
  ringOptions: DeadMansDrawRing[];
  ring: DeadMansDrawRing | null;
  markedOpponentIndex: number | null;
};

export type DeadMansDrawState = {
  players: DeadMansDrawPlayer[];
  drawPile: DeadMansDrawCard[];
  discardPile: DeadMansDrawCard[];
  treasureArea: DeadMansDrawCard[];
  currentPlayerIndex: number;
  pendingEffect: DeadMansDrawPendingEffect | null;
  forcedRevealRemaining: number;
  ringSelectionIndex: number | null;
  powerTargetSelection: DeadMansDrawPowerTargetSelection | null;
  protectedCardIds: string[];
  protectedDrawRemaining: number;
  lastAction: string;
  turnEndedBy: "collect" | "bust" | null;
  gameOver: boolean;
  winnerIndices: number[];
};

export const DEAD_MANS_DRAW_SUITS: DeadMansDrawSuit[] = [
  "astrolabe",
  "pistol",
  "dagger",
  "carpet",
  "snake",
  "coin",
  "horseshoe",
  "map",
  "chest",
  "key",
];

export const DEAD_MANS_DRAW_RING_CONFIG: Array<{
  id: DeadMansDrawRing;
  name: string;
  shortName: string;
  description: string;
}> = [
  {
    id: "le-corsaire",
    name: "Le Corsaire",
    shortName: "Corsaire",
    description: "Plunder: Chest + Key bonus cards come from the top of opponents' suit stacks.",
  },
  {
    id: "madam-margot",
    name: "Madam Margot",
    shortName: "Margot",
    description: "Davy Jones's Locker: choose an opponent; when they bust, you bank their busted cards.",
  },
  {
    id: "ghallegar",
    name: "Ghallegar",
    shortName: "Ghallegar",
    description: "Miser: the Anchor card and the next card it draws stay safe even if you bust.",
  },
  {
    id: "scurvy-pete",
    name: "Scurvy Pete",
    shortName: "Pete",
    description: "Misfire: opponents who use Cannon must discard one of their own top cards too.",
  },
  {
    id: "zahara",
    name: "Zahara",
    shortName: "Zahara",
    description: "Mystic Sight: Eye reveals the next 3 cards before you decide whether to draw.",
  },
  {
    id: "gunnie",
    name: "Gunnie",
    shortName: "Gunnie",
    description: "Master Gunner: Cannon discards an entire target suit stack.",
  },
  {
    id: "black-bonnie",
    name: "Black Bonnie",
    shortName: "Bonnie",
    description: "Parry: opponents who use Sword first draw a Kraken from your bank.",
  },
  {
    id: "sir-lovesword",
    name: "Sir Lovesword",
    shortName: "Lovesword",
    description: "Casanova: Coins drawn from the draw pile are banked immediately.",
  },
  {
    id: "seamus-quinn",
    name: "Seamus Quinn",
    shortName: "Seamus",
    description: "Beastmaster: opponents must draw 4 extra cards from Kraken instead of 2.",
  },
];

export const DEAD_MANS_DRAW_SUIT_CONFIG: Record<
  DeadMansDrawSuit,
  { name: string; icon: string; color: string; description: string }
> = {
  astrolabe: {
    name: "Astrolabe",
    icon: "✦",
    color: "#38bdf8",
    description: "Peek, then choose to reveal the top card or collect now.",
  },
  pistol: {
    name: "Pistol",
    icon: "✹",
    color: "#f97316",
    description: "Blast the top card from another player's collection.",
  },
  dagger: {
    name: "Dagger",
    icon: "✧",
    color: "#f43f5e",
    description: "Steal the top card from another player into your treasure area.",
  },
  carpet: {
    name: "Carpet",
    icon: "▥",
    color: "#a855f7",
    description: "On a bust, cards revealed before the last Carpet are saved.",
  },
  snake: {
    name: "Snake",
    icon: "≈",
    color: "#22c55e",
    description: "Force extra reveals.",
  },
  coin: {
    name: "Coin",
    icon: "◉",
    color: "#facc15",
    description: "Pure treasure, worth 4 to 9 points.",
  },
  horseshoe: {
    name: "Horseshoe",
    icon: "∩",
    color: "#f59e0b",
    description: "Play the top card from your own collection into the treasure area.",
  },
  map: {
    name: "Map",
    icon: "⌘",
    color: "#14b8a6",
    description: "Choose 1 card from the burn pile and play it.",
  },
  chest: {
    name: "Chest",
    icon: "▣",
    color: "#60a5fa",
    description: "Pair with a Key to claim bonus loot when you collect.",
  },
  key: {
    name: "Key",
    icon: "⌁",
    color: "#eab308",
    description: "Pair with a Chest to claim bonus loot when you collect.",
  },
};

function shuffleCards<T>(cards: T[]) {
  const deck = [...cards];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function createEmptyCollected() {
  return DEAD_MANS_DRAW_SUITS.reduce((acc, suit) => {
    acc[suit] = [];
    return acc;
  }, {} as Record<DeadMansDrawSuit, DeadMansDrawCard[]>);
}

export function createDeadMansDrawDeck() {
  const allCards: DeadMansDrawCard[] = [];

  for (const suit of DEAD_MANS_DRAW_SUITS) {
    for (let offset = 0; offset < 6; offset += 1) {
      const value = suit === "coin" ? 4 + offset : 2 + offset;
      allCards.push({
        id: `${suit}-${value}-${offset}`,
        suit,
        value,
      });
    }
  }

  const startingDiscard: DeadMansDrawCard[] = [];
  const drawCandidates: DeadMansDrawCard[] = [];

  for (const card of allCards) {
    const isStarter = card.suit === "coin" ? card.value === 4 : card.value === 2;
    if (isStarter) {
      startingDiscard.push(card);
    } else {
      drawCandidates.push(card);
    }
  }

  return {
    drawPile: shuffleCards(drawCandidates),
    discardPile: shuffleCards(startingDiscard),
  };
}

function assignRingChoices(playerCount: number) {
  const rings = shuffleCards(DEAD_MANS_DRAW_RING_CONFIG.map((ring) => ring.id));
  return Array.from({ length: playerCount }, (_, index) => rings.slice(index * 2, index * 2 + 2));
}

export function initializeDeadMansDrawGame(playerCount: number, useRings = true): DeadMansDrawState {
  const { drawPile, discardPile } = createDeadMansDrawDeck();
  const ringChoices = assignRingChoices(playerCount);

  return {
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: index,
      collected: createEmptyCollected(),
      ringOptions: useRings ? ringChoices[index] ?? [] : [],
      ring: null,
      markedOpponentIndex: null,
    })),
    drawPile,
    discardPile,
    treasureArea: [],
    currentPlayerIndex: 0,
    pendingEffect: null,
    forcedRevealRemaining: 0,
    ringSelectionIndex: useRings ? 0 : null,
    powerTargetSelection: null,
    protectedCardIds: [],
    protectedDrawRemaining: 0,
    lastAction: useRings
      ? "Each player chooses 1 of 2 face-up ring powers."
      : "Choose whether to reveal or collect.",
    turnEndedBy: null,
    gameOver: false,
    winnerIndices: [],
  };
}

export function cloneDeadMansDrawState(state: DeadMansDrawState): DeadMansDrawState {
  return JSON.parse(JSON.stringify(state));
}

export function sortCardsAscending(cards: DeadMansDrawCard[]) {
  return [...cards].sort((left, right) => left.value - right.value || left.id.localeCompare(right.id));
}

export function getPlayerCardCount(player: DeadMansDrawPlayer) {
  return DEAD_MANS_DRAW_SUITS.reduce((total, suit) => total + player.collected[suit].length, 0);
}

export function getDeadMansDrawScore(player: DeadMansDrawPlayer) {
  let score = 0;
  for (const suit of DEAD_MANS_DRAW_SUITS) {
    const highestCard = player.collected[suit][player.collected[suit].length - 1];
    if (highestCard) {
      score += highestCard.value;
    }
  }
  return score;
}

export function isCollectBlockedBySnakeAstrolabe(state: DeadMansDrawState) {
  const nextCard = state.drawPile[state.drawPile.length - 1];
  return state.treasureArea.some((card) => card.suit === "snake") && nextCard?.suit === "astrolabe";
}

export function getDeadMansDrawWinners(state: DeadMansDrawState) {
  const scored = state.players.map((player, index) => ({
    index,
    score: getDeadMansDrawScore(player),
    cardCount: getPlayerCardCount(player),
  }));
  const highestScore = Math.max(...scored.map((entry) => entry.score));
  const scoreTied = scored.filter((entry) => entry.score === highestScore);
  if (scoreTied.length === 1) {
    return scoreTied.map((entry) => entry.index);
  }
  const bestCardCount = Math.max(...scoreTied.map((entry) => entry.cardCount));
  return scoreTied.filter((entry) => entry.cardCount === bestCardCount).map((entry) => entry.index);
}

function addCardsToCollected(player: DeadMansDrawPlayer, cards: DeadMansDrawCard[]) {
  for (const card of cards) {
    player.collected[card.suit] = sortCardsAscending([...player.collected[card.suit], card]);
  }
}

function getTopCollectedCard(player: DeadMansDrawPlayer, suit: DeadMansDrawSuit) {
  const stack = player.collected[suit];
  return stack[stack.length - 1] ?? null;
}

function removeTopCollectedCard(player: DeadMansDrawPlayer, suit: DeadMansDrawSuit) {
  const stack = player.collected[suit];
  if (!stack.length) return null;
  const nextCard = stack[stack.length - 1];
  player.collected[suit] = stack.slice(0, -1);
  return nextCard;
}

function removeCollectedStack(player: DeadMansDrawPlayer, suit: DeadMansDrawSuit) {
  const stack = player.collected[suit];
  if (!stack.length) return [];
  player.collected[suit] = [];
  return stack;
}

function getTargetOptions(state: DeadMansDrawState, currentPlayerIndex: number) {
  return state.players
    .map((player, playerIndex) => {
      if (playerIndex === currentPlayerIndex) return null;
      const cards = DEAD_MANS_DRAW_SUITS
        .map((suit) => getTopCollectedCard(player, suit))
        .filter((card): card is DeadMansDrawCard => Boolean(card));
      if (!cards.length) return null;
      return { playerIndex, cards };
    })
    .filter((entry): entry is DeadMansDrawTargetOption => Boolean(entry));
}

function getOwnPlayableOptions(player: DeadMansDrawPlayer) {
  return DEAD_MANS_DRAW_SUITS
    .map((suit) => getTopCollectedCard(player, suit))
    .filter((card): card is DeadMansDrawCard => Boolean(card));
}

function popTopCard(drawPile: DeadMansDrawCard[]) {
  return drawPile.pop() ?? null;
}

function findPowerOwner(
  state: DeadMansDrawState,
  power: DeadMansDrawRing,
  currentPlayerIndex: number,
) {
  return state.players.findIndex((player, index) => index !== currentPlayerIndex && player.ring === power);
}

function finalizeTurn(state: DeadMansDrawState, reason: "collect" | "bust") {
  state.pendingEffect = null;
  state.forcedRevealRemaining = 0;
  state.powerTargetSelection = null;
  state.protectedCardIds = [];
  state.protectedDrawRemaining = 0;
  state.turnEndedBy = reason;

  if (state.drawPile.length === 0) {
    state.gameOver = true;
    state.winnerIndices = getDeadMansDrawWinners(state);
    return state;
  }

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.lastAction = reason === "collect"
    ? `Player ${state.currentPlayerIndex + 1}'s turn begins.`
    : `Player ${state.currentPlayerIndex + 1} takes over after the bust.`;
  return state;
}

function continueForcedReveals(state: DeadMansDrawState) {
  if (!state.drawPile.length) {
    state.forcedRevealRemaining = 0;
  }
  return state;
}

function plunderTopCardsFromOpponents(state: DeadMansDrawState, currentPlayerIndex: number, count: number) {
  const available = state.players.flatMap((player, playerIndex) => {
    if (playerIndex === currentPlayerIndex) return [] as Array<{ playerIndex: number; suit: DeadMansDrawSuit; card: DeadMansDrawCard }>;
    return DEAD_MANS_DRAW_SUITS
      .map((suit) => ({ playerIndex, suit, card: getTopCollectedCard(player, suit) }))
      .filter((entry): entry is { playerIndex: number; suit: DeadMansDrawSuit; card: DeadMansDrawCard } => Boolean(entry.card));
  });

  const chosen = [...available]
    .sort((left, right) => right.card.value - left.card.value || left.playerIndex - right.playerIndex)
    .slice(0, count);

  const result: DeadMansDrawCard[] = [];
  for (const entry of chosen) {
    const removed = removeTopCollectedCard(state.players[entry.playerIndex], entry.suit);
    if (removed) result.push(removed);
  }
  return result;
}

function handleBust(state: DeadMansDrawState) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const lastCarpetIndex = [...state.treasureArea]
    .slice(0, -1)
    .map((card, index) => ({ card, index }))
    .filter((entry) => entry.card.suit === "carpet")
    .map((entry) => entry.index)
    .pop();

  const safeFromCarpet = typeof lastCarpetIndex === "number" && lastCarpetIndex > 0
    ? state.treasureArea.slice(0, lastCarpetIndex).filter((card) => card.suit !== "carpet")
    : [];
  const safeFromMiser = state.treasureArea.filter((card) => state.protectedCardIds.includes(card.id));
  const safeCardsMap = new Map<string, DeadMansDrawCard>();
  [...safeFromCarpet, ...safeFromMiser].forEach((card) => safeCardsMap.set(card.id, card));
  const safeCards = [...safeCardsMap.values()];

  if (safeCards.length) {
    addCardsToCollected(currentPlayer, safeCards);
  }

  const safeIds = new Set(safeCards.map((card) => card.id));
  const burned = state.treasureArea.filter((card) => !safeIds.has(card.id));
  const madamOwnerIndex = state.players.findIndex((player, index) =>
    index !== state.currentPlayerIndex
    && player.ring === "madam-margot"
    && player.markedOpponentIndex === state.currentPlayerIndex,
  );

  if (madamOwnerIndex !== -1 && burned.length) {
    addCardsToCollected(state.players[madamOwnerIndex], burned);
    state.lastAction = "Bust! Madam Margot banked the busted treasure.";
  } else {
    state.discardPile = shuffleCards([...state.discardPile, ...burned]);
    state.lastAction = safeCards.length
      ? "Bust! The Carpet saved part of the treasure."
      : "Bust! Everything goes to the burn pile.";
  }

  state.treasureArea = [];
  state.pendingEffect = null;
  state.forcedRevealRemaining = 0;
  state.protectedCardIds = [];
  state.protectedDrawRemaining = 0;

  return finalizeTurn(state, "bust");
}

function revealResolvedCard(
  state: DeadMansDrawState,
  card: DeadMansDrawCard,
  source: "draw" | "effect" = "draw",
) {
  state.turnEndedBy = null;
  if (state.forcedRevealRemaining > 0) {
    state.forcedRevealRemaining -= 1;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  if (source === "draw" && currentPlayer.ring === "sir-lovesword" && card.suit === "coin") {
    addCardsToCollected(currentPlayer, [card]);
    state.lastAction = "Sir Lovesword banked a Coin immediately from the draw pile.";
    return continueForcedReveals(state);
  }

  state.treasureArea.push(card);

  if (source === "draw" && state.protectedDrawRemaining > 0) {
    state.protectedCardIds = [...new Set([...state.protectedCardIds, card.id])];
    state.protectedDrawRemaining -= 1;
  }

  const duplicateExists = state.treasureArea
    .slice(0, -1)
    .some((revealedCard) => revealedCard.suit === card.suit);

  if (duplicateExists) {
    return handleBust(state);
  }

  switch (card.suit) {
    case "snake": {
      const bonusDraws = findPowerOwner(state, "seamus-quinn", state.currentPlayerIndex) !== -1 ? 4 : 2;
      state.forcedRevealRemaining += bonusDraws;
      state.lastAction = `Snake revealed: draw ${bonusDraws} more card(s) before you can collect.`;
      return continueForcedReveals(state);
    }
    case "astrolabe": {
      const peekCount = currentPlayer.ring === "zahara" ? 3 : 1;
      const peekCards = state.drawPile.slice(-peekCount).reverse();
      if (!peekCards.length) {
        state.lastAction = "Astrolabe found nothing to inspect.";
        return continueForcedReveals(state);
      }
      state.pendingEffect = {
        kind: "astrolabe",
        sourceCardId: card.id,
        peekCards,
      };
      state.lastAction = "Astrolabe: inspect the top card(s), then reveal or collect.";
      return state;
    }
    case "pistol": {
      const options = getTargetOptions(state, state.currentPlayerIndex);
      if (!options.length) {
        state.lastAction = "Pistol found no target.";
        return continueForcedReveals(state);
      }
      state.pendingEffect = {
        kind: "pistol",
        sourceCardId: card.id,
        options,
      };
      state.lastAction = "Pistol: choose a card to burn from another player.";
      return state;
    }
    case "dagger": {
      const options = getTargetOptions(state, state.currentPlayerIndex);
      if (!options.length) {
        state.lastAction = "Dagger found no legal target.";
        return continueForcedReveals(state);
      }
      state.pendingEffect = {
        kind: "dagger",
        sourceCardId: card.id,
        options,
      };
      state.lastAction = "Dagger: steal a card into the treasure area.";
      return state;
    }
    case "horseshoe": {
      const options = getOwnPlayableOptions(currentPlayer);
      if (!options.length) {
        state.lastAction = "Horseshoe fizzled because there are no cards in your stash.";
        return continueForcedReveals(state);
      }
      state.pendingEffect = {
        kind: "horseshoe",
        sourceCardId: card.id,
        options,
        remaining: 1,
      };
      state.lastAction = "Horseshoe: play a card from your own stash.";
      return state;
    }
    case "map": {
      if (!state.discardPile.length) {
        state.lastAction = "Map found no burned treasure to recover.";
        return continueForcedReveals(state);
      }
      const options = shuffleCards(state.discardPile).slice(0, Math.min(3, state.discardPile.length));
      state.pendingEffect = {
        kind: "map",
        sourceCardId: card.id,
        options,
        chooseAny: false,
      };
      state.lastAction = "Map: choose 1 of 3 burned cards to play.";
      return state;
    }
    case "carpet": {
      state.lastAction = "Carpet added to the treasure area.";
      return continueForcedReveals(state);
    }
    default: {
      state.lastAction = `${DEAD_MANS_DRAW_SUIT_CONFIG[card.suit].name} added to the treasure area.`;
      return continueForcedReveals(state);
    }
  }
}

export function revealCard(state: DeadMansDrawState) {
  const nextState = cloneDeadMansDrawState(state);
  if (
    nextState.gameOver
    || nextState.pendingEffect
    || nextState.ringSelectionIndex !== null
    || nextState.powerTargetSelection
    || !nextState.drawPile.length
  ) {
    return nextState;
  }
  const card = popTopCard(nextState.drawPile);
  if (!card) return nextState;
  return revealResolvedCard(nextState, card, "draw");
}

export function collectTreasure(state: DeadMansDrawState) {
  const nextState = cloneDeadMansDrawState(state);
  if (
    nextState.gameOver
    || nextState.pendingEffect
    || nextState.ringSelectionIndex !== null
    || nextState.powerTargetSelection
    || !nextState.treasureArea.length
    || isCollectBlockedBySnakeAstrolabe(nextState)
  ) {
    return nextState;
  }

  const currentPlayer = nextState.players[nextState.currentPlayerIndex];
  const collectedCards = [...nextState.treasureArea];
  addCardsToCollected(currentPlayer, collectedCards);

  const hasChest = collectedCards.some((card) => card.suit === "chest");
  const hasKey = collectedCards.some((card) => card.suit === "key");
  if (hasChest && hasKey) {
    const bonusCount = collectedCards.length;
    let bonusCards: DeadMansDrawCard[] = [];

    if (currentPlayer.ring === "le-corsaire") {
      bonusCards = plunderTopCardsFromOpponents(nextState, nextState.currentPlayerIndex, bonusCount);
      if (bonusCards.length) {
        addCardsToCollected(currentPlayer, bonusCards);
        nextState.lastAction = `Collected treasure and plundered ${bonusCards.length} bonus card(s) from opponents.`;
      } else {
        nextState.lastAction = "Collected treasure, but there was no plunder available.";
      }
    } else if (nextState.discardPile.length) {
      const shuffledDiscard = shuffleCards(nextState.discardPile);
      bonusCards = shuffledDiscard.slice(0, Math.min(bonusCount, shuffledDiscard.length));
      const bonusIds = new Set(bonusCards.map((card) => card.id));
      nextState.discardPile = shuffledDiscard.filter((card) => !bonusIds.has(card.id));
      addCardsToCollected(currentPlayer, bonusCards);
      nextState.lastAction = `Collected treasure and recovered ${bonusCards.length} bonus card(s).`;
    } else {
      nextState.lastAction = "Collected the revealed treasure.";
    }
  } else {
    nextState.lastAction = "Collected the revealed treasure.";
  }

  nextState.treasureArea = [];
  return finalizeTurn(nextState, "collect");
}

export function resolveAstrolabeChoice(state: DeadMansDrawState, revealPeekedCard: boolean) {
  const nextState = cloneDeadMansDrawState(state);
  if (nextState.pendingEffect?.kind !== "astrolabe") return nextState;
  nextState.pendingEffect = null;
  if (!revealPeekedCard) {
    nextState.lastAction = "Astrolabe ended the turn with a safe collect.";
    return collectTreasure(nextState);
  }
  const card = popTopCard(nextState.drawPile);
  if (!card) return nextState;
  nextState.lastAction = "Astrolabe chose to reveal the top card.";
  return revealResolvedCard(nextState, card, "draw");
}

export function resolvePistolChoice(
  state: DeadMansDrawState,
  targetPlayerIndex: number,
  suit: DeadMansDrawSuit,
) {
  const nextState = cloneDeadMansDrawState(state);
  if (nextState.pendingEffect?.kind !== "pistol") return nextState;
  const currentPlayer = nextState.players[nextState.currentPlayerIndex];
  const targetPlayer = nextState.players[targetPlayerIndex];
  if (!targetPlayer) return nextState;

  const removedCards = currentPlayer.ring === "gunnie"
    ? removeCollectedStack(targetPlayer, suit)
    : (() => {
        const removed = removeTopCollectedCard(targetPlayer, suit);
        return removed ? [removed] : [];
      })();

  nextState.pendingEffect = null;
  if (!removedCards.length) return continueForcedReveals(nextState);

  nextState.discardPile = shuffleCards([...nextState.discardPile, ...removedCards]);
  nextState.lastAction = currentPlayer.ring === "gunnie"
    ? `Pistol blasted the entire ${DEAD_MANS_DRAW_SUIT_CONFIG[suit].name} stack.`
    : `Pistol burned ${DEAD_MANS_DRAW_SUIT_CONFIG[suit].name}.`;

  const scurvyPeteIndex = findPowerOwner(nextState, "scurvy-pete", nextState.currentPlayerIndex);
  const misfireOptions = getOwnPlayableOptions(currentPlayer);
  if (scurvyPeteIndex !== -1 && misfireOptions.length) {
    nextState.pendingEffect = {
      kind: "misfire",
      sourceCardId: `${nextState.pendingEffect?.kind ?? "pistol"}-${Date.now()}`,
      options: misfireOptions,
    };
    nextState.lastAction = "Scurvy Pete triggered Misfire: discard one of your own top cards.";
    return nextState;
  }

  return continueForcedReveals(nextState);
}

function triggerBlackBonnieParry(state: DeadMansDrawState) {
  const bonnieIndex = findPowerOwner(state, "black-bonnie", state.currentPlayerIndex);
  if (bonnieIndex === -1) return state;

  const bonniePlayer = state.players[bonnieIndex];
  const krakenCard = removeTopCollectedCard(bonniePlayer, "snake");
  if (!krakenCard) return state;

  state.treasureArea.push(krakenCard);
  const duplicateExists = state.treasureArea
    .slice(0, -1)
    .some((revealedCard) => revealedCard.suit === krakenCard.suit);
  if (duplicateExists) {
    return handleBust(state);
  }

  state.lastAction = "Black Bonnie forced a Kraken into the treasure area before the Sword strike.";
  return state;
}

export function resolveDaggerChoice(
  state: DeadMansDrawState,
  targetPlayerIndex: number,
  suit: DeadMansDrawSuit,
) {
  const nextState = cloneDeadMansDrawState(state);
  if (nextState.pendingEffect?.kind !== "dagger") return nextState;
  nextState.pendingEffect = null;

  const afterParry = triggerBlackBonnieParry(nextState);
  if (afterParry.turnEndedBy === "bust" || afterParry.gameOver) {
    return afterParry;
  }

  const targetPlayer = afterParry.players[targetPlayerIndex];
  if (!targetPlayer) return afterParry;
  const stolenCard = removeTopCollectedCard(targetPlayer, suit);
  if (!stolenCard) return continueForcedReveals(afterParry);

  afterParry.lastAction = `Dagger stole ${DEAD_MANS_DRAW_SUIT_CONFIG[suit].name}.`;
  return revealResolvedCard(afterParry, stolenCard, "effect");
}

export function resolveHorseshoeChoice(state: DeadMansDrawState, suit: DeadMansDrawSuit) {
  const nextState = cloneDeadMansDrawState(state);
  if (nextState.pendingEffect?.kind !== "horseshoe") return nextState;
  const currentPlayer = nextState.players[nextState.currentPlayerIndex];
  const horseshoeEffect = nextState.pendingEffect;
  if (currentPlayer.ring === "ghallegar") {
    nextState.protectedCardIds = [...new Set([...nextState.protectedCardIds, horseshoeEffect.sourceCardId])];
  }
  const playedCard = removeTopCollectedCard(currentPlayer, suit);
  nextState.pendingEffect = null;
  if (!playedCard) return continueForcedReveals(nextState);
  if (currentPlayer.ring === "ghallegar") {
    nextState.protectedCardIds = [...new Set([...nextState.protectedCardIds, playedCard.id])];
  }

  nextState.lastAction = `Horseshoe played ${DEAD_MANS_DRAW_SUIT_CONFIG[suit].name} from the stash.`;
  const revealedState = revealResolvedCard(nextState, playedCard, "effect");
  if (revealedState.gameOver || revealedState.pendingEffect || revealedState.treasureArea.length === 0) {
    return revealedState;
  }

  if (horseshoeEffect.remaining > 1) {
    const options = getOwnPlayableOptions(revealedState.players[revealedState.currentPlayerIndex]);
    if (options.length) {
      revealedState.pendingEffect = {
        ...horseshoeEffect,
        options,
        remaining: horseshoeEffect.remaining - 1,
      };
      revealedState.lastAction = "Trickster Horseshoe: choose one more card from your stash.";
    }
  }

  return revealedState.pendingEffect ? revealedState : continueForcedReveals(revealedState);
}

export function resolveMapChoice(state: DeadMansDrawState, cardId: string) {
  const nextState = cloneDeadMansDrawState(state);
  if (nextState.pendingEffect?.kind !== "map") return nextState;
  const mapEffect = nextState.pendingEffect;
  const selectedCard = mapEffect.options.find((card) => card.id === cardId);
  nextState.pendingEffect = null;
  if (!selectedCard) return continueForcedReveals(nextState);
  nextState.discardPile = nextState.discardPile.filter((card) => card.id !== cardId);
  nextState.lastAction = `Map recovered ${DEAD_MANS_DRAW_SUIT_CONFIG[selectedCard.suit].name}.`;
  return revealResolvedCard(nextState, selectedCard, "effect");
}

export function resolveMisfireChoice(state: DeadMansDrawState, suit: DeadMansDrawSuit) {
  const nextState = cloneDeadMansDrawState(state);
  if (nextState.pendingEffect?.kind !== "misfire") return nextState;
  const currentPlayer = nextState.players[nextState.currentPlayerIndex];
  const discarded = removeTopCollectedCard(currentPlayer, suit);
  nextState.pendingEffect = null;
  if (discarded) {
    nextState.discardPile = shuffleCards([...nextState.discardPile, discarded]);
    nextState.lastAction = `Misfire discarded your ${DEAD_MANS_DRAW_SUIT_CONFIG[suit].name}.`;
  }
  return continueForcedReveals(nextState);
}

export function getDeadMansDrawActionState(state: DeadMansDrawState) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  return {
    currentPlayer,
    currentScore: getDeadMansDrawScore(currentPlayer),
    canReveal: !state.gameOver && !state.pendingEffect && state.ringSelectionIndex === null && !state.powerTargetSelection && state.drawPile.length > 0,
    canCollect: !state.gameOver
      && !state.pendingEffect
      && state.ringSelectionIndex === null
      && !state.powerTargetSelection
      && state.forcedRevealRemaining === 0
      && state.treasureArea.length > 0
      && !isCollectBlockedBySnakeAstrolabe(state),
  };
}

function advanceRingSelection(state: DeadMansDrawState) {
  const nextIndex = state.players.findIndex((entry) => entry.ring === null);
  if (nextIndex === -1) {
    state.ringSelectionIndex = null;
    state.currentPlayerIndex = 0;
    state.lastAction = "All ring powers are locked in. Player 1 begins.";
    return state;
  }

  state.ringSelectionIndex = nextIndex;
  state.lastAction = `Player ${nextIndex + 1}, choose your ring power.`;
  return state;
}

export function selectDeadMansDrawRing(state: DeadMansDrawState, ring: DeadMansDrawRing) {
  const nextState = cloneDeadMansDrawState(state);
  const selectingIndex = nextState.ringSelectionIndex;
  if (selectingIndex === null || nextState.powerTargetSelection) return nextState;

  const player = nextState.players[selectingIndex];
  if (!player || !player.ringOptions.includes(ring)) {
    return nextState;
  }

  player.ring = ring;
  player.ringOptions = [ring];

  if (ring === "madam-margot") {
    const targetOptions = nextState.players.map((_, index) => index).filter((index) => index !== selectingIndex);
    if (targetOptions.length === 1) {
      player.markedOpponentIndex = targetOptions[0];
      nextState.lastAction = `Madam Margot marked Player ${targetOptions[0] + 1}.`;
      return advanceRingSelection(nextState);
    }

    nextState.powerTargetSelection = {
      playerIndex: selectingIndex,
      power: "madam-margot",
      options: targetOptions,
    };
    nextState.lastAction = `Player ${selectingIndex + 1}, choose which opponent Madam Margot watches.`;
    return nextState;
  }

  return advanceRingSelection(nextState);
}

export function selectDeadMansDrawPowerTarget(state: DeadMansDrawState, targetPlayerIndex: number) {
  const nextState = cloneDeadMansDrawState(state);
  const selection = nextState.powerTargetSelection;
  if (!selection || selection.power !== "madam-margot") return nextState;
  if (!selection.options.includes(targetPlayerIndex)) return nextState;

  const player = nextState.players[selection.playerIndex];
  if (!player) return nextState;

  player.markedOpponentIndex = targetPlayerIndex;
  nextState.powerTargetSelection = null;
  nextState.lastAction = `Madam Margot marked Player ${targetPlayerIndex + 1}.`;
  return advanceRingSelection(nextState);
}
