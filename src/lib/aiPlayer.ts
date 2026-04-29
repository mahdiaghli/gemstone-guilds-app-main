import { GameState, GemType, Card, GEM_TYPES } from './gameData';
import { canPlayerAffordCard, getPlayerBonuses, getPlayerScore, getTotalTokens } from './gameLogic';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type AIAction =
  | { type: 'takeTokens'; gems: GemType[] }
  | { type: 'purchaseCard'; cardId: number }
  | { type: 'reserveCard'; cardId: number }
  | { type: 'reserveDeck'; level: 1 | 2 | 3 };

export function getAIActionCandidates(
  state: GameState,
  difficulty: AIDifficulty = 'medium',
): AIAction[] {
  const primary = getAIAction(state, difficulty);
  const player = state.players[state.currentPlayerIndex];
  const candidates: AIAction[] = [primary];

  const affordableVisible = [1, 2, 3]
    .flatMap((level) => state.visibleCards[level as 1 | 2 | 3])
    .filter((card): card is Card => Boolean(card))
    .filter((card) => canPlayerAffordCard(player, card))
    .map((card) => ({ type: 'purchaseCard', cardId: card.id } as AIAction));
  const affordableReserved = player.reservedCards
    .filter((card) => canPlayerAffordCard(player, card))
    .map((card) => ({ type: 'purchaseCard', cardId: card.id } as AIAction));
  const available = GEM_TYPES.filter((gem) => state.tokenPool[gem] > 0);
  const takeActions: AIAction[] = [];

  for (const gem of available) {
    if (state.tokenPool[gem] >= 4) {
      takeActions.push({ type: 'takeTokens', gems: [gem, gem] });
    }
  }
  if (available.length >= 3) {
    takeActions.push({ type: 'takeTokens', gems: available.slice(0, 3) });
  }
  if (available.length >= 1) {
    takeActions.push({ type: 'takeTokens', gems: [available[0]] });
  }

  const reserveActions: AIAction[] = player.reservedCards.length < 3
    ? [
        ...[3, 2, 1].flatMap((level) =>
          state.visibleCards[level as 1 | 2 | 3]
            .filter((card): card is Card => Boolean(card))
            .map((card) => ({ type: 'reserveCard', cardId: card.id } as AIAction)),
        ),
        { type: 'reserveDeck', level: 1 },
        { type: 'reserveDeck', level: 2 },
        { type: 'reserveDeck', level: 3 },
      ]
    : [];

  return [...candidates, ...affordableVisible, ...affordableReserved, ...takeActions, ...reserveActions].filter(
    (action, index, array) =>
      array.findIndex((entry) => JSON.stringify(entry) === JSON.stringify(action)) === index,
  );
}

function scoreCard(card: Card, state: GameState, playerIndex: number): number {
  const player = state.players[playerIndex];
  const bonuses = getPlayerBonuses(player);
  let score = card.points * 10;

  // How close are we to affording it?
  let totalMissing = 0;
  for (const gem of GEM_TYPES) {
    const cost = card.cost[gem] || 0;
    const have = player.tokens[gem] + bonuses[gem];
    if (have < cost) totalMissing += cost - have;
  }
  score -= totalMissing * 3;

  // Value gems that help with nobles
  for (const noble of state.nobles) {
    const req = noble.requirements[card.gemBonus] || 0;
    if (req > 0 && bonuses[card.gemBonus] < req) {
      score += 5;
    }
  }

  return score;
}

// سریع و تصادفی - Easy mode
function getAIActionEasy(state: GameState): AIAction {
  const player = state.players[state.currentPlayerIndex];
  
  // 1. اگر کارت رایگان خریدی شود، بخر - Buy if affordable
  const affordableCards: Card[] = [];
  for (const level of [3, 2, 1] as const) {
    for (const card of state.visibleCards[level]) {
      if (card && canPlayerAffordCard(player, card)) {
        affordableCards.push(card);
      }
    }
  }
  for (const card of player.reservedCards) {
    if (canPlayerAffordCard(player, card)) {
      affordableCards.push(card);
    }
  }

  if (affordableCards.length > 0) {
    const randomCard = affordableCards[Math.floor(Math.random() * affordableCards.length)];
    return { type: 'purchaseCard', cardId: randomCard.id };
  }

  // 2. تصادفی توکن بگیر - Take random available tokens
  const available = GEM_TYPES.filter(g => state.tokenPool[g] > 0);
  if (available.length >= 3) {
    const selected = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available[idx]);
    }
    return { type: 'takeTokens', gems: selected };
  }
  if (available.length > 0) {
    return { type: 'takeTokens', gems: available.slice(0, available.length) };
  }

  // 3. کارت با امتیاز بالا رزرو کن - Reserve high-point cards
  if (player.reservedCards.length < 3) {
    const visibleCards = [
      ...state.visibleCards[1],
      ...state.visibleCards[2],
      ...state.visibleCards[3],
    ].filter(c => c !== null) as Card[];
    
    if (visibleCards.length > 0) {
      const randomCard = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      return { type: 'reserveCard', cardId: randomCard.id };
    }
  }

  if (player.reservedCards.length < 3) {
    return { type: 'reserveDeck', level: Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3 };
  }

  return { type: 'takeTokens', gems: available.slice(0, 1) };
}

