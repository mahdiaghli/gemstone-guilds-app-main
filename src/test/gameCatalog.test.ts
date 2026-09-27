import { describe, expect, it } from "vitest";
import { getGameById } from "@/lib/gameCatalog";

describe("game catalog", () => {
  it("does not treat coup as splendor", () => {
    expect(getGameById("coup").id).toBe("coup");
    expect(getGameById("coup").playable).toBe(false);
  });
});
