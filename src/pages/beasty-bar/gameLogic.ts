// Beasty Bar - Game Logic

import type {
  BeastyBarGameState,
  BeastyBarPlayer,
  AnimalCard,
  AnimalType,
  PendingEffect,
  BumpingZoneState,
} from "./types";
import { ANIMAL_DEFINITIONS } from "./types";

// Play a card from hand to the bumping zone
export function playCard(
  state: BeastyBarGameState,
  playerIndex: number,
  cardId: string
): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;
  const player = newState.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) return state;

  const card = player.hand.splice(cardIndex, 1)[0];
  player.totalCards++;

  // Add to bumping zone (at the end - near Exile)
  newState.bumpingZone.animals.push(card);
  newState.lastAction = `${player.name} played ${card.type}`;

  // Draw a card from draw stack to maintain up to 4 cards in hand
  // Only draw if player has less than 4 cards AND has cards in draw stack
  if (player.hand.length < 4 && player.drawStack.length > 0) {
    const drawnCard = player.drawStack.shift()!;
    player.hand.push(drawnCard);
  }

  // Check if lion exiles another lion
  if (card.type === "lion") {
    const otherLionIndex = newState.bumpingZone.animals.findIndex(
      (a, i) => a.type === "lion" && i !== newState.bumpingZone.animals.length - 1
    );
    if (otherLionIndex !== -1) {
      // New lion is exiled
      const exiledCard = newState.bumpingZone.animals.pop()!;
      player.thatsIt.push(exiledCard);
      newState.lastAction = `${player.name}'s lion was exiled because another lion was already in line!`;
      return newState;
    }
  }

  // Resolve the played animal's ability
  return resolveAnimalAbility(newState, card);
}