// متعادل - Medium mode
function getAIActionMedium(state: GameState): AIAction {
  const player = state.players[state.currentPlayerIndex];
  const bonuses = getPlayerBonuses(player);

  // 1. Buy the best affordable card
  const affordableCards: { card: Card; score: number }[] = [];
  for (const level of [3, 2, 1] as const) {
    for (const card of state.visibleCards[level]) {
      if (card && canPlayerAffordCard(player, card)) {
        affordableCards.push({ card, score: scoreCard(card, state, state.currentPlayerIndex) });
      }
    }
  }
  for (const card of player.reservedCards) {
    if (canPlayerAffordCard(player, card)) {
      affordableCards.push({ card, score: scoreCard(card, state, state.currentPlayerIndex) });
    }
  }

  if (affordableCards.length > 0) {
    affordableCards.sort((a, b) => b.score - a.score);
    // Medium: Sometimes take top, sometimes random from top 3
    const topCards = affordableCards.slice(0, Math.min(3, affordableCards.length));
    const chosen = topCards[Math.floor(Math.random() * topCards.length)];
    return { type: 'purchaseCard', cardId: chosen.card.id };
  }

  // 2. Find cards to work toward
  const targetCards: { card: Card; missing: Partial<Record<GemType, number>> }[] = [];
  for (const level of [1, 2, 3] as const) {
    for (const card of state.visibleCards[level]) {
      if (!card) continue;
      const missing: Partial<Record<GemType, number>> = {};
      let total = 0;
      for (const gem of GEM_TYPES) {
        const cost = card.cost[gem] || 0;
        const have = player.tokens[gem] + bonuses[gem];
        if (have < cost) {
          missing[gem] = cost - have;
          total += cost - have;
        }
      }
      if (total > 0 && total <= 6) {
        targetCards.push({ card, missing });
      }
    }
  }

  if (targetCards.length > 0) {
    targetCards.sort((a, b) => {
      const aMissing = Object.values(a.missing).reduce((s, v) => s + (v || 0), 0);
      const bMissing = Object.values(b.missing).reduce((s, v) => s + (v || 0), 0);
      return aMissing - bMissing;
    });

    const target = targetCards[0];
    const neededGems = GEM_TYPES.filter(g => (target.missing[g] || 0) > 0 && state.tokenPool[g] > 0);

    for (const gem of neededGems) {
      if ((target.missing[gem] || 0) >= 2 && state.tokenPool[gem] >= 4) {
        return { type: 'takeTokens', gems: [gem, gem] };
      }
    }

    if (neededGems.length >= 3) {
      return { type: 'takeTokens', gems: neededGems.slice(0, 3) };
    }
    if (neededGems.length >= 1) {
      const others = GEM_TYPES.filter(g => !neededGems.includes(g) && state.tokenPool[g] > 0);
      const gems = [...neededGems, ...others].slice(0, 3);
      if (gems.length > 0) {
        return { type: 'takeTokens', gems };
      }
    }
  }

  const available = GEM_TYPES.filter(g => state.tokenPool[g] > 0);
  if (available.length >= 3) {
    return { type: 'takeTokens', gems: available.slice(0, 3) };
  }
  if (available.length > 0) {
    return { type: 'takeTokens', gems: available.slice(0, Math.min(3, available.length)) };
  }

  if (player.reservedCards.length < 3) {
    for (const level of [3, 2, 1] as const) {
      for (const card of state.visibleCards[level]) {
        if (card && card.points >= 2) {
          return { type: 'reserveCard', cardId: card.id };
        }
      }
    }
  }

  if (player.reservedCards.length < 3) {
    return { type: 'reserveDeck', level: 1 };
  }

  return { type: 'takeTokens', gems: available.slice(0, 1) };
}

