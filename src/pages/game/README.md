# Splendor Game Controller Modularization

This directory contains the modularized Splendor game controller logic. The original `useSplendorGameController.ts` file has been divided into smaller, more focused modules to improve maintainability and debuggability.

## Module Structure

### `useSplendorGameController.ts`
The main controller that orchestrates all game logic. It serves as the central hub that:
- Manages game state and UI state
- Coordinates between different modules
- Handles game initialization and setup
- Manages challenge modes (daily puzzle, bot survival, turn limit)
- Provides scene props to the game UI

### `useSplendorTutorial.ts`
Handles all tutorial-related logic:
- Defines tutorial steps (11 steps total)
- Validates whether actions are allowed during tutorial
- Provides RTL direction support for Persian mode
- Returns tutorial data including steps, validation function, and text direction

**Key exports:**
- `interactiveTutorialSteps`: Array of tutorial step objects with title, description, focus area, and action type
- `isTutorialActionAllowed`: Function to validate if a player action is allowed during the current tutorial step
- `tutorialData`: Object containing steps and text direction (`rtl` or `ltr`)

### `useSplendorSocket.ts`
Manages Socket.IO event handling for online multiplayer:
- Game state updates from server
- Player removal events
- Turn timer updates
- Rematch requests and results
- Navigation to menu on rematch acceptance

**Key exports:**
- `useSplendorSocket`: Hook that sets up all socket event listeners

### `useSplendorAI.ts`
Handles AI player decision-making and animations:
- AI action selection using `getAIActionCandidates`
- Preview actions to filter legal moves
- Execute AI actions with animations:
  - Token taking animations
  - Card purchase animations (including token payment and noble acquisition)
  - Card reservation animations (including gold token)
- Fallback actions when no legal moves available

**Key exports:**
- `executeSplendorAI`: Function that executes a complete AI turn with animations

### `useSplendorActions.ts`
Handles player game actions:
- Gem token selection (`handleGemClick`)
- Token confirmation (`handleConfirmTokens`)
- Action cancellation (`handleCancel`)
- AI turn blocking (silently blocks actions during AI turns)
- Tutorial validation
- Daily puzzle validation
- Animation triggering for token movements

**Key exports:**
- `handleGemClick`: Handler for clicking gem tokens
- `handleConfirmTokens`: Handler for confirming token selection
- `handleCancel`: Handler for canceling actions

## Integration

The main controller imports and uses these modules:

```typescript
import { useSplendorTutorial } from "./useSplendorTutorial";
import { useSplendorSocket } from "./useSplendorSocket";
import { executeSplendorAI } from "./useSplendorAI";
import { useSplendorActions } from "./useSplendorActions";

// Use tutorial module
const { interactiveTutorialSteps, isTutorialActionAllowed, tutorialData } = useSplendorTutorial({...});

// Use actions module
const { handleGemClick, handleConfirmTokens, handleCancel: handleCancelAction } = useSplendorActions({...});

// Execute AI in useEffect
executeSplendorAI({...});
```

## Tutorial Features

The tutorial module supports:

1. **RTL Support**: When `lang === "fa"`, the tutorial text direction is set to `"rtl"` for right-to-left rendering.

2. **First-Time Player Detection**: Uses `localStorage` to check if the player has completed the tutorial before. First-time players automatically see the tutorial.

3. **Close Button Hiding**: The `isFirstTime` flag is passed to the tutorial UI to conditionally hide the close button for first-time players.

4. **Finish Button Hiding**: The `isLastStep` flag is passed to the tutorial UI to conditionally hide the finish button on the last step (11th).

5. **Tutorial Mode Blocking**: During interactive tutorial, AI turns are disabled and game over handling is prevented to create a controlled learning environment.

6. **Action Validation**: The `isTutorialActionAllowed` function ensures players can only perform actions specified in the current tutorial step.

## AI Turn Blocking

Human players cannot take tokens or cards during AI turns. This is implemented in `useSplendorActions.ts` by checking `isAIPlayer(state.currentPlayerIndex)` and silently blocking actions without showing a popup message.

## Persian Mode Layout

No layout changes are made to UI elements (treasure area, burn pile, player panels, draw deck) when in Persian mode. Animations continue to work correctly with the existing layout.

## Debugging Tips

1. **Tutorial Issues**: Check `useSplendorTutorial.ts` for step definitions and validation logic.
2. **AI Issues**: Check `useSplendorAI.ts` for action selection and animation logic.
3. **Socket Issues**: Check `useSplendorSocket.ts` for event listener setup.
4. **Action Issues**: Check `useSplendorActions.ts` for action handlers and validation.
5. **General Issues**: Check `useSplendorGameController.ts` for state management and coordination.

## Adding New Features

When adding new features:

1. Determine which module the feature belongs to:
   - Tutorial logic → `useSplendorTutorial.ts`
   - AI logic → `useSplendorAI.ts`
   - Socket/online logic → `useSplendorSocket.ts`
   - Player actions → `useSplendorActions.ts`
   - General coordination → `useSplendorGameController.ts`

2. Add the logic to the appropriate module
3. Export the necessary functions/data
4. Import and use in the main controller
5. Update this README if the structure changes

## File Sizes

- `useSplendorGameController.ts`: ~67KB (main controller)
- `useSplendorTutorial.ts`: ~4KB (tutorial logic)
- `useSplendorSocket.ts`: ~2KB (socket handlers)
- `useSplendorAI.ts`: ~9KB (AI logic)
- `useSplendorActions.ts`: ~9KB (action handlers)

The modularization reduces the main controller from a monolithic file to a more manageable structure while maintaining clear separation of concerns.
