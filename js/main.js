import {
  resumeAudio,
  startMusic,
  stopMusic,
  toggleMute,
  playShoot,
  playHit,
  playPowerUp,
  playGameOver,
  playCountdownBeep,
} from "./audio.js";
import {
  submitScore,
  fetchLeaderboard,
  fetchUserBest,
  leaderboardNeedsWarning,
} from "./supabase.js";

const CONFIG = {
  fov: 230,
  nearZ: 4.8,
  forwardSpeed: 28,
  bulletSpeed: 48,
  fireRate: 240,
  maxHealth: 100,
  waveDuration: 20000,
  readyDuration: 2500,
  spawnRate: 0.02,
  redSatRate: 0.012,
  powerUpRate: 0.0025,
  obstacleRate: 0.013,
};

const INPUT_SMOOTHING = 0.25;
const SWIPE_SENSITIVITY = 1.6;
const MAX_FOLLOW_SPEED_MULTIPLIER = 1.5;
const INPUT_ACCEL = 0.4;
const POINTER_FOLLOW_STRENGTH = 0.35;

const DRONE_STORAGE_KEY = "sats_drone_skin";
const PLAYER_SCALE = 0.02 * 1.05 * 1.2;
const PLAYER_BASE_SIZE = 18;
const STAR_SCALE = 0.05;
const COIN_SCALE = 0.05;
const Z_NEAR = CONFIG.nearZ;
const PLAYER_Z = 8;
const SHOT_BEAM_LENGTH_Z = 6;
const SHOT_HIT_WINDOW_Z = 1.4;
const GAME_STATES = {
  BOOT: "BOOT",
  START: "START",
  SELECT_DRONE: "SELECT_DRONE",
  READY: "READY",
  COUNTDOWN: "COUNTDOWN",
  PLAYING: "PLAYING",
  GAMEOVER: "GAMEOVER",
};
const DRONE_OPTIONS = [
  {
    id: "cinewhoop",
    name: "Cinewhoop",
    image: "assets/drones/cinewhoop.svg",
    accel: 0.42,
    maxSpeed: 6,
    collisionRadius: 0.28,
  },
  {
    id: "racer",
    name: "Racer",
    image: "assets/drones/racer.svg",
    accel: 0.5,
    maxSpeed: 7,
    collisionRadius: 0.24,
  },
  {
    id: "freestyle",
    name: "Freestyle",
    image: "assets/drones/freestyle.svg",
    accel: 0.46,
    maxSpeed: 6.5,
    collisionRadius: 0.26,
  },
  {
    id: "heavy-lift",
    name: "Heavy Lift",
    image: "assets/drones/heavy-lift.svg",
    accel: 0.34,
    maxSpeed: 4.8,
    collisionRadius: 0.34,
  },
];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

const hudScore = document.getElementById("score");
const hudCombo = document.getElementById("combo");
const hudWave = document.getElementById("hud-wave");
const healthFill = document.getElementById("healthFill");
const healthValue = document.getElementById("healthValue");
const hud = document.getElementById("hud");
const dangerFill = document.getElementById("dangerFill");
const hudLingo = document.getElementById("hud-lingo");
const hudAlt = document.getElementById("hud-alt");
const hudSpd = document.getElementById("hud-spd");
const hudRssi = document.getElementById("hud-rssi");
const hudLq = document.getElementById("hud-lq");
const hudSat = document.getElementById("hud-sat");
const hudVtx = document.getElementById("hud-vtx");
const levelCallout = document.getElementById("level-callout");
const hudCallout = document.getElementById("hud-callout");
const readyPanel = document.getElementById("readyPanel");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const usernameInput = document.getElementById("username");
const finalScore = document.getElementById("finalScore");
const finalWave = document.getElementById("finalWave");
const finalCombo = document.getElementById("finalCombo");
const leaderboardList = document.getElementById("leaderboardList");
const yourBest = document.getElementById("yourBest");
const diagnosticsToggle = document.getElementById("diagnosticsToggle");
const diagnostics = document.getElementById("diagnostics");
const fpsEl = document.getElementById("fps");
const touchEl = document.getElementById("touch");
const stateEl = document.getElementById("stateValue");
const dtEl = document.getElementById("dtValue");
const warningBanner = document.getElementById("warning");
const muteButton = document.getElementById("muteButton");
const droneButtons = document.querySelectorAll(".drone-option");
const hudStack = document.getElementById("hud-stack");
const dangerGauge = document.getElementById("dangerGauge");

const game = {
  state: GAME_STATES.BOOT,
};

let lastTime = 0;
let elapsed = 0;
let wave = 1;
let waveTimer = 0;
let readyTimer = CONFIG.readyDuration;
let score = 0;
let health = CONFIG.maxHealth;
let maxHealth = CONFIG.maxHealth;
let danger = 0;
let combo = 0;
let shots = [];
let sats = [];
let powerUps = [];
let obstacles = [];
let particles = [];
let flashes = [];
let lastShotTime = 0;
let activePowerUps = {
  shield: 0,
  multiplier: 0,
  speed: 0,
};
let diagnosticsEnabled = false;
let pointerActive = false;
let pointerPos = { x: 0, y: 0 };
let smoothedPointerPos = { x: 0, y: 0 };
let player = { x: 0, y: 0, vx: 0, vy: 0 };
let activeDroneId = DRONE_OPTIONS[0].id;
let activeDrone = DRONE_OPTIONS[0];
let currentFireRate = CONFIG.fireRate;
let satsCollected = 0;
const droneImages = new Map();
const stars = [];
const STAR_COUNT = 120;
let shakeTime = 0;
let shakeDuration = 0;
let shakeMagnitude = 0;
let lastWaveCallout = 0;
let dpr = window.devicePixelRatio || 1;
let fpsAccumulator = 0;
let fpsFrames = 0;
let countdownRemainingMs = 0;
let countdownStepIndex = 0;
let countdownText = "";
let countdownStepDuration = 0;
let safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const OBSTACLE_TYPES = {
  RING_GATE: "RING_GATE",
  WALL_PANEL: "WALL_PANEL",
  BAR: "BAR",
};

