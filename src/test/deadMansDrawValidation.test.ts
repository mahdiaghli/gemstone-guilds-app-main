import { describe, expect, it } from "vitest";
import { initializeDeadMansDrawGame, selectDeadMansDrawRing } from "@/lib/deadMansDraw";
import { isValidDeadMansDrawState, isValidInitialDeadMansDrawState } from "../../server/deadMansDrawValidation.js";
import { timeoutDeadMansDraw } from "../../server/splendorTurn.js";

describe("Dead Man's Draw server state guard", () => {
  it("accepts a new game and rejects duplicated, forged or missing cards", () => {
    const state = initializeDeadMansDrawGame(2);
    expect(isValidInitialDeadMansDrawState(state, 2)).toBe(true);
    const duplicated = structuredClone(state);
    duplicated.drawPile[0] = duplicated.drawPile[1];
    expect(isValidDeadMansDrawState(duplicated, 2)).toBe(false);
    const forged = structuredClone(state);
    forged.drawPile[0].value = 999;
    expect(isValidDeadMansDrawState(forged, 2)).toBe(false);
    const missing = structuredClone(state);
    missing.drawPile.pop();
    expect(isValidDeadMansDrawState(missing, 2)).toBe(false);
  });

  it("preserves cards on timeout and advances ring selection", () => {
    const initial = initializeDeadMansDrawGame(2);
    const chosen = selectDeadMansDrawRing(initial, initial.players[0].ringOptions[0]);
    expect(isValidDeadMansDrawState(chosen, 2)).toBe(true);
    expect(chosen.ringSelectionIndex).toBe(1);
    const afterTimeout = timeoutDeadMansDraw(chosen);
    expect(afterTimeout.ringSelectionIndex).toBeNull();
    expect(isValidDeadMansDrawState(afterTimeout, 2)).toBe(true);
    const withTreasure = structuredClone(afterTimeout);
    withTreasure.treasureArea.push(withTreasure.drawPile.pop()!);
    const timedOut = timeoutDeadMansDraw(withTreasure);
    expect(timedOut.treasureArea).toHaveLength(0);
    expect(isValidDeadMansDrawState(timedOut, 2)).toBe(true);
  });
});
