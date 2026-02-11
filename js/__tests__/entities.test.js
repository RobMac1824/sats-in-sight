import { describe, it, expect, beforeEach, vi } from "vitest";
import { state, resetGameState } from "../state.js";
import { STAR_COUNT, ASTEROID_SIZES } from "../config.js";
import {
  triggerShake,
  initStars,
  wrapEntity,
  bumpCombo,
  addScore,
  spawnAsteroid,
} from "../entities.js";

describe("triggerShake", () => {
  it("sets shake state correctly", () => {
    triggerShake(0.5, 10);
    expect(state.shakeTime).toBe(0.5);
    expect(state.shakeDuration).toBe(0.5);
    expect(state.shakeMagnitude).toBe(10);
  });

  it("overwrites previous shake values", () => {
    triggerShake(0.3, 5);
    triggerShake(0.8, 15);
    expect(state.shakeTime).toBe(0.8);
    expect(state.shakeDuration).toBe(0.8);
    expect(state.shakeMagnitude).toBe(15);
  });
});

describe("initStars", () => {
  beforeEach(() => {
    state.game.viewW = 800;
    state.game.viewH = 600;
    state.stars = [];
  });

  it("populates state.stars with STAR_COUNT entries", () => {
    initStars();
    expect(state.stars).toHaveLength(STAR_COUNT);
  });

  it("each star has x, y, size, speed, drift properties", () => {
    initStars();
    state.stars.forEach((star) => {
      expect(star).toHaveProperty("x");
      expect(star).toHaveProperty("y");
      expect(star).toHaveProperty("size");
      expect(star).toHaveProperty("speed");
      expect(star).toHaveProperty("drift");
      expect(typeof star.x).toBe("number");
      expect(typeof star.y).toBe("number");
      expect(typeof star.size).toBe("number");
      expect(typeof star.speed).toBe("number");
      expect(typeof star.drift).toBe("number");
    });
  });

  it("clears existing stars before populating", () => {
    state.stars = [{ x: 1, y: 1, size: 1, speed: 1, drift: 1 }];
    initStars();
    expect(state.stars).toHaveLength(STAR_COUNT);
  });
});

describe("wrapEntity", () => {
  beforeEach(() => {
    state.game.viewW = 800;
    state.game.viewH = 600;
  });

  it("wraps entity past left edge to right side", () => {
    const entity = { x: -80, y: 300, radius: 50 };
    wrapEntity(entity);
    expect(entity.x).toBe(800 + 70); // viewW + margin
  });

  it("wraps entity past right edge to left side", () => {
    const entity = { x: 880, y: 300, radius: 50 };
    wrapEntity(entity);
    expect(entity.x).toBe(-70); // -margin
  });

  it("wraps entity past top edge to bottom side", () => {
    const entity = { x: 400, y: -80, radius: 50 };
    wrapEntity(entity);
    expect(entity.y).toBe(600 + 70); // viewH + margin
  });

  it("wraps entity past bottom edge to top side", () => {
    const entity = { x: 400, y: 680, radius: 50 };
    wrapEntity(entity);
    expect(entity.y).toBe(-70); // -margin
  });

  it("does not wrap entity within bounds", () => {
    const entity = { x: 400, y: 300, radius: 50 };
    wrapEntity(entity);
    expect(entity.x).toBe(400);
    expect(entity.y).toBe(300);
  });
});

describe("bumpCombo", () => {
  beforeEach(() => {
    state.combo = 0;
    state.lastComboTime = 0;
  });

  it("sets combo to 1 when called with no prior combo", () => {
    bumpCombo(1000);
    expect(state.combo).toBe(1);
  });

  it("increments combo when called within time window (1200ms)", () => {
    bumpCombo(1000);
    expect(state.combo).toBe(1);
    bumpCombo(1500); // 500ms later, within 1200ms window
    expect(state.combo).toBe(2);
    bumpCombo(2000); // 500ms later, within 1200ms window
    expect(state.combo).toBe(3);
  });

  it("resets combo to 1 when called outside time window", () => {
    bumpCombo(1000);
    expect(state.combo).toBe(1);
    bumpCombo(3000); // 2000ms later, outside 1200ms window
    expect(state.combo).toBe(1);
  });

  it("updates lastComboTime", () => {
    bumpCombo(5000);
    expect(state.lastComboTime).toBe(5000);
  });
});