// Resolve animal ability when played
function resolveAnimalAbility(
  state: BeastyBarGameState,
  card: AnimalCard
): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;
  const playerIndex = card.ownerIndex;
  const player = newState.players[playerIndex];
  const zone = newState.bumpingZone.animals;
  const resolvedType = card.copiedType && card.copiedType !== "chameleon"
    ? card.copiedType
    : card.type;

  switch (resolvedType) {
    case "lion": {
      // Frighten all monkeys
      const monkeys = zone.filter((a) => a.type === "monkey");
      if (monkeys.length > 0) {
        monkeys.forEach((monkey) => {
          const idx = zone.findIndex((a) => a.id === monkey.id);
          if (idx !== -1) {
            const [exiled] = zone.splice(idx, 1);
            player.thatsIt.push(exiled);
          }
        });
        newState.lastAction = `${player.name}'s lion frightened ${monkeys.length} monkeys to exile!`;
      }
      // Move lion to front
      const lionIndex = zone.findIndex((a) => a.id === card.id);
      if (lionIndex !== -1) {
        const [lion] = zone.splice(lionIndex, 1);
        zone.unshift(lion);
      }
      break;
    }

    case "hippopotamus": {
      // Push forward until blocked
      let currentIdx = zone.findIndex((a) => a.id === card.id);
      while (currentIdx > 0) {
        const nextAnimal = zone[currentIdx - 1];
        if (
          nextAnimal.type === "zebra" ||
          nextAnimal.power > card.power ||
          (nextAnimal.type === "hippopotamus" && nextAnimal.ownerIndex === card.ownerIndex)
        ) {
          break;
        }
        // Swap positions
        [zone[currentIdx], zone[currentIdx - 1]] = [zone[currentIdx - 1], zone[currentIdx]];
        currentIdx--;
      }
      newState.lastAction = `${player.name}'s hippo pushed forward!`;
      break;
    }

    case "crocodile": {
      // Eat weaker animals in front
      let currentIdx = zone.findIndex((a) => a.id === card.id);
      const eaten: AnimalCard[] = [];
      while (currentIdx > 0) {
        const nextAnimal = zone[currentIdx - 1];
        if (nextAnimal.type === "zebra" || nextAnimal.power >= card.power) {
          break;
        }
        // Eat the weaker animal
        const [eatenAnimal] = zone.splice(currentIdx - 1, 1);
        eaten.push(eatenAnimal);
        player.thatsIt.push(eatenAnimal);
        currentIdx--;
      }
      if (eaten.length > 0) {
        newState.lastAction = `${player.name}'s crocodile ate ${eaten.length} weaker animals!`;
      }
      break;
    }

    case "snake": {
      // Reorder by power (strongest near Heaven's Gate)
      const sorted = [...zone].sort((a, b) => {
        if (b.power !== a.power) return b.power - a.power;
        // Same power - keep relative order
        return zone.indexOf(a) - zone.indexOf(b);
      });
      newState.bumpingZone.animals = sorted;
      newState.lastAction = `${player.name}'s snake reordered the line by power!`;
      break;
    }

    case "giraffe": {
      // Step over one weaker animal in front
      const giraffeIdx = zone.findIndex((a) => a.id === card.id);
      if (giraffeIdx > 0) {
        const frontAnimal = zone[giraffeIdx - 1];
        if (frontAnimal.power < card.power) {
          [zone[giraffeIdx], zone[giraffeIdx - 1]] = [zone[giraffeIdx - 1], zone[giraffeIdx]];
          newState.lastAction = `${player.name}'s giraffe stepped over the ${frontAnimal.type}!`;
        }
      }
      break;
    }

    case "beaver": {
      newState.bumpingZone.animals = [...zone].reverse();
      newState.lastAction = `${player.name}'s beaver reversed the entire queue!`;
      break;
    }

    case "monkey": {
      const monkeysInZone = zone.filter((a) => a.type === "monkey");
      if (monkeysInZone.length >= 2) {
        // Exile all crocs and hippos
        const crocsAndHippos = zone.filter((a) => a.type === "crocodile" || a.type === "hippopotamus");
        crocsAndHippos.forEach((animal) => {
          const idx = zone.findIndex((a) => a.id === animal.id);
          if (idx !== -1) {
            const [exiled] = zone.splice(idx, 1);
            player.thatsIt.push(exiled);
          }
        });

        // Move all monkeys to the head of the queue
        // New monkey first, then existing monkeys in reverse order
        // (monkeys closer to exile become closer to Heaven's Gate)
        const allMonkeys: AnimalCard[] = [];

        // Get indices of all monkeys in current order (from head to exile)
        const monkeyIndices: number[] = [];
        zone.forEach((a, i) => {
          if (a.type === "monkey") monkeyIndices.push(i);
        });

        // Remove all monkeys from zone (in reverse order to maintain indices)
        for (let i = monkeyIndices.length - 1; i >= 0; i--) {
          const [monkey] = zone.splice(monkeyIndices[i], 1);
          allMonkeys.unshift(monkey); // Add to front, so they end up in reverse order
        }

        // Find the new monkey (the one just played) and put it first
        const newMonkeyIdx = allMonkeys.findIndex((a) => a.id === card.id);
        if (newMonkeyIdx !== -1) {
          const [newMonkey] = allMonkeys.splice(newMonkeyIdx, 1);
          allMonkeys.unshift(newMonkey); // New monkey is first
        }

        // Insert all monkeys at the head of the queue
        zone.unshift(...allMonkeys);

        newState.lastAction = `${player.name}'s monkey triggered chaos! ${crocsAndHippos.length} animals exiled. All monkeys moved to the front!`;
      }
      break;
    }

    case "kangaroo": {
      // Set up pending effect for jump choice
      const kangarooIdx = zone.findIndex((a) => a.id === card.id);
      const jumpOptions: number[] = [];
      if (kangarooIdx >= 1) jumpOptions.push(1);
      if (kangarooIdx >= 2) jumpOptions.push(2);

      // Auto-jump 1 if only 1 card to jump over (no choice needed)
      if (jumpOptions.length === 1 && jumpOptions[0] === 1) {
        // Automatically jump over 1 card
        const targetIdx = kangarooIdx - 1;
        const [kangaroo] = zone.splice(kangarooIdx, 1);
        zone.splice(targetIdx, 0, kangaroo);
        newState.lastAction = `${player.name}'s kangaroo jumped over 1 card!`;
      } else if (jumpOptions.length > 1) {
        // More than 1 option - show choice UI
        newState.pendingEffect = {
          kind: "kangaroo",
          playerIndex,
          jumpOptions,
        };
      }
      // If no jump options (0 cards in queue), kangaroo just stays
      break;
    }

    case "chameleon": {
      // Set up pending effect to choose a card from bumping zone to copy
      // Exclude the chameleon itself from options
      const otherAnimals = zone.filter((a) => a.id !== card.id);
      if (otherAnimals.length > 0) {
        newState.pendingEffect = {
          kind: "chameleon",
          playerIndex,
          targetOptions: otherAnimals,
        };
      }
      break;
    }

    case "parrot": {
      // Set up pending effect to choose a species type to exile
      // Get unique species types from the bumping zone (excluding the parrot itself)
      const targets = zone.filter((a) => a.id !== card.id);
      const uniqueSpeciesInZone = [...new Set(targets.map(a => a.type))];
      if (uniqueSpeciesInZone.length > 0) {
        newState.pendingEffect = {
          kind: "parrot",
          playerIndex,
          targetOptions: uniqueSpeciesInZone, // Species types the player can choose
          fromSpeciesInZone: uniqueSpeciesInZone, // All species present in zone
        };
      }
      // If no targets, parrot just stays in the queue
      break;
    }

    case "binturong": {
      // Find the 2 most powerful species types (not individual cards)
      const sorted = [...zone].sort((a, b) => b.power - a.power);
      const uniqueSpeciesTypes: AnimalType[] = [];
      const usedTypes = new Set<AnimalType>();

      for (const animal of sorted) {
        if (!usedTypes.has(animal.type)) {
          uniqueSpeciesTypes.push(animal.type);
          usedTypes.add(animal.type);
          if (uniqueSpeciesTypes.length === 2) break;
        }
      }

      // Remove ALL cards of these 2 species types from the zone
      const removedAnimals: AnimalCard[] = [];
      for (let i = zone.length - 1; i >= 0; i--) {
        if (uniqueSpeciesTypes.includes(zone[i].type)) {
          const [removed] = zone.splice(i, 1);
          removedAnimals.push(removed);
          player.thatsIt.push(removed);
        }
      }

      if (removedAnimals.length > 0) {
        newState.lastAction = `${player.name}'s binturong eliminated all ${uniqueSpeciesTypes.join(" and ")} (${removedAnimals.length} cards) to exile!`;
      }
      break;
    }
  }

  return newState;
}

