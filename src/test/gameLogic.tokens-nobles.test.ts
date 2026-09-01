import { describe, expect, it } from "vitest";
import { initializeGame, performTakeTokens, advanceTurn } from "@/lib/gameLogic";

describe("performTakeTokens", () => {
  it("rejects a single token when three colors are available", () => {
    const state = initializeGame(2);
    const next = performTakeTokens(state, ["diamond"]);
    expect(next).toBe(state);
  });

  it("accepts three different tokens", () => {
    const state = initializeGame(2);
    const next = performTakeTokens(state, ["diamond", "sapphire", "emerald"]);
    expect(next).not.toBe(state);
    expect(next.players[0].tokens.diamond).toBe(1);
  });
});

describe("nobles", () => {
  it("allows a second noble on a later turn", () => {
    let state = initializeGame(2);
    state.currentPlayerIndex = 0;
    state.nobles = [
      { id: 1, points: 3, requirements: { diamond: 4, sapphire: 4 } },
      { id: 2, points: 3, requirements: { emerald: 4, ruby: 4 } },
    ];
    const four = (gem: "diamond" | "sapphire" | "emerald" | "ruby") =>
      Array.from({ length: 4 }, (_, i) => ({
        id: `${gem}-${i}`,
        level: 1 as const,
        gemBonus: gem,
        points: 0,
        cost: {},
      }));
    state.players[0].cards = [...four("diamond"), ...four("sapphire")];
    state = advanceTurn(state);
    expect(state.players[0].nobles).toHaveLength(1);
    state.currentPlayerIndex = 0;
    state.players[0].cards = [
      ...state.players[0].cards,
      ...four("emerald"),
      ...four("ruby"),
    ];
    state = advanceTurn(state);
    expect(state.players[0].nobles).toHaveLength(2);
  });
});