const COUNTDOWN_SEQUENCE = [
  { text: "DRONES GOING UP", duration: 900, beep: 520 },
  { text: "CLEAR PROP", duration: 900, beep: 640 },
  { text: "3", duration: 800, beep: 520 },
  { text: "2", duration: 800, beep: 520 },
  { text: "1", duration: 800, beep: 520 },
  { text: "GO", duration: 500, beep: 820 },
];

const WORLD = {
  corridorHalfWidth: 6,
  corridorHalfHeight: 3.6,
  spawnMinZ: 14,
  spawnMaxZ: 60,
  farZ: 80,
};

const lingoSnippets = [
  "DRN SYN OK",
  "LINGO LOCK",
  "SAT ACQUIRED",
  "SIGNAL CLEAN",
  "VTX PUNCH",
  "ARMED",
  "OSD LIVE",
  "RSSI GREEN",
  "SIGHTLINE SET",
];

function triggerShake(duration, magnitude) {
  shakeTime = duration;
  shakeDuration = duration;
  shakeMagnitude = magnitude;
}

function showWaveCallout() {
  const message = `Lingo Lingo – Wave ${wave}`;
  hudCallout.textContent = message;
  levelCallout.textContent = `WAVE ${wave}`;
  levelCallout.classList.remove("hidden");
  lastWaveCallout = performance.now();
  setTimeout(() => levelCallout.classList.add("hidden"), 1400);
}

function showRadioCallout(message) {
  hudCallout.textContent = message;
  hudCallout.classList.add("active");
  setTimeout(() => hudCallout.classList.remove("active"), 1200);
}

function hideAllScreens() {
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  readyPanel.classList.add("hidden");
  hud.classList.add("hidden");
  dangerGauge.classList.add("hidden");
}

function setState(nextState) {
  game.state = nextState;
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

function startReadyPhase() {
  readyTimer = CONFIG.readyDuration;
  setState(GAME_STATES.READY);
}

function startCountdownPhase() {
  countdownStepIndex = 0;
  countdownText = COUNTDOWN_SEQUENCE[0].text;
  countdownRemainingMs = COUNTDOWN_SEQUENCE[0].duration;
  countdownStepDuration = COUNTDOWN_SEQUENCE[0].duration;
  setState(GAME_STATES.COUNTDOWN);
  playCountdownBeep(COUNTDOWN_SEQUENCE[0].beep);
}

function startWave() {
  waveTimer = 0;
  showWaveCallout();
  showRadioCallout(`Lingo Lingo – Wave ${wave}`);
}

function resizeCanvas() {
  const { innerWidth, innerHeight } = window;
  dpr = window.devicePixelRatio || 1;
  viewWidth = innerWidth;
  viewHeight = innerHeight;
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  safeAreaInsets = getSafeAreaInsets();
  initStars();
}

function getSafeAreaInsets() {
  const styles = getComputedStyle(document.documentElement);
  const parseInset = (value) => Number.parseFloat(value) || 0;
  return {
    top: parseInset(styles.getPropertyValue("--safe-top")),
    right: parseInset(styles.getPropertyValue("--safe-right")),
    bottom: parseInset(styles.getPropertyValue("--safe-bottom")),
    left: parseInset(styles.getPropertyValue("--safe-left")),
  };
}

function initStars() {
  stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push({
      x: (Math.random() - 0.5) * WORLD.corridorHalfWidth * 6,
      y: (Math.random() - 0.5) * WORLD.corridorHalfHeight * 6,
      z: Math.random() * WORLD.farZ + 10,
      size: (Math.random() * 1.6 + 0.4) * STAR_SCALE,
      speed: Math.random() * 0.7 + 0.3,
    });
  }
}

function updateStars(dt) {
  stars.forEach((star) => {
    star.z -= CONFIG.forwardSpeed * star.speed * dt;
    if (star.z < 8) {
      star.z = WORLD.farZ;
      star.x = (Math.random() - 0.5) * WORLD.corridorHalfWidth * 6;
      star.y = (Math.random() - 0.5) * WORLD.corridorHalfHeight * 6;
    }
  });
}

function getDroneById(id) {
  return DRONE_OPTIONS.find((drone) => drone.id === id) || DRONE_OPTIONS[0];
}

function setActiveDrone(id) {
  activeDroneId = id;
  const baseDrone = getDroneById(id);
  activeDrone = {
    ...baseDrone,
    collisionRadius: baseDrone.collisionRadius * PLAYER_SCALE,
  };
  currentFireRate = CONFIG.fireRate;
  maxHealth = CONFIG.maxHealth;
}

function loadDroneImages() {
  DRONE_OPTIONS.forEach((drone) => {
    const img = new Image();
    img.src = drone.image;
    img.decode()
      .then(() => droneImages.set(drone.id, img))
      .catch(() => droneImages.set(drone.id, img));
  });
}

function updateDroneSelectionUI() {
  droneButtons.forEach((button) => {
    const isSelected = button.dataset.drone === activeDroneId;
    button.classList.toggle("selected", isSelected);
  });
}

function setPointerPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const rawX = (clientX - rect.left) / rect.width;
  const rawY = (clientY - rect.top) / rect.height;
  const targetX = (rawX - 0.5) * 2 * WORLD.corridorHalfWidth;
  const targetY = (rawY - 0.5) * 2 * WORLD.corridorHalfHeight;
  const canvasX = (clientX - rect.left) * dpr;
  const canvasY = (clientY - rect.top) * dpr;
  pointerPos = {
    x: clamp(targetX, -WORLD.corridorHalfWidth, WORLD.corridorHalfWidth),
    y: clamp(targetY, -WORLD.corridorHalfHeight, WORLD.corridorHalfHeight),
  };
  touchEl.textContent = `${Math.round(canvasX)},${Math.round(canvasY)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getForwardSpeed() {
  return CONFIG.forwardSpeed + wave * 1.8 + (activePowerUps.speed > 0 ? 6 : 0);
}

function getTunnelScale() {
  return Math.max(0.55, 1 - wave * 0.04);
}

function getSafeLaneScale() {
  return Math.max(0.6, 1 - wave * 0.03);
}

function spawnSat(type) {
  const tunnelScale = getTunnelScale();
  const maxX = WORLD.corridorHalfWidth * tunnelScale * 0.9;
  const maxY = WORLD.corridorHalfHeight * tunnelScale * 0.9;
  sats.push({
    x: (Math.random() - 0.5) * maxX * 2,
    y: (Math.random() - 0.5) * maxY * 2,
    z: Math.random() * (WORLD.spawnMaxZ - WORLD.spawnMinZ) + WORLD.spawnMinZ,
    radius: type === "red" ? 0.55 : 0.5,
    type,
    nearMissed: false,
  });
}

function spawnPowerUp() {
  const tunnelScale = getTunnelScale();
  const maxX = WORLD.corridorHalfWidth * tunnelScale * 0.85;
  const maxY = WORLD.corridorHalfHeight * tunnelScale * 0.85;
  const roll = Math.random();
  let type = "shield";
  if (roll > 0.7) {
    type = "multiplier";
  } else if (roll > 0.45) {
    type = "speed";
  }
  powerUps.push({
    x: (Math.random() - 0.5) * maxX * 2,
    y: (Math.random() - 0.5) * maxY * 2,
    z: Math.random() * (WORLD.spawnMaxZ - WORLD.spawnMinZ) + WORLD.spawnMinZ,
    radius: 0.6,
    type,
  });
}

function spawnObstacle() {
  const tunnelScale = getTunnelScale();
  const safeScale = getSafeLaneScale();
  const halfW = WORLD.corridorHalfWidth * tunnelScale;
  const halfH = WORLD.corridorHalfHeight * tunnelScale;
  const safeHalfW = WORLD.corridorHalfWidth * safeScale;
  const safeHalfH = WORLD.corridorHalfHeight * safeScale;
  const z = Math.random() * (WORLD.spawnMaxZ - WORLD.spawnMinZ) + WORLD.spawnMinZ;
  const roll = Math.random();
  if (roll < 0.45) {
    const driftX = (Math.random() - 0.5) * safeHalfW * 0.4;
    const driftY = (Math.random() - 0.5) * safeHalfH * 0.4;
    const innerRadius = Math.min(safeHalfW, safeHalfH) * 0.38;
    obstacles.push({
      type: OBSTACLE_TYPES.RING_GATE,
      x: driftX,
      y: driftY,
      z,
      innerRadius,
      thickness: innerRadius * 0.24,
    });
    return;
  }
  if (roll < 0.75) {
    const sideRoll = Math.random();
    const panelDepth = 0.6;
    let x = 0;
    let y = 0;
    let width = halfW * 0.6;
    let height = halfH * 0.5;
    if (sideRoll < 0.25) {
      x = -halfW + width * 0.5;
    } else if (sideRoll < 0.5) {
      x = halfW - width * 0.5;
    } else if (sideRoll < 0.75) {
      y = -halfH + height * 0.5;
      width = halfW * 0.5;
      height = halfH * 0.55;
    } else {
      y = halfH - height * 0.5;
      width = halfW * 0.5;
      height = halfH * 0.55;
    }
    obstacles.push({
      type: OBSTACLE_TYPES.WALL_PANEL,
      x,
      y,
      z,
      width,
      height,
      depth: panelDepth,
    });
    return;
  }
  const vertical = Math.random() < 0.5;
  obstacles.push({
    type: OBSTACLE_TYPES.BAR,
    x: vertical ? (Math.random() - 0.5) * safeHalfW * 0.4 : 0,
    y: vertical ? 0 : (Math.random() - 0.5) * safeHalfH * 0.4,
    z,
    width: vertical ? safeHalfW * 0.35 : safeHalfW * 1.25,
    height: vertical ? safeHalfH * 1.2 : safeHalfH * 0.35,
    depth: 0.5,
  });
}

function fireShot(now) {
  if (now - lastShotTime < currentFireRate) {
    return;
  }
  shots.push({
    x: player.x,
    y: player.y,
    z: PLAYER_Z + 2,
    radius: 0.1,
  });
  lastShotTime = now;
  playShoot();
}

function hitSat(sat) {
  combo = Math.max(1, combo + 1);
  const baseScore = sat.type === "red" ? 12 : 8;
  const multiplier = activePowerUps.multiplier > 0 ? 2 : 1;
  score += baseScore * combo * multiplier;
  if (combo > 0 && combo % 5 === 0) {
    showRadioCallout(`Lingo Lingo – Combo x${combo}`);
  }
  triggerShake(0.12, 6);
  flashes.push({ x: sat.x, y: sat.y, z: sat.z, life: 0.15 });
  playHit();
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x: sat.x,
      y: sat.y,
      z: sat.z,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.6,
      life: 1,
    });
  }
}

function resetCombo() {
  combo = 0;
}

function applyDamage(amount) {
  if (activePowerUps.shield > 0) {
    resetCombo();
    return;
  }
  health = Math.max(0, health - amount);
  danger = Math.min(100, danger + 12);
  resetCombo();
  triggerShake(0.18, 10);
  playHit();
  if (health <= 0) {
    endGame();
  }
}

function activatePowerUp(type) {
  if (type === "shield") {
    activePowerUps.shield = 3200;
  }
  if (type === "multiplier") {
    activePowerUps.multiplier = 5000;
  }
  if (type === "speed") {
    activePowerUps.speed = 3000;
  }
  showRadioCallout("Lingo Lingo – Powerup");
  playPowerUp();
}

function updatePlayer(dt) {
  if (!pointerActive) return;
  smoothedPointerPos.x += (pointerPos.x - smoothedPointerPos.x) * INPUT_SMOOTHING;
  smoothedPointerPos.y += (pointerPos.y - smoothedPointerPos.y) * INPUT_SMOOTHING;
  const dx = smoothedPointerPos.x - player.x;
  const dy = smoothedPointerPos.y - player.y;
  const speedBoost = activePowerUps.speed > 0 ? 1.35 : 1;
  const speed = activeDrone.maxSpeed * speedBoost * SWIPE_SENSITIVITY;
  const desiredVx = dx * speed;
  const desiredVy = dy * speed;
  player.vx += (desiredVx - player.vx) * activeDrone.accel;
  player.vy += (desiredVy - player.vy) * activeDrone.accel;
  const maxSpeed = speed * MAX_FOLLOW_SPEED_MULTIPLIER;
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
  player.vy = Math.max(-maxSpeed, Math.min(maxSpeed, player.vy));
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const tunnelScale = getTunnelScale();
  player.x = clamp(player.x, -WORLD.corridorHalfWidth * tunnelScale, WORLD.corridorHalfWidth * tunnelScale);
  player.y = clamp(player.y, -WORLD.corridorHalfHeight * tunnelScale, WORLD.corridorHalfHeight * tunnelScale);
}

function updateEntities(dt, now) {
  const forwardSpeed = getForwardSpeed();

  // Object pipeline: everything lives in world-space (x,y,z). Each frame, the world moves
  // toward the camera by decreasing z with forwardSpeed. Shots move forward by increasing z.
  shots.forEach((shot) => {
    shot.z += CONFIG.bulletSpeed * dt;
  });
  shots = shots.filter((shot) => shot.z < WORLD.farZ);

  sats.forEach((sat) => {
    sat.z -= forwardSpeed * dt;
  });

  powerUps.forEach((power) => {
    power.z -= forwardSpeed * dt;
  });

  obstacles.forEach((obstacle) => {
    obstacle.z -= forwardSpeed * dt;
  });

  particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.z += particle.vz * dt;
    particle.life -= dt * 1.1;
  });
  particles = particles.filter((particle) => particle.life > 0);

  flashes.forEach((flash) => {
    flash.life -= dt;
  });
  flashes = flashes.filter((flash) => flash.life > 0);

  shots.forEach((shot, shotIndex) => {
    sats.forEach((sat, satIndex) => {
      if (sat.type !== "red") return;
      const hitWindow = Math.abs(shot.z - sat.z) < SHOT_HIT_WINDOW_Z;
      if (!hitWindow) return;
      const dist2D = Math.hypot(shot.x - sat.x, shot.y - sat.y);
      if (dist2D < sat.radius + shot.radius) {
        hitSat(sat);
        shots.splice(shotIndex, 1);
        sats.splice(satIndex, 1);
      }
    });
  });

  sats.forEach((sat, satIndex) => {
    if (sat.z < Z_NEAR + 0.4 && !sat.nearMissed && sat.type === "red") {
      const dist = Math.hypot(sat.x - player.x, sat.y - player.y);
      if (dist < activeDrone.collisionRadius * 1.8) {
        showRadioCallout("Lingo Lingo – Near miss");
        sat.nearMissed = true;
      }
    }
    if (sat.z < Z_NEAR) {
      const dist = Math.hypot(sat.x - player.x, sat.y - player.y, sat.z);
      if (dist < sat.radius + activeDrone.collisionRadius) {
        if (sat.type === "yellow") {
          satsCollected += 1;
          hitSat(sat);
        } else {
          applyDamage(18);
        }
      } else if (sat.type === "red") {
        resetCombo();
      }
      sats.splice(satIndex, 1);
    }
  });

  powerUps.forEach((power, powerIndex) => {
    if (power.z < Z_NEAR) {
      const dist = Math.hypot(power.x - player.x, power.y - player.y, power.z);
      if (dist < power.radius + activeDrone.collisionRadius) {
        activatePowerUp(power.type);
      }
      powerUps.splice(powerIndex, 1);
    }
  });

  obstacles.forEach((obstacle, obstacleIndex) => {
    if (obstacle.z < Z_NEAR) {
      const playerRadius = activeDrone.collisionRadius;
      if (obstacle.type === OBSTACLE_TYPES.RING_GATE) {
        const dist = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
        if (dist <= obstacle.innerRadius - playerRadius) {
          score += 15 + combo * 2;
          combo = Math.max(1, combo + 1);
        } else {
          applyDamage(22);
        }
      } else {
        const halfW = obstacle.width * 0.5;
        const halfH = obstacle.height * 0.5;
        const hit =
          Math.abs(player.x - obstacle.x) < halfW + playerRadius &&
          Math.abs(player.y - obstacle.y) < halfH + playerRadius;
        if (hit) {
          applyDamage(20);
        }
      }
      obstacles.splice(obstacleIndex, 1);
    }
  });

  Object.keys(activePowerUps).forEach((key) => {
    if (activePowerUps[key] > 0) {
      activePowerUps[key] = Math.max(0, activePowerUps[key] - dt * 1000);
    }
  });

  fireShot(now);
}

function updateTelemetry(dt) {
  hudAlt.textContent = Math.round(100 + Math.sin(elapsed / 1000) * 12);
  hudSpd.textContent = Math.round(getForwardSpeed());
  hudRssi.textContent = Math.round(90 + Math.sin(elapsed / 400) * 8);
  hudLq.textContent = Math.round(70 + Math.cos(elapsed / 500) * 18);
  hudSat.textContent = satsCollected;
  hudVtx.textContent = "WFM";
  if (hudStack) {
    hudStack.textContent = `${Math.min(100, Math.round(danger))}%`;
  }
  if (elapsed % 2400 < 50 && performance.now() - lastWaveCallout > 2000) {
    hudLingo.textContent = lingoSnippets[Math.floor(Math.random() * lingoSnippets.length)];
  }
  danger = Math.max(0, danger - dt * 6);
}

function update(dt, now) {
  if (game.state === GAME_STATES.COUNTDOWN) {
    countdownRemainingMs -= dt * 1000;
    if (countdownRemainingMs <= 0) {
      countdownStepIndex += 1;
      if (countdownStepIndex >= COUNTDOWN_SEQUENCE.length) {
        setState(GAME_STATES.PLAYING);
        startWave();
      } else {
        const step = COUNTDOWN_SEQUENCE[countdownStepIndex];
        countdownText = step.text;
        countdownRemainingMs = step.duration;
        countdownStepDuration = step.duration;
        playCountdownBeep(step.beep);
      }
    }
    return;
  }
  if (game.state === GAME_STATES.READY || game.state === GAME_STATES.PLAYING) {
    elapsed += dt * 1000;
    if (game.state === GAME_STATES.READY) {
      readyTimer -= dt * 1000;
      if (readyTimer <= 0) {
        setState(GAME_STATES.PLAYING);
        startWave();
      }
    } else {
      waveTimer += dt * 1000;
      const densityBoost = 1 + wave * 0.12;
      if (Math.random() < CONFIG.spawnRate * densityBoost) {
        spawnSat("yellow");
      }
      if (Math.random() < CONFIG.redSatRate * densityBoost) {
        spawnSat("red");
      }
      if (Math.random() < CONFIG.powerUpRate) {
        spawnPowerUp();
      }
      if (Math.random() < CONFIG.obstacleRate * densityBoost) {
        spawnObstacle();
      }
      if (waveTimer >= CONFIG.waveDuration) {
        wave += 1;
        startReadyPhase();
      }
    }
    updatePlayer(dt);
    updateEntities(dt, now);
    updateTelemetry(dt);
    hudScore.textContent = score;
    hudCombo.textContent = `COMBO x${combo}`;
    healthValue.textContent = health;
    healthFill.style.width = `${(health / maxHealth) * 100}%`;
    hudWave.textContent = `WAVE ${wave}`;
    dangerFill.style.width = `${danger}%`;
    if (danger >= 100) {
      endGame();
    }
  }
}

// Perspective math: we keep the camera fixed at z=0 and project 3D world coords (x,y,z)
// into 2D screen coords using a simple pinhole model. World objects are projected
// relative to the drone's x/y position so the drone stays visually centered.
// screenX = centerX + (x / z) * FOV
// screenY = centerY + (y / z) * FOV
// scale   = FOV / z
function projectPoint(x, y, z) {
  const centerX = viewWidth * 0.5;
  const centerY = viewHeight * 0.5;
  const safeZ = Math.max(Z_NEAR, z);
  const scale = CONFIG.fov / safeZ;
  return {
    x: centerX + x * scale,
    y: centerY + y * scale,
    scale,
  };
}

function projectWorldPoint(x, y, z) {
  return projectPoint(x - player.x, y - player.y, z);
}

function getFogAlpha(z) {
  const fogStart = WORLD.spawnMaxZ * 0.7;
  const fogEnd = WORLD.farZ;
  if (z <= fogStart) return 0;
  return clamp((z - fogStart) / (fogEnd - fogStart), 0, 1);
}

function drawBackground() {
  ctx.fillStyle = "#060a12";
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.save();
  stars.forEach((star) => {
    const projected = projectWorldPoint(star.x, star.y, star.z);
    if (projected.scale <= 0) return;
    ctx.globalAlpha = clamp(0.2 + (1 - star.z / WORLD.farZ) * 0.8, 0.1, 0.9);
    ctx.fillStyle = "rgba(180, 220, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, star.size * projected.scale * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSpeedLines() {
  const centerX = viewWidth * 0.5;
  const centerY = viewHeight * 0.5;
  ctx.save();
  stars.forEach((star, index) => {
    if (index % 3 !== 0) return;
    const projected = projectWorldPoint(star.x, star.y, star.z);
    const intensity = clamp(1 - star.z / WORLD.farZ, 0, 1);
    const dx = projected.x - centerX;
    const dy = projected.y - centerY;
    ctx.strokeStyle = `rgba(120, 200, 255, ${0.1 + intensity * 0.3})`;
    ctx.lineWidth = 1 * STAR_SCALE;
    ctx.beginPath();
    ctx.moveTo(projected.x, projected.y);
    ctx.lineTo(projected.x - dx * 0.2, projected.y - dy * 0.2);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTunnel() {
  const tunnelScale = getTunnelScale();
  const halfW = WORLD.corridorHalfWidth * tunnelScale;
  const halfH = WORLD.corridorHalfHeight * tunnelScale;
  ctx.save();
  const step = 6;
  for (let z = 6; z < WORLD.farZ; z += step) {
    const z2 = Math.min(WORLD.farZ, z + step);
    const midZ = (z + z2) * 0.5;
    const fog = getFogAlpha(midZ);
    const wallAlpha = 0.08 + (1 - fog) * 0.12;

    const p1 = projectWorldPoint(-halfW, -halfH, z);
    const p2 = projectWorldPoint(halfW, -halfH, z);
    const p3 = projectWorldPoint(halfW, halfH, z);
    const p4 = projectWorldPoint(-halfW, halfH, z);
    const p1b = projectWorldPoint(-halfW, -halfH, z2);
    const p2b = projectWorldPoint(halfW, -halfH, z2);
    const p3b = projectWorldPoint(halfW, halfH, z2);
    const p4b = projectWorldPoint(-halfW, halfH, z2);

    ctx.fillStyle = `rgba(18, 34, 54, ${wallAlpha})`;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p4b.x, p4b.y);
    ctx.lineTo(p1b.x, p1b.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p3b.x, p3b.y);
    ctx.lineTo(p2b.x, p2b.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2b.x, p2b.y);
    ctx.lineTo(p1b.x, p1b.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p3b.x, p3b.y);
    ctx.lineTo(p4b.x, p4b.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(120, 200, 240, ${0.18 + (1 - fog) * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = `rgba(180, 245, 255, ${0.12 + (1 - fog) * 0.25})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.stroke();
  }

  const edges = [
    { x1: -halfW, y1: -halfH, x2: -halfW, y2: halfH },
    { x1: halfW, y1: -halfH, x2: halfW, y2: halfH },
    { x1: -halfW, y1: -halfH, x2: halfW, y2: -halfH },
    { x1: -halfW, y1: halfH, x2: halfW, y2: halfH },
  ];
  ctx.strokeStyle = "rgba(140, 220, 255, 0.25)";
  ctx.lineWidth = 1;
  edges.forEach((edge) => {
    const start = projectWorldPoint(edge.x1, edge.y1, 6);
    const end = projectWorldPoint(edge.x2, edge.y2, WORLD.farZ);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  const projected = projectPoint(0, 0, PLAYER_Z);
  const img = droneImages.get(activeDroneId);
  const size = PLAYER_BASE_SIZE * PLAYER_SCALE * projected.scale;
  if (img && img.complete) {
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, projected.x - size / 2, projected.y - size / 2, size, size);
  } else {
    ctx.fillStyle = "#9fd8ff";
    ctx.beginPath();
    ctx.moveTo(projected.x, projected.y - size * 0.5);
    ctx.lineTo(projected.x - size * 0.4, projected.y + size * 0.4);
    ctx.lineTo(projected.x + size * 0.4, projected.y + size * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  if (activePowerUps.shield > 0) {
    ctx.strokeStyle = "rgba(130, 220, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, size * 0.75, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (activePowerUps.multiplier > 0) {
    ctx.strokeStyle = "rgba(255, 214, 120, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, size * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (activePowerUps.speed > 0) {
    ctx.strokeStyle = "rgba(120, 255, 215, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(projected.x - size * 0.9, projected.y);
    ctx.lineTo(projected.x - size * 0.4, projected.y - size * 0.4);
    ctx.lineTo(projected.x - size * 0.1, projected.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCoin(projected, size, fog) {
  const minCoinRadius = dpr >= 2 ? 3 : 2;
  const radius = Math.max(minCoinRadius, size * 0.6);
  ctx.globalAlpha = 1 - fog * 0.6;
  ctx.fillStyle = "#f5c542";
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffea8a";
  ctx.lineWidth = Math.max(0.6, radius * 0.2);
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#5b3a00";
  ctx.font = `${Math.max(6, radius * 0.9)}px IBM Plex Mono, Courier New, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₿", projected.x, projected.y + radius * 0.05);
}

function drawMine(projected, size, fog) {
  const minCoinRadius = dpr >= 2 ? 3 : 2;
  const radius = Math.max(minCoinRadius, size * 0.65);
  ctx.globalAlpha = 1 - fog * 0.5;
  ctx.fillStyle = "rgba(255, 90, 110, 0.9)";
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI / 2) * i;
    const outerX = projected.x + Math.cos(angle) * radius;
    const outerY = projected.y + Math.sin(angle) * radius;
    const innerX = projected.x + Math.cos(angle + Math.PI / 4) * radius * 0.45;
    const innerY = projected.y + Math.sin(angle + Math.PI / 4) * radius * 0.45;
    if (i === 0) {
      ctx.moveTo(outerX, outerY);
    } else {
      ctx.lineTo(outerX, outerY);
    }
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 150, 170, 0.9)";
  ctx.lineWidth = Math.max(0.6, radius * 0.12);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 240, 250, 0.8)";
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawSats() {
  ctx.save();
  sats.forEach((sat) => {
    if (sat.z <= Z_NEAR * 0.6) return;
    const projected = projectWorldPoint(sat.x, sat.y, sat.z);
    const fog = getFogAlpha(sat.z);
    const size = 22 * projected.scale * COIN_SCALE;
    if (sat.type === "red") {
      drawMine(projected, size, fog);
    } else {
      drawCoin(projected, size, fog);
    }
  });
  ctx.restore();
}

function drawRingGate(obstacle) {
  const projected = projectWorldPoint(obstacle.x, obstacle.y, obstacle.z);
  const fog = getFogAlpha(obstacle.z);
  const innerRadius = obstacle.innerRadius * projected.scale;
  const outerRadius = (obstacle.innerRadius + obstacle.thickness) * projected.scale;
  ctx.globalAlpha = 1 - fog * 0.7;
  ctx.strokeStyle = "rgba(90, 200, 255, 0.7)";
  ctx.lineWidth = Math.max(2, outerRadius - innerRadius);
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, (innerRadius + outerRadius) * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(200, 240, 255, 0.9)";
  ctx.lineWidth = Math.max(1, (outerRadius - innerRadius) * 0.4);
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, innerRadius * 1.05, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPanel(obstacle) {
  const fog = getFogAlpha(obstacle.z);
  const halfW = obstacle.width * 0.5;
  const halfH = obstacle.height * 0.5;
  const p1 = projectWorldPoint(obstacle.x - halfW, obstacle.y - halfH, obstacle.z);
  const p2 = projectWorldPoint(obstacle.x + halfW, obstacle.y - halfH, obstacle.z);
  const p3 = projectWorldPoint(obstacle.x + halfW, obstacle.y + halfH, obstacle.z);
  const p4 = projectWorldPoint(obstacle.x - halfW, obstacle.y + halfH, obstacle.z);
  ctx.globalAlpha = 1 - fog * 0.6;
  ctx.fillStyle = "rgba(30, 120, 180, 0.55)";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(170, 230, 255, 0.85)";
  ctx.lineWidth = Math.max(1, 2 * p1.scale);
  ctx.stroke();
}

function drawBar(obstacle) {
  const fog = getFogAlpha(obstacle.z);
  const halfW = obstacle.width * 0.5;
  const halfH = obstacle.height * 0.5;
  const p1 = projectWorldPoint(obstacle.x - halfW, obstacle.y - halfH, obstacle.z);
  const p2 = projectWorldPoint(obstacle.x + halfW, obstacle.y - halfH, obstacle.z);
  const p3 = projectWorldPoint(obstacle.x + halfW, obstacle.y + halfH, obstacle.z);
  const p4 = projectWorldPoint(obstacle.x - halfW, obstacle.y + halfH, obstacle.z);
  ctx.globalAlpha = 1 - fog * 0.5;
  ctx.fillStyle = "rgba(255, 120, 120, 0.6)";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 210, 210, 0.85)";
  ctx.lineWidth = Math.max(1, 1.5 * p1.scale);
  ctx.stroke();
}

function drawObstacles() {
  ctx.save();
  obstacles.forEach((obstacle) => {
    if (obstacle.z <= Z_NEAR * 0.7) return;
    if (obstacle.type === OBSTACLE_TYPES.RING_GATE) {
      drawRingGate(obstacle);
    } else if (obstacle.type === OBSTACLE_TYPES.WALL_PANEL) {
      drawPanel(obstacle);
    } else {
      drawBar(obstacle);
    }
  });
  ctx.restore();
}

function drawPowerUps() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  powerUps.forEach((power) => {
    if (power.z <= 0.2) return;
    const projected = projectWorldPoint(power.x, power.y, power.z);
    const size = 18 * projected.scale;
    let stroke = "#c2f5ff";
    let text = "S";
    if (power.type === "multiplier") {
      stroke = "#ffd678";
      text = "x2";
    } else if (power.type === "speed") {
      stroke = "#78ffd7";
      text = ">>";
    }
    ctx.globalAlpha = 1 - getFogAlpha(power.z) * 0.6;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, size * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.font = `${Math.max(10, size * 0.7)}px IBM Plex Mono, Courier New, monospace`;
    ctx.fillText(text, projected.x, projected.y);
  });
  ctx.restore();
}

function drawShots() {
  ctx.save();
  shots.forEach((shot) => {
    if (shot.z <= Z_NEAR * 0.6) return;
    const p0 = projectWorldPoint(shot.x, shot.y, shot.z);
    const p1 = projectWorldPoint(shot.x, shot.y, shot.z + SHOT_BEAM_LENGTH_Z);
    const beamLength = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const beamWidth = Math.max(1, beamLength * 0.08);
    ctx.strokeStyle = "rgba(120, 245, 255, 0.9)";
    ctx.lineWidth = beamWidth;
    ctx.shadowColor = "rgba(120, 245, 255, 0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(210, 255, 255, 0.95)";
    ctx.lineWidth = Math.max(0.6, beamWidth * 0.4);
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  particles.forEach((particle) => {
    if (particle.z <= Z_NEAR * 0.6) return;
    const projected = projectWorldPoint(particle.x, particle.y, particle.z);
    ctx.fillStyle = `rgba(194, 245, 255, ${particle.life})`;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, 3 * projected.scale, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFlashes() {
  ctx.save();
  flashes.forEach((flash) => {
    if (flash.z <= Z_NEAR * 0.6) return;
    const projected = projectWorldPoint(flash.x, flash.y, flash.z);
    const alpha = Math.max(0, flash.life / 0.15);
    ctx.fillStyle = `rgba(255, 245, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, 16 * projected.scale * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFogOverlay() {
  const gradient = ctx.createLinearGradient(0, viewHeight * 0.2, 0, viewHeight);
  gradient.addColorStop(0, "rgba(6, 10, 18, 0)");
  gradient.addColorStop(1, "rgba(6, 10, 18, 0.35)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewWidth, viewHeight);
}

function drawCountdownOverlay() {
  if (game.state !== GAME_STATES.COUNTDOWN || !countdownText) return;
  const safeWidth = viewWidth - safeAreaInsets.left - safeAreaInsets.right;
  const safeHeight = viewHeight - safeAreaInsets.top - safeAreaInsets.bottom;
  const centerX = safeAreaInsets.left + safeWidth * 0.5;
  const centerY = safeAreaInsets.top + safeHeight * 0.5;
  const progress = clamp(
    1 - countdownRemainingMs / Math.max(1, countdownStepDuration),
    0,
    1,
  );
  const alpha = Math.sin(Math.PI * progress);
  const scale = 0.92 + 0.1 * Math.sin(Math.PI * progress);
  const fontSize = Math.min(viewWidth, viewHeight) * 0.14;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f2fbff";
  ctx.shadowColor = "rgba(130, 220, 255, 0.85)";
  ctx.shadowBlur = 18;
  ctx.font = `700 ${fontSize}px IBM Plex Mono, Courier New, monospace`;
  ctx.fillText(countdownText, 0, 0);
  ctx.restore();
}

function drawReticle() {
  const centerX = viewWidth * 0.5;
  const centerY = viewHeight * 0.5;
  ctx.save();
  ctx.strokeStyle = "rgba(180, 240, 255, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX - 18, centerY);
  ctx.lineTo(centerX - 6, centerY);
  ctx.moveTo(centerX + 6, centerY);
  ctx.lineTo(centerX + 18, centerY);
  ctx.moveTo(centerX, centerY - 18);
  ctx.lineTo(centerX, centerY - 6);
  ctx.moveTo(centerX, centerY + 6);
  ctx.lineTo(centerX, centerY + 18);
  ctx.stroke();
  ctx.fillStyle = "rgba(210, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (shakeTime > 0) {
    const intensity = shakeDuration ? shakeTime / shakeDuration : 0;
    const offsetX = (Math.random() - 0.5) * shakeMagnitude * intensity;
    const offsetY = (Math.random() - 0.5) * shakeMagnitude * intensity;
    ctx.translate(offsetX, offsetY);
  }
  drawBackground();
  drawSpeedLines();
  drawTunnel();
  drawObstacles();
  drawShots();
  drawSats();
  drawPowerUps();
  drawParticles();
  drawFlashes();
  drawPlayer();
  drawReticle();
  drawFogOverlay();
  drawCountdownOverlay();
  ctx.restore();
}

function loop(timestamp) {
  const now = timestamp || performance.now();
  const safeLastTime = lastTime || now;
  const dt = Math.min(0.033, Math.max(0, (now - safeLastTime) / 1000));
  lastTime = now;
  if (game.state !== GAME_STATES.COUNTDOWN) {
    updateStars(dt);
  }
  if (shakeTime > 0) {
    shakeTime = Math.max(0, shakeTime - dt);
  }
  update(dt, now);
  render();
  if (diagnosticsEnabled) {
    fpsFrames += 1;
    fpsAccumulator += dt;
    if (fpsAccumulator >= 0.25) {
      const fps = fpsFrames / fpsAccumulator;
      fpsEl.textContent = Math.round(fps);
      fpsFrames = 0;
      fpsAccumulator = 0;
    }
    dtEl.textContent = `${(dt * 1000).toFixed(1)}ms`;
  }
  requestAnimationFrame(loop);
}

async function updateLeaderboard() {
  const username = usernameInput.value || "LINGO";
  await submitScore(username, score);
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
}

function startGame() {
  warningBanner.classList.add("hidden");
  score = 0;
  health = maxHealth;
  danger = 0;
  combo = 0;
  wave = 1;
  waveTimer = 0;
  elapsed = 0;
  shots = [];
  sats = [];
  powerUps = [];
  obstacles = [];
  particles = [];
  flashes = [];
  activePowerUps = {
    shield: 0,
    multiplier: 0,
    speed: 0,
  };
  satsCollected = 0;
  pointerActive = false;
  player = { x: 0, y: 0, vx: 0, vy: 0 };
  resumeAudio();
  startCountdownPhase();
  startMusic();
}

function endGame() {
  stopMusic();
  playGameOver();
  finalScore.textContent = score;
  finalWave.textContent = wave;
  finalCombo.textContent = combo;
  pointerActive = false;
  touchEl.textContent = "0,0";
  setState(GAME_STATES.GAMEOVER);
  updateLeaderboard();
}

function handlePointerDown(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  pointerActive = true;
  resumeAudio();
  setPointerPosition(event.clientX, event.clientY);
  smoothedPointerPos = { ...pointerPos };
}

function handlePointerMove(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  if (!pointerActive) return;
  setPointerPosition(event.clientX, event.clientY);
  player.x += (pointerPos.x - player.x) * POINTER_FOLLOW_STRENGTH;
  player.y += (pointerPos.y - player.y) * POINTER_FOLLOW_STRENGTH;
}

function handlePointerUp() {
  pointerActive = false;
  touchEl.textContent = "0,0";
}

function handleTouchStart(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  event.preventDefault();
  const touch = event.touches[0];
  if (!touch) return;
  pointerActive = true;
  resumeAudio();
  setPointerPosition(touch.clientX, touch.clientY);
  smoothedPointerPos = { ...pointerPos };
}

function handleTouchMove(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  event.preventDefault();
  if (!pointerActive) return;
  const touch = event.touches[0];
  if (!touch) return;
  setPointerPosition(touch.clientX, touch.clientY);
  player.x += (pointerPos.x - player.x) * POINTER_FOLLOW_STRENGTH;
  player.y += (pointerPos.y - player.y) * POINTER_FOLLOW_STRENGTH;
}

function handleTouchEnd(event) {
  event.preventDefault();
  if (event.touches.length === 0) {
    pointerActive = false;
    touchEl.textContent = "0,0";
  }
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
    setActiveDrone(activeDroneId);
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
      if (game.state === GAME_STATES.START) {
        setState(GAME_STATES.SELECT_DRONE);
      }
    });
  });
  startButton.addEventListener("click", () => {
    if (usernameInput.value.trim()) {
      localStorage.setItem("lingo_username", usernameInput.value.trim());
    }
    startGame();
  });
  restartButton.addEventListener("click", startGame);
  diagnosticsToggle.addEventListener("click", () => {
    diagnosticsEnabled = !diagnosticsEnabled;
    diagnostics.classList.toggle("hidden", !diagnosticsEnabled);
  });
  muteButton.addEventListener("click", () => {
    const muted = toggleMute();
    muteButton.textContent = muted ? "Unmute" : "Mute";
  });
  setState(GAME_STATES.START);
}

function initInput() {
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });
  window.addEventListener("blur", handlePointerUp);
}

function initWarnings() {
  if (leaderboardNeedsWarning()) {
    warningBanner.textContent = "Supabase not configured. Local leaderboard active.";
    warningBanner.classList.remove("hidden");
  }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

resizeCanvas();
initUI();
initInput();
initWarnings();
requestAnimationFrame(loop);
