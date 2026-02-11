import { describe, it, expect } from "vitest";
import {
  CONFIG,
  GAME_STATES,
  DRONE_OPTIONS,
  ASTEROID_SIZES,
} from "../config.js";

describe("CONFIG", () => {
  it("has required keys", () => {
    expect(CONFIG).toHaveProperty("bulletSpeed");
    expect(CONFIG).toHaveProperty("fireRate");
    expect(CONFIG).toHaveProperty("maxHealth");
    expect(CONFIG).toHaveProperty("waveDuration");
    expect(CONFIG).toHaveProperty("readyDuration");
    expect(CONFIG).toHaveProperty("spawnRate");
    expect(CONFIG).toHaveProperty("maxAsteroids");
  });

  it("has positive numeric values", () => {
    expect(CONFIG.bulletSpeed).toBeGreaterThan(0);
    expect(CONFIG.fireRate).toBeGreaterThan(0);
    expect(CONFIG.maxHealth).toBeGreaterThan(0);
    expect(CONFIG.waveDuration).toBeGreaterThan(0);
    expect(CONFIG.readyDuration).toBeGreaterThan(0);
    expect(CONFIG.spawnRate).toBeGreaterThan(0);
    expect(CONFIG.maxAsteroids).toBeGreaterThan(0);
  });
});

describe("GAME_STATES", () => {
  it("has all required states", () => {
    expect(GAME_STATES).toHaveProperty("BOOT");
    expect(GAME_STATES).toHaveProperty("START");
    expect(GAME_STATES).toHaveProperty("SELECT_DRONE");
    expect(GAME_STATES).toHaveProperty("READY");
    expect(GAME_STATES).toHaveProperty("COUNTDOWN");
    expect(GAME_STATES).toHaveProperty("PLAYING");
    expect(GAME_STATES).toHaveProperty("GAMEOVER");
  });

  it("has string values matching their keys", () => {
    Object.entries(GAME_STATES).forEach(([key, value]) => {
      expect(value).toBe(key);
    });
  });
});

describe("DRONE_OPTIONS", () => {
    it("is an array with 6 entries", () => {
    expect(Array.isArray(DRONE_OPTIONS)).toBe(true);
        expect(DRONE_OPTIONS).toHaveLength(6);
  });

  it("each entry has id, name, image, accel, maxSpeed, collisionRadius", () => {
    DRONE_OPTIONS.forEach((drone) => {
      expect(drone).toHaveProperty("id");
      expect(drone).toHaveProperty("name");
      expect(drone).toHaveProperty("image");
      expect(drone).toHaveProperty("accel");
      expect(drone).toHaveProperty("maxSpeed");
      expect(drone).toHaveProperty("collisionRadius");
      expect(typeof drone.id).toBe("string");
      expect(typeof drone.name).toBe("string");
      expect(typeof drone.image).toBe("string");
      expect(typeof drone.accel).toBe("number");
      expect(typeof drone.maxSpeed).toBe("number");
      expect(typeof drone.collisionRadius).toBe("number");
    });
  });

  it("has unique drone IDs", () => {
    const ids = DRONE_OPTIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ASTEROID_SIZES", () => {
  it("has large, medium, and small", () => {
    expect(ASTEROID_SIZES).toHaveProperty("large");
    expect(ASTEROID_SIZES).toHaveProperty("medium");
    expect(ASTEROID_SIZES).toHaveProperty("small");
  });

  it("each size has radius, score, split, and speed", () => {
    Object.values(ASTEROID_SIZES).forEach((size) => {
      expect(size).toHaveProperty("radius");
      expect(size).toHaveProperty("score");
      expect(size).toHaveProperty("split");
      expect(size).toHaveProperty("speed");
    });
  });

  it("large splits into medium, medium splits into small, small does not split", () => {
    expect(ASTEROID_SIZES.large.split).toBe("medium");
    expect(ASTEROID_SIZES.medium.split).toBe("small");
    expect(ASTEROID_SIZES.small.split).toBeNull();
  });
});
