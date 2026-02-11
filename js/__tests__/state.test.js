import { describe, it, expect, beforeEach } from "vitest";
import { state, resetGameState } from "../state.js";
import { CONFIG } from "../config.js";

describe("resetGameState", () => {
  beforeEach(() => {
    // Mutate state to non-default values before resetting
    state.score = 999;
    state.health = 10;
    state.wave = 5;
    state.combo = 12;
    state.lastComboTime = 99999;
    state.waveTimer = 5000;
    state.elapsed = 10000;
    state.danger = 80;
    state.satsCollected = 42;
    state.shots = [{ x: 1 }];
    state.asteroids = [{ x: 2 }];
    state.particles = [{ x: 3 }];
    state.fxBursts = [{ x: 4 }];
    state.flashes = [{ x: 5 }];
    state.hitPopups = [{ x: 6 }];
    state.isTouching = true;
    state.lastPointerCanvas = { x: 100, y: 100 };
  });

  it("resets score to 0", () => {
    resetGameState();
    expect(state.score).toBe(0);
  });

  it("resets health to maxHealth", () => {
    resetGameState();
    expect(state.health).toBe(CONFIG.maxHealth);
  });

  it("resets wave to 1", () => {
    resetGameState();
    expect(state.wave).toBe(1);
  });

  it("resets combo to 0", () => {
    resetGameState();
    expect(state.combo).toBe(0);
  });

  it("empties shots, asteroids, and particles arrays", () => {
    resetGameState();
    expect(state.shots).toEqual([]);
    expect(state.asteroids).toEqual([]);
    expect(state.particles).toEqual([]);
  });

  it("empties fxBursts, flashes, and hitPopups arrays", () => {
    resetGameState();
    expect(state.fxBursts).toEqual([]);
    expect(state.flashes).toEqual([]);
    expect(state.hitPopups).toEqual([]);
  });

  it("centers player position based on viewport", () => {
    state.game.viewW = 800;
    state.game.viewH = 600;
    resetGameState();
    expect(state.player.x).toBe(400); // viewW * 0.5
    expect(state.player.y).toBe(330); // viewH * 0.55
  });

  it("resets player velocity to 0", () => {
    resetGameState();
    expect(state.player.vx).toBe(0);
    expect(state.player.vy).toBe(0);
  });

  it("sets player angle to -PI/2 (pointing up)", () => {
    resetGameState();
    expect(state.player.angle).toBe(-Math.PI / 2);
  });

  it("resets danger to 0", () => {
    resetGameState();
    expect(state.danger).toBe(0);
  });

  it("resets satsCollected to 0", () => {
    resetGameState();
    expect(state.satsCollected).toBe(0);
  });

  it("resets touch state", () => {
    resetGameState();
    expect(state.isTouching).toBe(false);
    expect(state.lastPointerCanvas).toBeNull();
  });
});
