import {
  DEAD_MANS_DRAW_SUITS,
  isCollectBlockedBySnakeAstrolabe,
  type DeadMansDrawCard,
  type DeadMansDrawPendingEffect,
  type DeadMansDrawState,
  type DeadMansDrawSuit,
} from "@/lib/deadMansDraw";

export type DeadMansDrawAIAction =
  | { kind: "reveal" }
  | { kind: "collect" }
  | { kind: "astrolabe"; revealPeekedCard: boolean }
  | { kind: "pistol"; targetPlayerIndex: number; suit: DeadMansDrawSuit }
  | { kind: "dagger"; targetPlayerIndex: number; suit: DeadMansDrawSuit }
  | { kind: "horseshoe"; suit: DeadMansDrawSuit }
  | { kind: "map"; cardId: string }
  | { kind: "misfire"; suit: DeadMansDrawSuit }
  | { kind: "power-target"; targetPlayerIndex: number };

function duplicateRisk(state: DeadMansDrawState) {
  if (!state.drawPile.length || !state.treasureArea.length) return 0;
  const revealed = new Set(state.treasureArea.map((card) => card.suit));
  const dangerous = state.drawPile.filter((card) => revealed.has(card.suit)).length;
  return dangerous / state.drawPile.length;
}

function expectedHaul(state: DeadMansDrawState) {
  return state.treasureArea.reduce((sum, card) => sum + card.value, 0);
}

function chooseHighest(cards: DeadMansDrawCard[], preferUniqueAgainst: Set<DeadMansDrawSuit>) {
  return [...cards].sort((left, right) => {
    const leftDuplicate = preferUniqueAgainst.has(left.suit) ? 1 : 0;
    const rightDuplicate = preferUniqueAgainst.has(right.suit) ? 1 : 0;
    if (leftDuplicate !== rightDuplicate) return leftDuplicate - rightDuplicate;
    return right.value - left.value;
  })[0];
}

function chooseLowest(cards: DeadMansDrawCard[]) {
  return [...cards].sort((left, right) => left.value - right.value)[0];
}

function choosePendingEffectAction(
  state: DeadMansDrawState,
  pendingEffect: DeadMansDrawPendingEffect,
): DeadMansDrawAIAction {
  const treasureSuits = new Set(state.treasureArea.map((card) => card.suit));

  switch (pendingEffect.kind) {
    case "astrolabe": {
      const topCard = pendingEffect.peekCards[0];
      if (!topCard) return { kind: "collect" };
      const wouldBust = treasureSuits.has(topCard.suit);
      const risk = duplicateRisk(state);
      return {
        kind: "astrolabe",
        revealPeekedCard: !wouldBust && (expectedHaul(state) < 18 || risk < 0.45),
      };
    }
    case "pistol": {
      const choice = pendingEffect.options
        .flatMap((option) => option.cards.map((card) => ({ playerIndex: option.playerIndex, card })))
        .sort((left, right) => right.card.value - left.card.value)[0];
      return {
        kind: "pistol",
        targetPlayerIndex: choice.playerIndex,
        suit: choice.card.suit,
      };
    }
    case "dagger": {
      const choice = pendingEffect.options
        .flatMap((option) => option.cards.map((card) => ({ playerIndex: option.playerIndex, card })))
        .sort((left, right) => {
          const leftBust = treasureSuits.has(left.card.suit) ? 1 : 0;
          const rightBust = treasureSuits.has(right.card.suit) ? 1 : 0;
          if (leftBust !== rightBust) return leftBust - rightBust;
          return right.card.value - left.card.value;
        })[0];
      return {
        kind: "dagger",
        targetPlayerIndex: choice.playerIndex,
        suit: choice.card.suit,
      };
    }
    case "horseshoe": {
      const card = chooseHighest(pendingEffect.options, treasureSuits);
      return { kind: "horseshoe", suit: card.suit };
    }
    case "map": {
      const card = chooseHighest(pendingEffect.options, treasureSuits);
      return { kind: "map", cardId: card.id };
    }
    case "misfire": {
      const card = chooseLowest(pendingEffect.options);
      return { kind: "misfire", suit: card.suit };
    }
    default:
      return { kind: "collect" };
  }
}

export function chooseDeadMansDrawAIAction(state: DeadMansDrawState): DeadMansDrawAIAction {
  if (state.powerTargetSelection) {
    return { kind: "power-target", targetPlayerIndex: state.powerTargetSelection.options[0] };
  }

  if (state.pendingEffect) {
    return choosePendingEffectAction(state, state.pendingEffect);
  }

  if (!state.treasureArea.length) {
    return { kind: "reveal" };
  }

  if (isCollectBlockedBySnakeAstrolabe(state)) {
    return { kind: "reveal" };
  }

  if (state.drawPile.length === 0) {
    return { kind: "collect" };
  }

  const haul = expectedHaul(state);
  const risk = duplicateRisk(state);
  const hasCombo = state.treasureArea.some((card) => card.suit === "chest")
    && state.treasureArea.some((card) => card.suit === "key");
  const uniqueCount = new Set(state.treasureArea.map((card) => card.suit)).size;

  if (hasCombo && haul >= 16) {
    return { kind: "collect" };
  }

  if (risk >= 0.5 && haul >= 10) {
    return { kind: "collect" };
  }

  if (uniqueCount >= 5 && risk >= 0.35) {
    return { kind: "collect" };
  }

  if (haul >= 22) {
    return { kind: "collect" };
  }

  return { kind: "reveal" };
}

export function describeDeadMansDrawRisk(state: DeadMansDrawState) {
  return {
    risk: duplicateRisk(state),
    haul: expectedHaul(state),
    unseenSuits: DEAD_MANS_DRAW_SUITS.filter(
      (suit) => !state.treasureArea.some((card) => card.suit === suit),
    ).length,
  };
}
