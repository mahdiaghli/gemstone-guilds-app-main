import { describe, expect, it } from "vitest";
import { advanceTurn, getPlayerScore, initializeGame } from "@/lib/gameLogic";

describe("advanceTurn final round", () => {
  it("lets all remaining players play after someone reaches 15", () => {
    let state = initializeGame(3);

    state.currentPlayerIndex = 1;
    state.players[1].cards = [
      {
        id: 9991,
        level: 3,
        gemBonus: "diamond",
        points: 15,
        cost: {},
      },
    ];

    state = advanceTurn(state);

    expect(state.isLastRound).toBe(true);
    expect(state.lastRoundTriggerIndex).toBe(1);
    expect(state.gameOver).toBe(false);
    expect(state.currentPlayerIndex).toBe(2);

    state = advanceTurn(state);
    expect(state.gameOver).toBe(false);
    expect(state.currentPlayerIndex).toBe(0);

    state.players[0].cards = [
      {
        id: 9992,
        level: 3,
        gemBonus: "ruby",
        points: 16,
        cost: {},
      },
    ];

    state = advanceTurn(state);

    expect(state.gameOver).toBe(true);
    expect(state.winner).toBe(0);
    expect(getPlayerScore(state.players[0])).toBeGreaterThan(
      getPlayerScore(state.players[1]),
    );
  });

  it("gives at most one noble per turn", () => {
    let state = initializeGame(2);
    state.currentPlayerIndex = 0;
    state.nobles = [
      { id: 1, points: 3, requirements: { diamond: 4, sapphire: 4 } },
      { id: 2, points: 3, requirements: { emerald: 4, ruby: 4 } },
    ];
    state.players[0].cards = [
      { id: 1, level: 1, gemBonus: "diamond", points: 0, cost: {} },
      { id: 2, level: 1, gemBonus: "diamond", points: 0, cost: {} },
      { id: 3, level: 1, gemBonus: "diamond", points: 0, cost: {} },
      { id: 4, level: 1, gemBonus: "diamond", points: 0, cost: {} },
      { id: 5, level: 1, gemBonus: "sapphire", points: 0, cost: {} },
      { id: 6, level: 1, gemBonus: "sapphire", points: 0, cost: {} },
      { id: 7, level: 1, gemBonus: "sapphire", points: 0, cost: {} },
      { id: 8, level: 1, gemBonus: "sapphire", points: 0, cost: {} },
      { id: 9, level: 1, gemBonus: "emerald", points: 0, cost: {} },
      { id: 10, level: 1, gemBonus: "emerald", points: 0, cost: {} },
      { id: 11, level: 1, gemBonus: "emerald", points: 0, cost: {} },
      { id: 12, level: 1, gemBonus: "emerald", points: 0, cost: {} },
      { id: 13, level: 1, gemBonus: "ruby", points: 0, cost: {} },
      { id: 14, level: 1, gemBonus: "ruby", points: 0, cost: {} },
      { id: 15, level: 1, gemBonus: "ruby", points: 0, cost: {} },
      { id: 16, level: 1, gemBonus: "ruby", points: 0, cost: {} },
    ];

    state = advanceTurn(state);
    expect(state.players[0].nobles).toHaveLength(1);
    expect(state.nobles).toHaveLength(1);
  });
});
