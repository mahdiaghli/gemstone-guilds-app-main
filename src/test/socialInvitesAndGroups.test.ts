import { beforeEach, describe, expect, it, vi } from "vitest";

import { getGroupsRemote, sendGameInvite } from "@/lib/social";

describe("friend game invites", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
  });

  it("limits friend rooms to two humans and the supported games", () => {
    const invite = sendGameInvite({
      fromUserId: "user-1",
      toUserId: "user-2",
      gameId: "coup",
      turnTime: 30,
    });

    expect(invite).toMatchObject({
      gameId: "splendor",
      playerCount: 2,
      humanPlayers: 2,
      turnTime: 30,
    });
    expect(invite?.roomId).toMatch(/^FR-/);
  });
});

describe("group hydration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not emit another social update while reading groups", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ groups: [] }),
    }));
    const onSocialUpdate = vi.fn();
    window.addEventListener("splendor-social-updated", onSocialUpdate);

    await getGroupsRemote();

    expect(onSocialUpdate).not.toHaveBeenCalled();
    window.removeEventListener("splendor-social-updated", onSocialUpdate);
  });
});
