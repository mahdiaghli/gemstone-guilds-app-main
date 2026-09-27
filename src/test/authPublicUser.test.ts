import { describe, expect, it } from "vitest";
import { toPublicUser } from "@/lib/userPublic";

describe("toPublicUser", () => {
  it("strips password fields", () => {
    const publicUser = toPublicUser({
      id: "1",
      username: "ada",
      email: "a@b.c",
      createdAt: "2026-01-01",
      password: "secret",
      passwordHash: "abc",
      salt: "def",
    });
    expect(publicUser).toEqual({
      id: "1",
      username: "ada",
      email: "a@b.c",
      createdAt: "2026-01-01",
    });
    expect("password" in publicUser).toBe(false);
  });
});
