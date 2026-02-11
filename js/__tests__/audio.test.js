import { describe, it, expect } from "vitest";
import { toggleMute } from "../audio.js";

describe("toggleMute", () => {
  it("first call returns true (muted)", () => {
    // audio module starts with muted = false
    const result = toggleMute();
    expect(result).toBe(true);
  });

  it("second call returns false (unmuted)", () => {
    const result = toggleMute();
    expect(result).toBe(false);
  });

  it("toggles back and forth", () => {
    expect(toggleMute()).toBe(true);
    expect(toggleMute()).toBe(false);
    expect(toggleMute()).toBe(true);
  });
});
