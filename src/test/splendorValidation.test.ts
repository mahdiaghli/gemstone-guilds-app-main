import { describe, expect, it } from "vitest";
import { initializeGame, performTakeTokens, performReserveCard, advanceTurn } from "@/lib/gameLogic";
import { isValidInitialSplendorState, isValidSplendorTransition } from "../../server/splendorValidation.js";

describe("server-side Splendor validation", () => {
  it("accepts a normal game start and legal turn", () => {
    const initial = initializeGame(2);
    expect(isValidInitialSplendorState(initial, 2)).toBe(true);
    const afterTake = performTakeTokens(initial, ["diamond", "sapphire", "emerald"]);
    expect(isValidSplendorTransition(initial, afterTake)).toBe(true);
    expect(isValidSplendorTransition(initial, advanceTurn(afterTake))).toBe(true);
  });

  it("rejects fabricated tokens and a move from another room", () => {
    const roomA = initializeGame(2);
    const roomB = initializeGame(2);
    const forged = structuredClone(roomA);
    forged.players[0].tokens.gold = 4;
    expect(isValidSplendorTransition(roomA, forged)).toBe(false);
    const movedInRoomA = performTakeTokens(roomA, ["diamond"]);
    expect(isValidSplendorTransition(roomB, movedInRoomA)).toBe(false);
  });

  it("accepts visible-card and deck reservations", () => {
    const initial = initializeGame(2);
    const visible = performReserveCard(initial, initial.visibleCards[1][0]!.id);
    expect(isValidSplendorTransition(initial, visible)).toBe(true);
    const hidden = performReserveCard(initial, "", 2);
    expect(isValidSplendorTransition(initial, hidden)).toBe(true);
  });
});
