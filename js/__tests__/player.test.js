import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../state.js";
import { CONFIG, DRONE_OPTIONS } from "../config.js";
import { getDroneById, setActiveDrone } from "../player.js";

describe("getDroneById", () => {
  it("returns correct drone for valid ID", () => {
    const racer = getDroneById("racer");
    expect(racer.id).toBe("racer");
    expect(racer.name).toBe("Racer");
  });

  it("returns correct drone for each known ID", () => {
    DRONE_OPTIONS.forEach((drone) => {
      const result = getDroneById(drone.id);
      expect(result.id).toBe(drone.id);
      expect(result.name).toBe(drone.name);
    });
  });

  it("returns default (first) drone for invalid ID", () => {
    const result = getDroneById("nonexistent");
    expect(result.id).toBe(DRONE_OPTIONS[0].id);
  });

  it("returns default (first) drone for undefined", () => {
    const result = getDroneById(undefined);
    expect(result.id).toBe(DRONE_OPTIONS[0].id);
  });
});

describe("setActiveDrone", () => {
  beforeEach(() => {
    // Reset to defaults
    state.activeDroneId = DRONE_OPTIONS[0].id;
    state.activeDrone = { ...DRONE_OPTIONS[0] };
  });

  it("updates state.activeDroneId", () => {
    setActiveDrone("racer");
    expect(state.activeDroneId).toBe("racer");
  });

  it("updates state.activeDrone with drone properties", () => {
    setActiveDrone("racer");
    const racer = DRONE_OPTIONS.find((d) => d.id === "racer");
    expect(state.activeDrone.id).toBe(racer.id);
    expect(state.activeDrone.name).toBe(racer.name);
    expect(state.activeDrone.accel).toBe(racer.accel);
    expect(state.activeDrone.maxSpeed).toBe(racer.maxSpeed);
    expect(state.activeDrone.collisionRadius).toBe(racer.collisionRadius);
  });

  it("resets currentFireRate to CONFIG.fireRate", () => {
    state.currentFireRate = 999;
    setActiveDrone("freestyle");
    expect(state.currentFireRate).toBe(CONFIG.fireRate);
  });

  it("resets maxHealth to CONFIG.maxHealth", () => {
    state.maxHealth = 50;
    setActiveDrone("heavy-lift");
    expect(state.maxHealth).toBe(CONFIG.maxHealth);
  });

  it("falls back to first drone for invalid ID", () => {
    setActiveDrone("nonexistent");
    expect(state.activeDrone.id).toBe(DRONE_OPTIONS[0].id);
  });
});