// Resolve repeatable abilities (hippo, crocodile, giraffe, zebra)
export function resolveRepeatableAbilities(state: BeastyBarGameState): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;
  const zone = newState.bumpingZone.animals;

  // Process from Heaven's Gate (front) to Exile (back)
  for (let i = 0; i < zone.length; i++) {
    const animal = zone[i];
    const player = newState.players[animal.ownerIndex];

    switch (animal.type) {
      case "hippopotamus": {
        // Try to push forward
        let currentIdx = i;
        while (currentIdx > 0) {
          const nextAnimal = zone[currentIdx - 1];
          if (
            nextAnimal.type === "zebra" ||
            nextAnimal.power > animal.power ||
            (nextAnimal.type === "hippopotamus" && nextAnimal.ownerIndex === animal.ownerIndex)
          ) {
            break;
          }
          [zone[currentIdx], zone[currentIdx - 1]] = [zone[currentIdx - 1], zone[currentIdx]];
          currentIdx--;
          i = Math.max(0, i - 1); // Adjust index after swap
        }
        break;
      }

      case "crocodile": {
        // Try to eat weaker animals in front
        let currentIdx = i;
        const eaten: AnimalCard[] = [];
        while (currentIdx > 0) {
          const nextAnimal = zone[currentIdx - 1];
          if (nextAnimal.type === "zebra" || nextAnimal.power >= animal.power) {
            break;
          }
          const [eatenAnimal] = zone.splice(currentIdx - 1, 1);
          eaten.push(eatenAnimal);
          player.thatsIt.push(eatenAnimal);
          currentIdx--;
          i = Math.max(0, i - 1);
        }
        if (eaten.length > 0) {
          newState.lastAction = `${player.name}'s crocodile ate ${eaten.length} animals!`;
        }
        break;
      }

      case "giraffe": {
        // Step over one weaker animal
        if (i > 0) {
          const frontAnimal = zone[i - 1];
          if (frontAnimal.power < animal.power) {
            [zone[i], zone[i - 1]] = [zone[i - 1], zone[i]];
            i = Math.max(0, i - 1);
            newState.lastAction = `${player.name}'s giraffe stepped over!`;
          }
        }
        break;
      }
      // Zebra protection is passive - handled by other animals
    }
  }

  return newState;
}

// Check Heaven's Gate and execute exile
export function checkHeavensGate(state: BeastyBarGameState): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;
  const zone = newState.bumpingZone.animals;

  if (zone.length < 5) {
    return newState;
  }

  // Exactly 5 animals - resolve gate
  const direction = newState.bumpingZone.heavenGateDirection;

  if (direction === "normal") {
    // First 2 (closest to Heaven's Gate/front) enter Wild Cafe
    const entering = zone.splice(0, 2);
    entering.forEach((animal) => {
      const player = newState.players[animal.ownerIndex];
      player.wildCafe.push(animal);
    });

    // Last 1 (closest to Exile/back) is exiled
    const exiled = zone.pop();
    if (exiled) {
      const player = newState.players[exiled.ownerIndex];
      player.thatsIt.push(exiled);
    }
  } else {
    // Reversed direction - back becomes front
    // Last 2 (now closest to reversed Heaven's Gate) enter
    const entering = zone.splice(-2, 2);
    entering.forEach((animal) => {
      const player = newState.players[animal.ownerIndex];
      player.wildCafe.push(animal);
    });

    // First 1 (now closest to Exile) is exiled
    const exiled = zone.shift();
    if (exiled) {
      const player = newState.players[exiled.ownerIndex];
      player.thatsIt.push(exiled);
    }
  }

  newState.lastAction = `Heaven's Gate opened! 2 entered cafe, 1 was exiled.`;
  return newState;
}

