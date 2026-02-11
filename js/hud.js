import { state } from "./state.js";
import { GAME_STATES, lingoSnippets } from "./config.js";
import { initStars } from "./entities.js";
import { leaderboardNeedsWarning } from "./supabase.js";

export const hudScore = document.getElementById("score");
export const hudCombo = document.getElementById("combo");
export const hudWave = document.getElementById("hud-wave");
export const healthFill = document.getElementById("healthFill");
export const healthValue = document.getElementById("healthValue");
export const hud = document.getElementById("hud");
export const dangerFill = document.getElementById("dangerFill");
const hudLingo = document.getElementById("hud-lingo");
const hudAlt = document.getElementById("hud-alt");
const hudSpd = document.getElementById("hud-spd");
const hudRssi = document.getElementById("hud-rssi");
const hudLq = document.getElementById("hud-lq");
const hudSat = document.getElementById("hud-sat");
const hudVtx = document.getElementById("hud-vtx");
export const levelCallout = document.getElementById("level-callout");
export const hudCallout = document.getElementById("hud-callout");
export const readyPanel = document.getElementById("readyPanel");
export const startScreen = document.getElementById("startScreen");
export const gameOverScreen = document.getElementById("gameOverScreen");
const _startButton = document.getElementById("startButton");
const _restartButton = document.getElementById("restartButton");
export const usernameInput = document.getElementById("username");
export const finalScore = document.getElementById("finalScore");
export const finalWave = document.getElementById("finalWave");
export const finalCombo = document.getElementById("finalCombo");
export const leaderboardList = document.getElementById("leaderboardList");
export const yourBest = document.getElementById("yourBest");
export const diagnosticsToggle = document.getElementById("diagnosticsToggle");
export const diagnostics = document.getElementById("diagnostics");
export const fpsEl = document.getElementById("fps");
const stateEl = document.getElementById("stateValue");
export const dtEl = document.getElementById("dtValue");
export const dprEl = document.getElementById("dprValue");
export const viewEl = document.getElementById("viewValue");
export const canvasSizeEl = document.getElementById("canvasSizeValue");
export const insetEl = document.getElementById("insetValue");
export const warningBanner = document.getElementById("warning");
export const muteButton = document.getElementById("muteButton");
const hudStack = document.getElementById("hud-stack");
const dangerGauge = document.getElementById("dangerGauge");

export function showWaveCallout() {
  const message = `Lingo Lingo – Wave ${state.wave}`;
  hudCallout.textContent = message;
  levelCallout.textContent = `WAVE ${state.wave}`;
  levelCallout.classList.remove("hidden");
  state.lastWaveCallout = performance.now();
  setTimeout(() => levelCallout.classList.add("hidden"), 1400);
}

export function showRadioCallout(message) {
  hudCallout.textContent = message;
  hudCallout.classList.add("active");
  setTimeout(() => hudCallout.classList.remove("active"), 1200);
}

export function hideAllScreens() {
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  readyPanel.classList.add("hidden");
  hud.classList.add("hidden");
  dangerGauge.classList.add("hidden");
}

export function setState(nextState) {
  state.game.state = nextState;
  hideAllScreens();
  switch (nextState) {
    case GAME_STATES.START:
    case GAME_STATES.SELECT_DRONE:
      startScreen.classList.remove("hidden");
      break;
    case GAME_STATES.READY:
      hud.classList.remove("hidden");
      dangerGauge.classList.remove("hidden");
      readyPanel.classList.remove("hidden");
      break;
    case GAME_STATES.COUNTDOWN:
      hud.classList.remove("hidden");
      dangerGauge.classList.remove("hidden");
      break;
    case GAME_STATES.PLAYING:
      hud.classList.remove("hidden");
      dangerGauge.classList.remove("hidden");
      resizeCanvas();
      break;
    case GAME_STATES.GAMEOVER:
      gameOverScreen.classList.remove("hidden");
      break;
    default:
      break;
  }
  if (stateEl) {
    stateEl.textContent = nextState;
  }
}

export function readHudInsets() {
  const el = document.getElementById("app");
  if (!el) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }
  const styles = getComputedStyle(el);
  return {
    left: Number.parseFloat(styles.paddingLeft) || 0,
    right: Number.parseFloat(styles.paddingRight) || 0,
    top: Number.parseFloat(styles.paddingTop) || 0,
    bottom: Number.parseFloat(styles.paddingBottom) || 0,
  };
}

export function resizeCanvas() {
  const canvas = state.canvas;
  const ctx = state.ctx;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.game.dpr = dpr;
  state.game.viewW = cssW;
  state.game.viewH = cssH;
  state.game.hudInset = readHudInsets();
  initStars();
}

export function updateTelemetry(dt) {
  const speed = Math.hypot(state.player.vx, state.player.vy);
  hudAlt.textContent = Math.round(120 + Math.sin(state.elapsed / 1200) * 10);
  hudSpd.textContent = Math.round(speed * 0.2);
  hudRssi.textContent = Math.round(90 + Math.sin(state.elapsed / 400) * 8);
  hudLq.textContent = Math.round(70 + Math.cos(state.elapsed / 500) * 18);
  hudSat.textContent = state.satsCollected;
  hudVtx.textContent = "WFM";
  if (hudStack) {
    hudStack.textContent = `${Math.min(100, Math.round(state.danger))}%`;
  }
  if (state.elapsed % 2400 < 50 && performance.now() - state.lastWaveCallout > 2000) {
    hudLingo.textContent = lingoSnippets[Math.floor(Math.random() * lingoSnippets.length)];
  }
  state.danger = Math.max(0, state.danger - dt * 6);
}

export function initWarnings() {
  if (leaderboardNeedsWarning()) {
    warningBanner.textContent = "Supabase not configured. Local leaderboard active.";
    warningBanner.classList.remove("hidden");
  }
}
