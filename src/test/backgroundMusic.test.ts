import { describe, expect, it } from "vitest";

import { parseStoredMusicVolume } from "@/hooks/useBackgroundMusic";

describe("background music volume", () => {
  it("uses an audible default when no preference has been saved", () => {
    expect(parseStoredMusicVolume(null)).toBe(0.5);
  });

  it("preserves an intentional mute and rejects invalid values", () => {
    expect(parseStoredMusicVolume("0")).toBe(0);
    expect(parseStoredMusicVolume("not-a-number")).toBe(0.5);
    expect(parseStoredMusicVolume("2")).toBe(0.5);
  });
});
