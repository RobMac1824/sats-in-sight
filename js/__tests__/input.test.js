import { describe, it, expect } from "vitest";
import { applyStickCurve } from "../input.js";

describe("applyStickCurve", () => {
  it("returns zero vector for zero input", () => {
    const result = applyStickCurve({ x: 0, y: 0 });
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("applies response curve to non-zero vector", () => {
    const result = applyStickCurve({ x: 0.5, y: 0 });
    // magnitude = 0.5, curved = 0.5^1.6, scale = curved/0.5
    // result.x = 0.5 * scale, result.y = 0
    const magnitude = 0.5;
    const curved = Math.pow(magnitude, 1.6);
    expect(result.x).toBeCloseTo(curved, 5);
    expect(result.y).toBe(0);
  });

  it("applies response curve to diagonal vector", () => {
    const result = applyStickCurve({ x: 0.5, y: 0.5 });
    const magnitude = Math.hypot(0.5, 0.5);
    const curved = Math.pow(magnitude, 1.6);
    const scale = curved / magnitude;
    expect(result.x).toBeCloseTo(0.5 * scale, 5);
    expect(result.y).toBeCloseTo(0.5 * scale, 5);
  });

  it("returns unit-length scaled vector for unit input", () => {
    const result = applyStickCurve({ x: 1, y: 0 });
    // magnitude = 1, curved = 1^1.6 = 1, scale = 1
    expect(result.x).toBeCloseTo(1, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("preserves direction of the vector", () => {
    const result = applyStickCurve({ x: -0.3, y: 0.4 });
    // Direction should be preserved (negative x, positive y)
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeGreaterThan(0);
  });
});
