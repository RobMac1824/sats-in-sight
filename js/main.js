import { log } from "./logger.js";
import {
  resumeAudio,
  startMusic,
  stopMusic,
  toggleMute,
  playCountdownBeep,
  playGameOver,
} from "./audio.js";
import { submitScore, fetchLeaderboard, fetchUserBest } from "./supabase.js";
import { CONFIG, COUNTDOWN_SEQUENCE, GAME_STATES, DRONE_STORAGE_KEY } from "./config.js";
import { state, resetGameState } from "./state.js";
import { initInput, endStickInput } from "./input.js";
import { setActiveDrone, loadDroneImages, updateDroneSelectionUI, updatePlayer } from "./player.js";
import { spawnAsteroid, updateStars, updateEntities } from "./entities.js";
import { render } from "./renderer.js";
import {
  setState,
  showWaveCallout,
  showRadioCallout,
  updateTelemetry,
  resizeCanvas,
  initWarnings,
  hudScore,
  hudCombo,
  hudWave,
  healthFill,
  healthValue,
  dangerFill,
  usernameInput,
  finalScore,
  finalWave,
  finalCombo,
  leaderboardList,
  yourBest,
  warningBanner,
  muteButton,
  diagnosticsToggle,
  diagnostics,
  fpsEl,
  dtEl,
  dprEl,
  viewEl,
  canvasSizeEl,
  insetEl,
} from "./hud.js";

state.canvas = document.getElementById("gameCanvas");
state.ctx = state.canvas.getContext("2d");

const droneButtons = document.querySelectorAll(".drone-option");

function startReadyPhase() {
  state.readyTimer = CONFIG.readyDuration;
  setState(GAME_STATES.READY);
}

function startCountdownPhase() {
  state.countdownStepIndex = 0;
  state.countdownText = COUNTDOWN_SEQUENCE[0].text;
  state.countdownRemainingMs = COUNTDOWN_SEQUENCE[0].duration;
  state.countdownStepDuration = COUNTDOWN_SEQUENCE[0].duration;
  setState(GAME_STATES.COUNTDOWN);
  playCountdownBeep(COUNTDOWN_SEQUENCE[0].beep);
}

function startWave() {
  state.waveTimer = 0;
  showWaveCallout();
  showRadioCallout(`Lingo Lingo – Wave ${state.wave}`);
}

function update(dt, now) {
  if (state.game.state === GAME_STATES.COUNTDOWN) {
    state.countdownRemainingMs -= dt * 1000;
    if (state.countdownRemainingMs <= 0) {
      state.countdownStepIndex += 1;
      if (state.countdownStepIndex >= COUNTDOWN_SEQUENCE.length) {
        setState(GAME_STATES.PLAYING);
        startWave();
      } else {
        const step = COUNTDOWN_SEQUENCE[state.countdownStepIndex];
        state.countdownText = step.text;
        state.countdownRemainingMs = step.duration;
        state.countdownStepDuration = step.duration;
        playCountdownBeep(step.beep);
      }
    }
    return;
  }
  if (state.game.state === GAME_STATES.READY || state.game.state === GAME_STATES.PLAYING) {
    state.elapsed += dt * 1000;
    if (state.game.state === GAME_STATES.READY) {
      state.readyTimer -= dt * 1000;
      if (state.readyTimer <= 0) {
        setState(GAME_STATES.PLAYING);
        startWave();
      }
    } else {
      state.waveTimer += dt * 1000;
      const maxAsteroids = CONFIG.maxAsteroids + state.wave * 2;
      const densityBoost = 1 + state.wave * 0.15;
      if (state.asteroids.length < maxAsteroids) {
        const spawnChance = CONFIG.spawnRate * densityBoost * dt;
        if (Math.random() < spawnChance) {
          spawnAsteroid("large");
        }
      }
      if (state.waveTimer >= CONFIG.waveDuration) {
        state.wave += 1;
        startReadyPhase();
      }
    }
    updatePlayer(dt);
    updateEntities(dt, now);
    updateTelemetry(dt);
    if (now - state.lastComboTime > 1400) {
      state.combo = 0;
    }
    hudScore.textContent = state.score;
    hudCombo.textContent = `COMBO x${state.combo}`;
    healthValue.textContent = state.health;
    healthFill.style.width = `${(state.health / state.maxHealth) * 100}%`;
    hudWave.textContent = `WAVE ${state.wave}`;
    dangerFill.style.width = `${state.danger}%`;
    if (state.health <= 0) {
      endGame();
    }
    if (state.danger >= 100) {
      endGame();
    }
  }
}