describe("addScore", () => {
  beforeEach(() => {
    state.score = 0;
    state.combo = 0;
    state.lastComboTime = 0;
  });

  it("adds base score with combo multiplier", () => {
    // First call: combo starts at 0, bumpCombo sets it to 1
    // multiplier = 1 + min(4, 1 * 0.15) = 1.15
    addScore(100, 1000);
    expect(state.score).toBe(Math.round(100 * 1.15));
  });

  it("applies increasing combo multiplier", () => {
    addScore(100, 1000); // combo becomes 1, mult 1.15
    const firstScore = state.score;
    addScore(100, 1500); // combo becomes 2, mult 1.30
    expect(state.score).toBe(firstScore + Math.round(100 * 1.3));
  });

  it("caps combo multiplier at 1 + 4 = 5", () => {
    // Build up a very high combo
    let now = 1000;
    for (let i = 0; i < 30; i++) {
      state.combo = 29; // force high combo
      state.lastComboTime = now;
      now += 100;
    }
    state.score = 0;
    state.combo = 100; // very high combo
    state.lastComboTime = now;
    addScore(100, now + 100);
    // combo becomes 101, multiplier = 1 + min(4, 101 * 0.15) = 1 + 4 = 5
    expect(state.score).toBe(Math.round(100 * 5));
  });
});

describe("spawnAsteroid", () => {
  beforeEach(() => {
    state.game.viewW = 800;
    state.game.viewH = 600;
    state.wave = 1;
    state.asteroids = [];
  });

  it("adds an asteroid to state.asteroids", () => {
    spawnAsteroid("large");
    expect(state.asteroids).toHaveLength(1);
  });

  it("spawned asteroid has correct properties", () => {
    spawnAsteroid("large");
    const asteroid = state.asteroids[0];
    expect(asteroid).toHaveProperty("x");
    expect(asteroid).toHaveProperty("y");
    expect(asteroid).toHaveProperty("vx");
    expect(asteroid).toHaveProperty("vy");
    expect(asteroid).toHaveProperty("radius");
    expect(asteroid).toHaveProperty("size");
    expect(asteroid).toHaveProperty("angle");
    expect(asteroid).toHaveProperty("spin");
    expect(asteroid).toHaveProperty("points");
    expect(asteroid.size).toBe("large");
    expect(asteroid.radius).toBe(ASTEROID_SIZES.large.radius);
  });

  it("spawns at given position when provided", () => {
    spawnAsteroid("medium", { x: 100, y: 200 });
    const asteroid = state.asteroids[0];
    expect(asteroid.x).toBe(100);
    expect(asteroid.y).toBe(200);
    expect(asteroid.size).toBe("medium");
    expect(asteroid.radius).toBe(ASTEROID_SIZES.medium.radius);
  });

  it("spawns small asteroids correctly", () => {
    spawnAsteroid("small", { x: 50, y: 50 });
    const asteroid = state.asteroids[0];
    expect(asteroid.size).toBe("small");
    expect(asteroid.radius).toBe(ASTEROID_SIZES.small.radius);
  });

  it("asteroid has polygon points", () => {
    spawnAsteroid("large");
    const asteroid = state.asteroids[0];
    expect(Array.isArray(asteroid.points)).toBe(true);
    expect(asteroid.points.length).toBeGreaterThanOrEqual(7);
    asteroid.points.forEach((point) => {
      expect(point).toHaveProperty("angle");
      expect(point).toHaveProperty("radius");
    });
  });
});
