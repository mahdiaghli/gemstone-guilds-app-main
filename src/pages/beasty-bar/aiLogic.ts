// Beasty Bar - AI Logic

import type { BeastyBarGameState, AnimalCard, AnimalType } from "./types";
import { ANIMAL_DEFINITIONS, getAnimalEmoji } from "./types";

type AIDifficulty = "easy" | "medium" | "hard";

interface AIMove {
  cardId: string;
  choice?: unknown;
}

// Main AI decision function
export function getAIMove(
  state: BeastyBarGameState,
  playerIndex: number,
  difficulty: AIDifficulty
): AIMove {
  const player = state.players[playerIndex];
  const zone = state.bumpingZone.animals;
  const hand = player.hand;

  // If there's a pending effect, resolve it
  if (state.pendingEffect && state.pendingEffect.playerIndex === playerIndex) {
    const choice = resolvePendingEffectAI(state, playerIndex, difficulty);
    return { cardId: "", choice };
  }

  // Otherwise, choose a card to play
  const card = chooseCardToPlay(state, playerIndex, difficulty);
  return { cardId: card.id };
}

// Choose which card to play
function chooseCardToPlay(
  state: BeastyBarGameState,
  playerIndex: number,
  difficulty: AIDifficulty
): AnimalCard {
  const player = state.players[playerIndex];
  const zone = state.bumpingZone.animals;
  const hand = player.hand;

  if (hand.length === 0) {
    throw new Error("AI has no cards to play");
  }

  // Sort cards by strategic value
  const scoredCards = hand.map((card) => ({
    card,
    score: evaluateCardValue(state, playerIndex, card, difficulty),
  }));

  scoredCards.sort((a, b) => b.score - a.score);

  // Add some randomness based on difficulty
  const randomFactor = difficulty === "easy" ? 0.5 : difficulty === "medium" ? 0.25 : 0.1;
  const topCard = scoredCards[0];

  if (Math.random() < randomFactor && scoredCards.length > 1) {
    // Sometimes pick second best for variety
    return scoredCards[1]?.card || topCard.card;
  }

  return topCard.card;
}

// Evaluate the strategic value of playing a card
function evaluateCardValue(
  state: BeastyBarGameState,
  playerIndex: number,
  card: AnimalCard,
  difficulty: AIDifficulty
): number {
  const zone = state.bumpingZone.animals;
  const player = state.players[playerIndex];
  let score = card.power * 0.5; // Base score by power

  switch (card.type) {
    case "lion": {
      // High value if it can exile monkeys or move to front
      const monkeysInZone = zone.filter((a) => a.type === "monkey").length;
      const otherLion = zone.some((a) => a.type === "lion");
      if (otherLion) {
        score -= 50; // Bad - will be exiled
      } else {
        score += monkeysInZone * 15; // Good - can exile monkeys
        score += zone.length > 0 ? 10 : 0; // Good - can move to front
      }
      break;
    }

    case "hippopotamus":
    case "crocodile": {
      // Value based on how far they can push/eat
      const position = zone.length;
      const pushPotential = Math.min(position, 3);
      score += pushPotential * 8;

      // Check for zebra blocking
      const zebraIdx = zone.findIndex((a) => a.type === "zebra");
      if (zebraIdx !== -1) {
        score -= 10; // Zebra might block
      }
      break;
    }

    case "snake": {
      // Good if we have high power cards that would benefit from reordering
      const myCardsInZone = zone.filter((a) => a.ownerIndex === playerIndex);
      const myHighPowerCards = myCardsInZone.filter((a) => a.power >= 8).length;
      score += myHighPowerCards * 10;

      // Also good if there are powerful enemy cards near the back
      const enemyHighPowerInBack = zone
        .slice(-2)
        .filter((a) => a.ownerIndex !== playerIndex && a.power >= 8).length;
      score += enemyHighPowerInBack * 8;
      break;
    }

    case "giraffe": {
      // Good if there's a weaker card in front of where it would be placed
      if (zone.length > 0) {
        const lastCard = zone[zone.length - 1];
        if (lastCard.power < card.power) {
          score += 12;
        }
      }
      break;
    }

    case "zebra": {
      // Defensive - good to protect other cards
      const myCardsBehind = zone.filter(
        (a, i) => a.ownerIndex === playerIndex && i < zone.length - 1
      ).length;
      score += myCardsBehind * 7;
      break;
    }

    case "beaver": {
      // Situational - good if it benefits our position
      const myCardsAtFront = zone.slice(0, 2).filter((a) => a.ownerIndex === playerIndex).length;
      const myCardsAtBack = zone.slice(-2).filter((a) => a.ownerIndex === playerIndex).length;

      if (state.bumpingZone.heavenGateDirection === "normal") {
        // Normal: front enters, back is exiled
        if (myCardsAtBack > 0 && myCardsAtFront === 0) {
          score += 15; // Good - reverses to save our back cards
        } else if (myCardsAtFront > 0 && myCardsAtBack === 0) {
          score -= 10; // Bad - would exile our front cards
        }
      } else {
        // Reversed: back enters, front is exiled
        if (myCardsAtFront > 0 && myCardsAtBack === 0) {
          score += 15; // Good - reverses to save our front cards
        }
      }
      break;
    }

    case "monkey": {
      // Good if there's already a monkey (trigger chaos)
      const monkeysInZone = zone.filter((a) => a.type === "monkey").length;
      if (monkeysInZone >= 1) {
        const crocsAndHippos = zone.filter(
          (a) => a.type === "crocodile" || a.type === "hippopotamus"
        ).length;
        // Good if it exiles many enemy crocs/hippos
        const enemyCrocsHippos = zone.filter(
          (a) =>
            (a.type === "crocodile" || a.type === "hippopotamus") &&
            a.ownerIndex !== playerIndex
        ).length;
        score += enemyCrocsHippos * 12;
        score -= crocsAndHippos * 3; // Small penalty for our own
      } else {
        score += 5; // OK to set up for next monkey
      }
      break;
    }

    case "kangaroo": {
      // Good if it can jump over enemy cards to safety
      const enemyCards = zone.filter((a) => a.ownerIndex !== playerIndex).length;
      score += enemyCards * 4;
      break;
    }

    case "parrot": {
      // Good if there's a threatening enemy card
      const threateningEnemy = zone.find(
        (a) => a.ownerIndex !== playerIndex && a.power >= 9
      );
      if (threateningEnemy) {
        score += 14;
      }
      break;
    }

    case "chameleon": {
      // Value depends on what we can copy
      const bestCopyTarget = findBestCopyTarget(zone, playerIndex);
      if (bestCopyTarget) {
        score += 10; // Good if there's something worth copying
      }
      break;
    }

    case "binturong": {
      // Good if there are strong enemy cards of different species
      const enemyCards = zone.filter((a) => a.ownerIndex !== playerIndex);
      const uniqueEnemySpecies = new Set(enemyCards.map((a) => a.type)).size;
      score += uniqueEnemySpecies * 8;
      break;
    }
  }

  // Consider gate timing
  if (zone.length === 4) {
    // Playing now triggers the gate
    const myCardsInZone = zone.filter((a) => a.ownerIndex === playerIndex).length;
    if (myCardsInZone === 0) {
      score -= 5; // Slightly risky if no cards in zone
    } else {
      // Evaluate if our cards would benefit
      const myCardsAtFront = zone.slice(0, 2).filter((a) => a.ownerIndex === playerIndex).length;
      score += myCardsAtFront * 5;
    }
  }

  return score;
}