// Draw a card from draw stack
export function drawCard(state: BeastyBarGameState, playerIndex: number): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;
  const player = newState.players[playerIndex];

  if (player.drawStack.length > 0) {
    const card = player.drawStack.shift()!;
    player.hand.push(card);
  }

  return newState;
}

// Check if game is over
export function checkGameOver(state: BeastyBarGameState): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;

  // Game ends when all players have played all their cards
  const allCardsPlayed = newState.players.every(
    (p) => p.hand.length === 0 && p.drawStack.length === 0
  );

  if (allCardsPlayed) {
    newState.gameOver = true;
    newState.phase = "ended";

    // Determine winner
    const counts = newState.players.map((p) => p.wildCafe.length);
    const maxCount = Math.max(...counts);
    const winners = counts
      .map((count, idx) => ({ count, idx }))
      .filter((c) => c.count === maxCount);

    if (winners.length === 1) {
      newState.winnerIndices = [winners[0].idx];
    } else {
      // Tie-breaker: lower total power wins
      const powerTotals = winners.map((w) => ({
        idx: w.idx,
        power: newState.players[w.idx].wildCafe.reduce((sum, c) => sum + c.power, 0),
      }));
      const minPower = Math.min(...powerTotals.map((p) => p.power));
      newState.winnerIndices = powerTotals.filter((p) => p.power === minPower).map((p) => p.idx);
    }
  }

  return newState;
}

// Handle pending effect choices
export function resolvePendingEffect(
  state: BeastyBarGameState,
  choice: unknown
): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;

  if (!newState.pendingEffect) return newState;

  const effect = newState.pendingEffect;
  const player = newState.players[effect.playerIndex];
  const zone = newState.bumpingZone.animals;

  switch (effect.kind) {
    case "kangaroo": {
      const jumpCount = choice as number;
      const kangarooIdx = zone.findIndex(
        (a) => a.type === "kangaroo" && a.ownerIndex === effect.playerIndex
      );
      if (kangarooIdx !== -1 && jumpCount >= 1 && jumpCount <= 2) {
        const targetIdx = Math.max(0, kangarooIdx - jumpCount);
        if (targetIdx !== kangarooIdx) {
          const [kangaroo] = zone.splice(kangarooIdx, 1);
          zone.splice(targetIdx, 0, kangaroo);
          newState.lastAction = `${player.name}'s kangaroo jumped over ${jumpCount} animals!`;
        }
      }
      break;
    }

    case "parrot": {
      // Player chooses a species type to eliminate (ALL cards of that species)
      const targetSpecies = choice as AnimalType;

      // Remove ALL cards of the chosen species from the bumping zone
      const removedAnimals: AnimalCard[] = [];
      for (let i = zone.length - 1; i >= 0; i--) {
        if (zone[i].type === targetSpecies) {
          const [removed] = zone.splice(i, 1);
          removedAnimals.push(removed);
          player.thatsIt.push(removed);
        }
      }

      if (removedAnimals.length > 0) {
        newState.lastAction = `${player.name}'s parrot eliminated all ${targetSpecies} cards (${removedAnimals.length} cards) from the line!`;
      }
      // The parrot stays in the queue (already added when played)
      break;
    }

    case "chameleon": {
      // Player chooses a card from bumping zone to copy
      const targetId = choice as string;
      const targetIdx = zone.findIndex((a) => a.id === targetId);
      const chameleonIdx = zone.findIndex(
        (a) => a.type === "chameleon" && a.ownerIndex === effect.playerIndex
      );

      if (targetIdx !== -1 && chameleonIdx !== -1) {
        const targetCard = zone[targetIdx];
        // Chameleon copies the chosen card's ability
        zone[chameleonIdx].copiedType = targetCard.type;
        newState.lastAction = `${player.name}'s chameleon copied ${targetCard.type}'s ability!`;

        // Re-resolve as the copied type (the chameleon executes the copied ability)
        // After the ability resolves, it stays as chameleon in the queue
        const resolvedState = resolveAnimalAbility(newState, zone[chameleonIdx]);
        // Update newState with the resolved state
        Object.assign(newState, resolvedState);
      }
      break;
    }

  }

  newState.pendingEffect = null;
  return newState;
}

// End turn and move to next player
export function endTurn(state: BeastyBarGameState): BeastyBarGameState {
  const newState = structuredClone(state) as BeastyBarGameState;

  // Note: Cards are drawn immediately after playing, not at end of turn
  // This ensures players always have up to 4 cards when it's their turn

  // Move to next player
  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  newState.turn++;

  return newState;
}
