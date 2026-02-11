import { createClient } from "@supabase/supabase-js";
import { log } from "./logger.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const LOCAL_KEY = "ll_leaderboard";

function hasSupabaseConfig() {
  return (
    SUPABASE_URL.length > 0 &&
    SUPABASE_ANON_KEY.length > 0 &&
    !SUPABASE_URL.includes("YOUR_SUPABASE") &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
  );
}

function getLocalScores() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return [];
  }
}

function setLocalScores(scores) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(scores));
}

function upsertLocalScore(username, score) {
  const scores = getLocalScores();
  const existing = scores.find((entry) => entry.username === username);
  if (existing) {
    existing.score = Math.max(existing.score, score);
    existing.created_at = new Date().toISOString();
  } else {
    scores.push({
      id: crypto.randomUUID(),
      username,
      score,
      created_at: new Date().toISOString(),
    });
  }
  setLocalScores(scores);
}

function sortScores(scores) {
  return [...scores].sort((a, b) => b.score - a.score).slice(0, 20);
}

export async function submitScore(username, score) {
  if (!hasSupabaseConfig()) {
    upsertLocalScore(username, score);
    return { fallback: true };
  }
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await client.from("leaderboard").insert({ username, score });
    if (error) throw error;
    upsertLocalScore(username, score);
    return { fallback: false };
  } catch (err) {
    log("ERROR", "submitScore failed, using localStorage fallback", err);
    upsertLocalScore(username, score);
    return { fallback: true, error: err.message };
  }
}

export async function fetchLeaderboard() {
  if (!hasSupabaseConfig()) {
    return { scores: sortScores(getLocalScores()), fallback: true };
  }
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from("leaderboard")
      .select("id, username, score, created_at")
      .order("score", { ascending: false })
      .limit(20);
    if (error) throw error;
    return { scores: data || [], fallback: false };
  } catch (err) {
    log("ERROR", "fetchLeaderboard failed, using localStorage fallback", err);
    return { scores: sortScores(getLocalScores()), fallback: true, error: err.message };
  }
}

export async function fetchUserBest(username) {
  if (!hasSupabaseConfig()) {
    const scores = getLocalScores();
    const entry = scores.find((item) => item.username === username);
    return { best: entry ? entry.score : 0, fallback: true };
  }
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from("leaderboard")
      .select("score")
      .eq("username", username)
      .order("score", { ascending: false })
      .limit(1);
    if (error) throw error;
    return { best: data && data.length ? data[0].score : 0, fallback: false };
  } catch (err) {
    log("ERROR", "fetchUserBest failed, using localStorage fallback", err);
    const scores = getLocalScores();
    const entry = scores.find((item) => item.username === username);
    return { best: entry ? entry.score : 0, fallback: true, error: err.message };
  }
}

export function leaderboardNeedsWarning() {
  return !hasSupabaseConfig();
}