// Find the best animal type for chameleon to copy
function findBestCopyTarget(
  zone: AnimalCard[],
  playerIndex: number
): AnimalType | null {
  if (zone.length === 0) return null;

  // Prioritize high-value abilities
  const priority: AnimalType[] = ["lion", "snake", "crocodile", "hippopotamus", "monkey"];

  for (const type of priority) {
    if (zone.some((a) => a.type === type)) {
      return type;
    }
  }

  return zone[0]?.type || null;
}

// Find the best card for chameleon to copy (returns card instead of type)
function findBestCopyTargetCard(
  zone: AnimalCard[],
  playerIndex: number
): AnimalCard | null {
  if (zone.length === 0) return null;

  // Prioritize high-value abilities
  const priority: AnimalType[] = ["lion", "snake", "crocodile", "hippopotamus", "monkey"];

  for (const type of priority) {
    const card = zone.find((a) => a.type === type);
    if (card) return card;
  }

  return zone[0] || null;
}

// Resolve pending effect choices for AI
function resolvePendingEffectAI(
  state: BeastyBarGameState,
  playerIndex: number,
  difficulty: AIDifficulty
): unknown {
  if (!state.pendingEffect) return undefined;

  const effect = state.pendingEffect;
  const zone = state.bumpingZone.animals;

  switch (effect.kind) {
    case "kangaroo": {
      // Choose jump based on what gets us furthest from exile
      const options = effect.jumpOptions;
      return Math.max(...options); // Jump as far as possible
    }

    case "parrot": {
      // AI chooses a species type to eliminate (all cards of that species)
      // Strategy: eliminate the most threatening species
      const enemyCards = zone.filter((a) => a.ownerIndex !== playerIndex);
      if (enemyCards.length === 0) {
        // Remove species of weakest ally as fallback
        const allyCards = zone.filter((a) => a.ownerIndex === playerIndex);
        const weakest = allyCards.sort((a, b) => a.power - b.power)[0];
        return weakest?.type;
      }
      // Eliminate species of strongest enemy
      const strongestEnemy = enemyCards.sort((a, b) => b.power - a.power)[0];
      return strongestEnemy.type;
    }

    case "chameleon": {
      // Choose the best card to copy by its ID
      const bestTarget = findBestCopyTargetCard(zone, playerIndex);
      return bestTarget?.id;
    }
  }

  return undefined;
}

// Helper function to check if an action would be beneficial
export function isActionBeneficial(
  state: BeastyBarGameState,
  playerIndex: number,
  cardType: AnimalType
): boolean {
  const zone = state.bumpingZone.animals;

  switch (cardType) {
    case "lion":
      return !zone.some((a) => a.type === "lion"); // Only if no other lion
    case "monkey":
      return zone.some((a) => a.type === "monkey"); // Good if triggers chaos
    case "parrot":
      return zone.some((a) => a.ownerIndex !== playerIndex); // Good if removes enemy
    default:
      return true;
  }
}

// Get a hint for what card to play (for AI thinking animation)
export function getAIThinkingText(
  state: BeastyBarGameState,
  playerIndex: number,
  lang: "en" | "fa"
): string {
  const player = state.players[playerIndex];

  if (lang === "fa") {
    return `${player.name} در حال فکر کردن...`;
  }
  return `${player.name} is thinking...`;
}
