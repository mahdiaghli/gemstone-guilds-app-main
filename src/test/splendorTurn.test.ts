import { describe, expect, it } from "vitest";

import { timeoutDeadMansDraw } from "../../server/splendorTurn.js";

describe("online turn timeout", () => {
  it("advances the active player without forfeiting the game", () => {
    const state = {
      players: [{ id: 0 }, { id: 1 }],
      currentPlayerIndex: 0,
      gameOver: false,
      winner: null,
    };

    expect(timeoutDeadMansDraw(state)).toMatchObject({
      gameOver: false,
      currentPlayerIndex: 1,
    });
  });
});