// دقیق و استراتژیک - Hard mode
function getAIActionHard(state: GameState): AIAction {
  const player = state.players[state.currentPlayerIndex];
  const bonuses = getPlayerBonuses(player);

  // 1. Buy the best affordable card with detailed scoring
  const affordableCards: { card: Card; score: number }[] = [];
  for (const level of [3, 2, 1] as const) {
    for (const card of state.visibleCards[level]) {
      if (card && canPlayerAffordCard(player, card)) {
        let score = scoreCard(card, state, state.currentPlayerIndex);
        // Bonus for higher level cards
        score += level * 5;
        // Consider progression toward nobles
        for (const noble of state.nobles) {
          let totalBonus = 0;
          for (const gem of GEM_TYPES) {
            totalBonus += Math.min(bonuses[gem] + (card.gemBonus === gem ? 1 : 0), noble.requirements[gem] || 0);
          }
          if (totalBonus > 0) score += 10;
        }
        affordableCards.push({ card, score });
      }
    }
  }
  for (const card of player.reservedCards) {
    if (canPlayerAffordCard(player, card)) {
      affordableCards.push({ card, score: scoreCard(card, state, state.currentPlayerIndex) + 15 });
    }
  }

  if (affordableCards.length > 0) {
    affordableCards.sort((a, b) => b.score - a.score);
    return { type: 'purchaseCard', cardId: affordableCards[0].card.id };
  }

  // 2. Find the best cards to work toward with strategic planning
  const targetCards: { card: Card; missing: Partial<Record<GemType, number>>; priority: number }[] = [];
  for (const level of [1, 2, 3] as const) {
    for (const card of state.visibleCards[level]) {
      if (!card) continue;
      const missing: Partial<Record<GemType, number>> = {};
      let total = 0;
      for (const gem of GEM_TYPES) {
        const cost = card.cost[gem] || 0;
        const have = player.tokens[gem] + bonuses[gem];
        if (have < cost) {
          missing[gem] = cost - have;
          total += cost - have;
        }
      }
      if (total > 0 && total <= 8) {
        let priority = scoreCard(card, state, state.currentPlayerIndex) * 100 + total;
        targetCards.push({ card, missing, priority });
      }
    }
  }

  if (targetCards.length > 0) {
    targetCards.sort((a, b) => b.priority - a.priority);
    const target = targetCards[0];
    const neededGems = GEM_TYPES.filter(g => (target.missing[g] || 0) > 0 && state.tokenPool[g] > 0);

    // Prefer taking 2 of same gem for economy
    for (const gem of neededGems) {
      if ((target.missing[gem] || 0) >= 2 && state.tokenPool[gem] >= 4) {
        return { type: 'takeTokens', gems: [gem, gem] };
      }
    }

    // Take 3 different needed gems
    if (neededGems.length >= 3) {
      return { type: 'takeTokens', gems: neededGems.slice(0, 3) };
    }
    
    // Mix needed with available
    if (neededGems.length >= 1) {
      const others = GEM_TYPES.filter(g => !neededGems.includes(g) && state.tokenPool[g] > 0);
      const gems = [...neededGems, ...others].slice(0, 3);
      if (gems.length > 0) {
        return { type: 'takeTokens', gems };
      }
    }
  }

  // 3. Take available tokens strategically
  const available = GEM_TYPES.filter(g => state.tokenPool[g] > 0);
  if (available.length >= 3) {
    // Prefer gems that appear in many cards
    const gemFrequency: Record<GemType, number> = {} as any;
    for (const gem of GEM_TYPES) gemFrequency[gem] = 0;
    for (const level of [1, 2, 3] as const) {
      for (const card of state.visibleCards[level]) {
        if (card) {
          for (const gem of GEM_TYPES) {
            if (card.cost[gem] || 0 > 0) gemFrequency[gem]++;
          }
        }
      }
    }
    const sorted = available.sort((a, b) => (gemFrequency[b] || 0) - (gemFrequency[a] || 0));
    return { type: 'takeTokens', gems: sorted.slice(0, 3) };
  }
  if (available.length > 0) {
    return { type: 'takeTokens', gems: available.slice(0, Math.min(3, available.length)) };
  }

  // 4. Reserve high-value cards strategically
  if (player.reservedCards.length < 3) {
    const visibleCardsWithScore: { card: Card; score: number }[] = [];
    for (const level of [3, 2, 1] as const) {
      for (const card of state.visibleCards[level]) {
        if (card) {
          visibleCardsWithScore.push({ card, score: scoreCard(card, state, state.currentPlayerIndex) + level * 3 });
        }
      }
    }
    if (visibleCardsWithScore.length > 0) {
      visibleCardsWithScore.sort((a, b) => b.score - a.score);
      return { type: 'reserveCard', cardId: visibleCardsWithScore[0].card.id };
    }
  }

  if (player.reservedCards.length < 3) {
    // Prefer higher level decks to get better cards
    return { type: 'reserveDeck', level: 3 };
  }

  return { type: 'takeTokens', gems: available.slice(0, 1) };
}

export function getAIAction(state: GameState, difficulty: AIDifficulty = 'medium'): AIAction {
  // Ensure AI always performs at least one action
  let action: AIAction;
  
  switch (difficulty) {
    case 'easy':
      action = getAIActionEasy(state);
      break;
    case 'hard':
      action = getAIActionHard(state);
      break;
    case 'medium':
    default:
      action = getAIActionMedium(state);
  }

  // Fallback: if somehow no action was determined, always take at least 1 gem token
  // or reserve a card or reserve from deck
  if (!action) {
    const player = state.players[state.currentPlayerIndex];
    
    // Try to take any available token
    const available = GEM_TYPES.filter(g => state.tokenPool[g] > 0);
    if (available.length > 0) {
      return { type: 'takeTokens', gems: [available[0]] };
    }
    
    // Try to reserve a visible card
    for (const level of [1, 2, 3] as const) {
      for (const card of state.visibleCards[level]) {
        if (card && player.reservedCards.length < 3) {
          return { type: 'reserveCard', cardId: card.id };
        }
      }
    }
    
    // Try to reserve from deck
    return { type: 'reserveDeck', level: 1 };
  }

  return action;
}