function loop(timestamp) {
  try {
    const now = timestamp || performance.now();
    const safeLastTime = state.lastTime || now;
    const dt = Math.min(0.033, Math.max(0, (now - safeLastTime) / 1000));
    state.lastTime = now;
    if (state.game.state !== GAME_STATES.COUNTDOWN) {
      updateStars(dt);
    }
    if (state.shakeTime > 0) {
      state.shakeTime = Math.max(0, state.shakeTime - dt);
    }
    update(dt, now);
    render();
    if (state.diagnosticsEnabled) {
      state.fpsFrames += 1;
      state.fpsAccumulator += dt;
      if (state.fpsAccumulator >= 0.25) {
        const fps = state.fpsFrames / state.fpsAccumulator;
        fpsEl.textContent = Math.round(fps);
        state.fpsFrames = 0;
        state.fpsAccumulator = 0;
      }
      dtEl.textContent = `${(dt * 1000).toFixed(1)}ms`;
      if (dprEl) {
        dprEl.textContent = state.game.dpr.toFixed(2);
      }
      if (viewEl) {
        viewEl.textContent = `${state.game.viewW}×${state.game.viewH}`;
      }
      if (canvasSizeEl) {
        canvasSizeEl.textContent = `${state.canvas.width}×${state.canvas.height}`;
      }
      if (insetEl) {
        const inset = state.game.hudInset || { top: 0, right: 0, bottom: 0, left: 0 };
        insetEl.textContent = `L${Math.round(inset.left)} R${Math.round(
          inset.right,
        )} T${Math.round(inset.top)} B${Math.round(inset.bottom)}`;
      }
    }
  } catch (err) {
    log("ERROR", "Game loop error", err);
  }
  requestAnimationFrame(loop);
}

async function updateLeaderboard() {
  try {
    const username = usernameInput.value || "LINGO";
    await submitScore(username, state.score);
    const leaderboard = await fetchLeaderboard();
    const best = await fetchUserBest(username);
    leaderboardList.innerHTML = "";
    leaderboard.scores.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.username} — ${entry.score}`;
      leaderboardList.appendChild(li);
    });
    yourBest.textContent = best.best;
    if (leaderboard.fallback || best.fallback) {
      warningBanner.textContent = "Supabase not configured. Showing local leaderboard.";
      warningBanner.classList.remove("hidden");
    }
  } catch (err) {
    log("ERROR", "Leaderboard update failed", err);
    warningBanner.textContent = "Could not load leaderboard. Try again later.";
    warningBanner.classList.remove("hidden");
  }
}

function startGame() {
  warningBanner.classList.add("hidden");
  resetGameState();
  resumeAudio();
  startCountdownPhase();
  startMusic();
  if (state.asteroids.length === 0) {
    for (let i = 0; i < 3; i += 1) {
      spawnAsteroid("large");
    }
  }
}

function endGame() {
  stopMusic();
  playGameOver();
  finalScore.textContent = state.score;
  finalWave.textContent = state.wave;
  finalCombo.textContent = state.combo;
  endStickInput();
  setState(GAME_STATES.GAMEOVER);
  updateLeaderboard();
}

function initUI() {
  const savedName = localStorage.getItem("lingo_username");
  if (savedName) {
    usernameInput.value = savedName;
  }
  const savedDrone = localStorage.getItem(DRONE_STORAGE_KEY);
  if (savedDrone) {
    setActiveDrone(savedDrone);
  } else {
    setActiveDrone(state.activeDroneId);
  }
  updateDroneSelectionUI();
  loadDroneImages();
  droneButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { drone } = button.dataset;
      if (!drone) return;
      localStorage.setItem(DRONE_STORAGE_KEY, drone);
      setActiveDrone(drone);
      updateDroneSelectionUI();
      if (state.game.state === GAME_STATES.START) {
        setState(GAME_STATES.SELECT_DRONE);
      }
    });
  });
  document.getElementById("startButton").addEventListener("click", () => {
    const raw = usernameInput.value.trim();
    const sanitized = raw.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 16);
    if (sanitized.length > 0) {
      usernameInput.value = sanitized;
      localStorage.setItem("lingo_username", sanitized);
    }
    startGame();
  });
  document.getElementById("restartButton").addEventListener("click", startGame);
  diagnosticsToggle.addEventListener("click", () => {
    state.diagnosticsEnabled = !state.diagnosticsEnabled;
    diagnostics.classList.toggle("hidden", !state.diagnosticsEnabled);
  });
  muteButton.addEventListener("click", () => {
    const muted = toggleMute();
    muteButton.textContent = muted ? "Unmute" : "Mute";
  });
  setState(GAME_STATES.START);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

resizeCanvas();
initUI();
initInput();
initWarnings();
requestAnimationFrame(loop);
