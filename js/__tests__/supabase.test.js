import { describe, it, expect, beforeEach } from "vitest";
import { submitScore, fetchLeaderboard, fetchUserBest } from "../supabase.js";

// Since VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set,
// all functions will use the localStorage fallback path.

const LOCAL_KEY = "ll_leaderboard";

describe("supabase localStorage fallback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("submitScore", () => {
    it("uses localStorage when no supabase config", async () => {
      const result = await submitScore("TestUser", 100);
      expect(result.fallback).toBe(true);
    });

    it("stores score in localStorage", async () => {
      await submitScore("TestUser", 500);
      const stored = JSON.parse(localStorage.getItem(LOCAL_KEY));
      expect(stored).toHaveLength(1);
      expect(stored[0].username).toBe("TestUser");
      expect(stored[0].score).toBe(500);
    });

    it("upserts score - keeps higher score for same user", async () => {
      await submitScore("TestUser", 500);
      await submitScore("TestUser", 300);
      const stored = JSON.parse(localStorage.getItem(LOCAL_KEY));
      expect(stored).toHaveLength(1);
      expect(stored[0].score).toBe(500); // keeps the higher one
    });

    it("upserts score - updates when new score is higher", async () => {
      await submitScore("TestUser", 300);
      await submitScore("TestUser", 700);
      const stored = JSON.parse(localStorage.getItem(LOCAL_KEY));
      expect(stored).toHaveLength(1);
      expect(stored[0].score).toBe(700);
    });
  });

  describe("fetchLeaderboard", () => {
    it("returns local scores with fallback flag", async () => {
      const result = await fetchLeaderboard();
      expect(result.fallback).toBe(true);
      expect(Array.isArray(result.scores)).toBe(true);
    });

    it("returns scores sorted descending", async () => {
      await submitScore("Alice", 100);
      await submitScore("Bob", 300);
      await submitScore("Charlie", 200);
      const result = await fetchLeaderboard();
      expect(result.scores[0].score).toBe(300);
      expect(result.scores[1].score).toBe(200);
      expect(result.scores[2].score).toBe(100);
    });

    it("limits results to 20 entries", async () => {
      for (let i = 0; i < 25; i++) {
        await submitScore(`User${i}`, i * 10);
      }
      const result = await fetchLeaderboard();
      expect(result.scores.length).toBeLessThanOrEqual(20);
    });
  });

  describe("fetchUserBest", () => {
    it("returns 0 when no scores exist", async () => {
      const result = await fetchUserBest("Nobody");
      expect(result.best).toBe(0);
      expect(result.fallback).toBe(true);
    });

    it("returns user best score", async () => {
      await submitScore("TestUser", 500);
      const result = await fetchUserBest("TestUser");
      expect(result.best).toBe(500);
      expect(result.fallback).toBe(true);
    });

    it("returns 0 for unknown user when others exist", async () => {
      await submitScore("Alice", 100);
      const result = await fetchUserBest("Bob");
      expect(result.best).toBe(0);
    });
  });
});
