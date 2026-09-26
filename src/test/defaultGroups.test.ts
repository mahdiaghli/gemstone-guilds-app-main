import { describe, expect, it } from "vitest";
import { ensureDefaultGroups, generateUniqueGroupCode, repairDuplicateGroupCodes } from "../../server/defaultGroups.js";

describe("default groups", () => {
  it("adds exactly 10 distinct, joinable groups and is idempotent", () => {
    const groups = ensureDefaultGroups([]);
    expect(groups).toHaveLength(10);
    expect(new Set(groups.map((group) => group.id)).size).toBe(10);
    expect(new Set(groups.map((group) => group.name)).size).toBe(10);
    expect(new Set(groups.map((group) => group.code)).size).toBe(10);
    expect(new Set(groups.map((group) => group.flag)).size).toBe(10);
    expect(groups.every((group) => group.visibility === "public" && group.members.length === 0)).toBe(true);
    expect(ensureDefaultGroups(groups)).toBe(groups);
  });

  it("removes legacy seeded groups while preserving player-created groups", () => {
    const migrated = ensureDefaultGroups([
      { id: "default-group-011", name: "legacy" },
      { id: "group-created-by-player", name: "player group" },
    ] as any);
    expect(migrated.filter((group) => group.id.startsWith("default-group-")).length).toBe(10);
    expect(migrated.some((group) => group.id === "group-created-by-player")).toBe(true);
  });

  it("moves past a collision even when the initial code is identical", () => {
    const existing = [{ code: "GRP-000000" }, { code: "GRP-000001" }];
    expect(generateUniqueGroupCode(existing, 0)).toBe("GRP-000002");
    const repaired = repairDuplicateGroupCodes([{ id: "one", code: "GRP-GROUP1" }, { id: "two", code: "GRP-GROUP1" }]);
    expect(repaired[0].code).toBe("GRP-GROUP1");
    expect(repaired[1].code).not.toBe("GRP-GROUP1");
  });
});
