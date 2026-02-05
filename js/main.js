import {
  resumeAudio,
  startMusic,
  stopMusic,
  toggleMute,
  playShoot,
  playHit,
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
  bulletSpeed: 520,
  fireRate: 220,
  maxHealth: 100,
  waveDuration: 20000,
  readyDuration: 2500,
  spawnRate: 0.35,
  maxAsteroids: 6,
};

const INPUT_SMOOTHING = 0.25;
const SWIPE_SENSITIVITY = 1.6;
const MOBILE_ACCEL_MULTIPLIER = 2.1;
const MOBILE_MAX_SPEED_MULTIPLIER = 1.35;
const SWIPE_DEADZONE_PX = 0.5;
const IS_COARSE_POINTER =
  window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

const DRONE_STORAGE_KEY = "sats_drone_skin";
const PLAYER_BASE_SIZE = 28;
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
    maxSpeed: 260,
    collisionRadius: 18,
  },
  {
    id: "racer",
    name: "Racer",
    image: "assets/drones/racer.svg",
    accel: 0.5,
    maxSpeed: 300,
    collisionRadius: 16,
  },
  {
    id: "freestyle",
    name: "Freestyle",
    image: "assets/drones/freestyle.svg",
    accel: 0.46,
    maxSpeed: 280,
    collisionRadius: 17,
  },
  {
    id: "heavy-lift",
    name: "Heavy Lift",
    image: "assets/drones/heavy-lift.svg",
    accel: 0.34,
    maxSpeed: 230,
    collisionRadius: 20,
  },
];

const ASTEROID_SIZES = {
  large: { radius: 52, score: 15, split: "medium", speed: 28 },
  medium: { radius: 32, score: 12, split: "small", speed: 38 },
  small: { radius: 18, score: 28, split: null, speed: 54 },
};

const COUNTDOWN_SEQUENCE = [
  { text: "DRONES\nGOING UP", duration: 900, beep: 520 },
  { text: "CLEAR PROP", duration: 900, beep: 640 },
  { text: "3", duration: 800, beep: 520 },
  { text: "2", duration: 800, beep: 520 },
  { text: "1", duration: 800, beep: 520 },
  { text: "GO", duration: 500, beep: 820 },
];

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
let lastComboTime = 0;
let shots = [];
let asteroids = [];
let particles = [];
let fxBursts = [];
let flashes = [];
let hitPopups = [];
let lastShotTime = 0;
let diagnosticsEnabled = false;
let pointerActive = false;
let pointerPos = { x: 0, y: 0 };
let smoothedPointerPos = { x: 0, y: 0 };
let lastPointerCanvas = null;
let player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
let activeDroneId = DRONE_OPTIONS[0].id;
let activeDrone = DRONE_OPTIONS[0];
let currentFireRate = CONFIG.fireRate;
let satsCollected = 0;
const droneImages = new Map();
const stars = [];
const STAR_COUNT = 140;
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
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      size: Math.random() * 1.6 + 0.4,
      speed: Math.random() * 8 + 4,
      drift: (Math.random() - 0.5) * 3,
    });
  }
}

function updateStars(dt) {
  stars.forEach((star) => {
    star.y += star.speed * dt;
    star.x += star.drift * dt;
    if (star.y > viewHeight + 4) {
      star.y = -4;
      star.x = Math.random() * viewWidth;
    }
    if (star.x < -4) {
      star.x = viewWidth + 4;
    }
    if (star.x > viewWidth + 4) {
      star.x = -4;
    }
  });
}

function getDroneById(id) {
  return DRONE_OPTIONS.find((drone) => drone.id === id) || DRONE_OPTIONS[0];
}

function setActiveDrone(id) {
  activeDroneId = id;
  const baseDrone = getDroneById(id);
  activeDrone = { ...baseDrone };
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

function setPointerPosition(clientX, clientY, force = false) {
  const rect = canvas.getBoundingClientRect();
  const canvasX = (clientX - rect.left) * dpr;
  const canvasY = (clientY - rect.top) * dpr;
  if (!force && lastPointerCanvas) {
    const dx = Math.abs(canvasX - lastPointerCanvas.x);
    const dy = Math.abs(canvasY - lastPointerCanvas.y);
    if (dx < SWIPE_DEADZONE_PX && dy < SWIPE_DEADZONE_PX) {
      return;
    }
  }
  lastPointerCanvas = { x: canvasX, y: canvasY };
  pointerPos = {
    x: clamp(clientX - rect.left, 0, rect.width),
    y: clamp(clientY - rect.top, 0, rect.height),
  };
  touchEl.textContent = `${Math.round(canvasX)},${Math.round(canvasY)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function spawnAsteroid(size = "large", position = null) {
  const spec = ASTEROID_SIZES[size];
  const margin = spec.radius + 20;
  let x = 0;
  let y = 0;
  if (position) {
    ({ x, y } = position);
  } else {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      x = Math.random() * viewWidth;
      y = -margin;
    } else if (edge === 1) {
      x = viewWidth + margin;
      y = Math.random() * viewHeight;
    } else if (edge === 2) {
      x = Math.random() * viewWidth;
      y = viewHeight + margin;
    } else {
      x = -margin;
      y = Math.random() * viewHeight;
    }
  }
  const angle = Math.random() * Math.PI * 2;
  const speed = spec.speed + wave * 3 + Math.random() * 8;
  const spin = (Math.random() - 0.5) * 1.4;
  const points = [];
  const pointCount = 7 + Math.floor(Math.random() * 4);
  for (let i = 0; i < pointCount; i += 1) {
    const theta = (Math.PI * 2 * i) / pointCount;
    points.push({
      angle: theta,
      radius: spec.radius * (0.7 + Math.random() * 0.5),
    });
  }
  asteroids.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: spec.radius,
    size,
    angle: Math.random() * Math.PI * 2,
    spin,
    points,
  });
}

function wrapEntity(entity) {
  const margin = entity.radius + 20;
  if (entity.x < -margin) entity.x = viewWidth + margin;
  if (entity.x > viewWidth + margin) entity.x = -margin;
  if (entity.y < -margin) entity.y = viewHeight + margin;
  if (entity.y > viewHeight + margin) entity.y = -margin;
}

function fireShot(now) {
  if (now - lastShotTime < currentFireRate) {
    return;
  }
  const angle = player.angle;
  const speed = CONFIG.bulletSpeed * (IS_COARSE_POINTER ? 1.15 : 1);
  const offset = activeDrone.collisionRadius + 8;
  shots.push({
    x: player.x + Math.cos(angle) * offset,
    y: player.y + Math.sin(angle) * offset,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.2,
    hueOffset: Math.random() * 40,
  });
  lastShotTime = now;
  playShoot();
}

function spawnBtcBurst(x, y) {
  const glyphs = ["₿", "₿", "₿", "🟠"];
  const count = Math.floor(8 + Math.random() * 7);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 160;
    const life = 0.35 + Math.random() * 0.25;
    fxBursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      spin: (Math.random() - 0.5) * 2.2,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    });
  }
}

function bumpCombo(now) {
  const windowMs = 1200;
  if (now - lastComboTime <= windowMs) {
    combo = Math.max(1, combo + 1);
  } else {
    combo = 1;
  }
  lastComboTime = now;
  if (combo > 0 && combo % 5 === 0) {
    showRadioCallout(`Lingo Lingo – Combo x${combo}`);
  }
}

function addScore(baseScore, now) {
  bumpCombo(now);
  const multiplier = 1 + Math.min(4, combo * 0.15);
  score += Math.round(baseScore * multiplier);
}

function hitAsteroid(asteroid, now) {
  flashes.push({ x: asteroid.x, y: asteroid.y, life: 0.15 });
  spawnBtcBurst(asteroid.x, asteroid.y);
  playHit();
  if (asteroid.size === "large") {
    triggerShake(0.18, 10);
  } else if (asteroid.size === "medium") {
    triggerShake(0.12, 7);
  } else {
    triggerShake(0.08, 4);
  }
  const spec = ASTEROID_SIZES[asteroid.size];
  addScore(spec.score, now);
  hitPopups.push({
    x: asteroid.x,
    y: asteroid.y,
    life: 0.8,
    text: asteroid.size === "small" ? "+SATS" : "SPLIT",
  });
  if (spec.split) {
    for (let i = 0; i < 2; i += 1) {
      spawnAsteroid(spec.split, {
        x: asteroid.x + (Math.random() - 0.5) * 12,
        y: asteroid.y + (Math.random() - 0.5) * 12,
      });
    }
  } else {
    satsCollected += 1;
  }
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x: asteroid.x,
      y: asteroid.y,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      life: 0.8,
    });
  }
}

function resetCombo() {
  combo = 0;
}

function applyDamage(amount) {
  health = Math.max(0, health - amount);
  danger = Math.min(100, danger + 12);
  resetCombo();
  triggerShake(0.2, 12);
  playHit();
  if (health <= 0) {
    endGame();
  }
}

function updatePlayer(dt) {
  const centerX = viewWidth * 0.5;
  const centerY = viewHeight * 0.55;
  if (pointerActive) {
    smoothedPointerPos.x += (pointerPos.x - smoothedPointerPos.x) * INPUT_SMOOTHING;
    smoothedPointerPos.y += (pointerPos.y - smoothedPointerPos.y) * INPUT_SMOOTHING;
  }
  const accelBase = activeDrone.accel * (IS_COARSE_POINTER ? MOBILE_ACCEL_MULTIPLIER : 1);
  const accel = 1 - Math.pow(1 - accelBase, dt * 60);
  const maxSpeed = activeDrone.maxSpeed * (IS_COARSE_POINTER ? MOBILE_MAX_SPEED_MULTIPLIER : 1);
  let desiredVx = 0;
  let desiredVy = 0;
  if (pointerActive) {
    const dx = smoothedPointerPos.x - player.x;
    const dy = smoothedPointerPos.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;
    const throttle = clamp(dist / 120, 0, 1);
    desiredVx = dirX * maxSpeed * SWIPE_SENSITIVITY * throttle;
    desiredVy = dirY * maxSpeed * SWIPE_SENSITIVITY * throttle;
  }
  player.vx += (desiredVx - player.vx) * accel;
  player.vy += (desiredVy - player.vy) * accel;
  if (!pointerActive) {
    const drag = 1 - Math.pow(1 - 0.08, dt * 60);
    player.vx += (0 - player.vx) * drag;
    player.vy += (0 - player.vy) * drag;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const padding = 26;
  const minX = safeAreaInsets.left + padding;
  const maxX = viewWidth - safeAreaInsets.right - padding;
  const minY = safeAreaInsets.top + padding;
  const maxY = viewHeight - safeAreaInsets.bottom - padding;
  player.x = clamp(player.x, minX, maxX);
  player.y = clamp(player.y, minY, maxY);

  const velAngle = Math.atan2(player.vy, player.vx);
  if (pointerActive && (Math.abs(desiredVx) > 1 || Math.abs(desiredVy) > 1)) {
    player.angle = Math.atan2(desiredVy, desiredVx);
  } else if (!Number.isNaN(velAngle) && (Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1)) {
    player.angle = velAngle;
  } else if (game.state === GAME_STATES.READY) {
    const dx = centerX - player.x;
    const dy = centerY - player.y;
    player.angle = Math.atan2(dy, dx);
  }
}

function updateEntities(dt, now) {
  shots.forEach((shot) => {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
  });
  shots = shots.filter(
    (shot) =>
      shot.life > 0 &&
      shot.x > -40 &&
      shot.x < viewWidth + 40 &&
      shot.y > -40 &&
      shot.y < viewHeight + 40,
  );

  asteroids.forEach((asteroid) => {
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;
    asteroid.angle += asteroid.spin * dt;
    wrapEntity(asteroid);
  });

  particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  particles = particles.filter((particle) => particle.life > 0);

  fxBursts.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  fxBursts = fxBursts.filter((particle) => particle.life > 0);

  flashes.forEach((flash) => {
    flash.life -= dt;
  });
  flashes = flashes.filter((flash) => flash.life > 0);

  hitPopups.forEach((popup) => {
    popup.life -= dt;
  });
  hitPopups = hitPopups.filter((popup) => popup.life > 0);

  shots.forEach((shot, shotIndex) => {
    asteroids.forEach((asteroid, asteroidIndex) => {
      const dist = Math.hypot(shot.x - asteroid.x, shot.y - asteroid.y);
      if (dist < asteroid.radius) {
        hitAsteroid(asteroid, now);
        shots.splice(shotIndex, 1);
        asteroids.splice(asteroidIndex, 1);
      }
    });
  });

  asteroids.forEach((asteroid, asteroidIndex) => {
    const dist = Math.hypot(player.x - asteroid.x, player.y - asteroid.y);
    if (dist < asteroid.radius + activeDrone.collisionRadius) {
      applyDamage(18);
      hitAsteroid(asteroid, now);
      asteroids.splice(asteroidIndex, 1);
    }
  });

  fireShot(now);
}

function updateTelemetry(dt) {
  const speed = Math.hypot(player.vx, player.vy);
  hudAlt.textContent = Math.round(120 + Math.sin(elapsed / 1200) * 10);
  hudSpd.textContent = Math.round(speed * 0.2);
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
      const maxAsteroids = CONFIG.maxAsteroids + wave * 2;
      const densityBoost = 1 + wave * 0.15;
      if (asteroids.length < maxAsteroids) {
        const spawnChance = CONFIG.spawnRate * densityBoost * dt;
        if (Math.random() < spawnChance) {
          spawnAsteroid("large");
        }
      }
      if (waveTimer >= CONFIG.waveDuration) {
        wave += 1;
        startReadyPhase();
      }
    }
    updatePlayer(dt);
    updateEntities(dt, now);
    updateTelemetry(dt);
    if (now - lastComboTime > 1400) {
      combo = 0;
    }
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

function drawBackground() {
  ctx.fillStyle = "#060a12";
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.save();
  stars.forEach((star) => {
    ctx.globalAlpha = 0.25 + (star.size / 2) * 0.4;
    ctx.fillStyle = "rgba(180, 220, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  const img = droneImages.get(activeDroneId);
  const size = PLAYER_BASE_SIZE;
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle + Math.PI / 2);
  if (img && img.complete) {
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = "#9fd8ff";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.55);
    ctx.lineTo(-size * 0.45, size * 0.45);
    ctx.lineTo(size * 0.45, size * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawAsteroidShape(asteroid) {
  ctx.beginPath();
  asteroid.points.forEach((point, index) => {
    const px = Math.cos(point.angle) * point.radius;
    const py = Math.sin(point.angle) * point.radius;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.closePath();
}

function drawAsteroids() {
  ctx.save();
  asteroids.forEach((asteroid) => {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);
    ctx.fillStyle = "rgba(70, 86, 110, 0.9)";
    ctx.strokeStyle = "rgba(150, 170, 200, 0.6)";
    ctx.lineWidth = 2;
    drawAsteroidShape(asteroid);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(245, 197, 66, 0.9)";
    ctx.font = `700 ${Math.max(10, asteroid.radius * 0.6)}px IBM Plex Mono, Courier New, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("₿", 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function drawShots() {
  ctx.save();
  shots.forEach((shot) => {
    const speed = Math.hypot(shot.vx, shot.vy) || 1;
    const dirX = shot.vx / speed;
    const dirY = shot.vy / speed;
    const length = 24;
    const p0x = shot.x - dirX * length;
    const p0y = shot.y - dirY * length;
    const p1x = shot.x + dirX * 4;
    const p1y = shot.y + dirY * 4;
    const gradient = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
    const hueStops = [350, 30, 55, 120, 180, 220, 280];
    hueStops.forEach((hue, index) => {
      const position = index / (hueStops.length - 1);
      gradient.addColorStop(
        position,
        `hsl(${(hue + shot.hueOffset) % 360} 100% 60%)`,
      );
    });
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(160, 240, 255, 0.65)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p1x, p1y);
    ctx.stroke();
    ctx.shadowBlur = 2;
  });
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  particles.forEach((particle) => {
    ctx.fillStyle = `rgba(194, 245, 255, ${particle.life})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFxBursts() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fxBursts.forEach((particle) => {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    const easeScale = 0.7 + 0.6 * alpha;
    const fontSize = Math.max(12, 22 * easeScale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 214, 120, 0.95)";
    ctx.font = `700 ${fontSize}px IBM Plex Mono, Courier New, monospace`;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.spin * (1 - alpha));
    ctx.fillText(particle.glyph, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function drawFlashes() {
  ctx.save();
  flashes.forEach((flash) => {
    const alpha = Math.max(0, flash.life / 0.15);
    ctx.fillStyle = `rgba(255, 245, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, 16 * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawHitPopups() {
  ctx.save();
  hitPopups.forEach((popup) => {
    const alpha = clamp(popup.life / 0.8, 0, 1);
    const rise = (1 - alpha) * 12;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 231, 150, 0.95)";
    ctx.shadowColor = "rgba(255, 200, 120, 0.7)";
    ctx.shadowBlur = 8;
    ctx.font = "700 14px IBM Plex Mono, Courier New, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(popup.text, popup.x, popup.y - rise);
  });
  ctx.restore();
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
  if (countdownText.includes("\n")) {
    const lines = countdownText.split("\n");
    const lineHeight = fontSize * 0.9;
    const startY = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, 0, startY + index * lineHeight);
    });
  } else {
    ctx.fillText(countdownText, 0, 0);
  }
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
  drawAsteroids();
  drawShots();
  drawParticles();
  drawFxBursts();
  drawFlashes();
  drawHitPopups();
  drawPlayer();
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
  lastComboTime = 0;
  wave = 1;
  waveTimer = 0;
  elapsed = 0;
  shots = [];
  asteroids = [];
  particles = [];
  fxBursts = [];
  flashes = [];
  hitPopups = [];
  satsCollected = 0;
  pointerActive = false;
  lastPointerCanvas = null;
  player = {
    x: viewWidth * 0.5,
    y: viewHeight * 0.55,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
  };
  resumeAudio();
  startCountdownPhase();
  startMusic();
  if (asteroids.length === 0) {
    for (let i = 0; i < 3; i += 1) {
      spawnAsteroid("large");
    }
  }
}

function endGame() {
  stopMusic();
  playGameOver();
  finalScore.textContent = score;
  finalWave.textContent = wave;
  finalCombo.textContent = combo;
  pointerActive = false;
  lastPointerCanvas = null;
  touchEl.textContent = "0,0";
  setState(GAME_STATES.GAMEOVER);
  updateLeaderboard();
}

function handlePointerDown(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  pointerActive = true;
  resumeAudio();
  setPointerPosition(event.clientX, event.clientY, true);
  smoothedPointerPos = { ...pointerPos };
}

function handlePointerMove(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  if (!pointerActive) return;
  setPointerPosition(event.clientX, event.clientY);
}

function handlePointerUp() {
  pointerActive = false;
  lastPointerCanvas = null;
  touchEl.textContent = "0,0";
}

function handleTouchStart(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  event.preventDefault();
  const touch = event.touches[0];
  if (!touch) return;
  pointerActive = true;
  resumeAudio();
  setPointerPosition(touch.clientX, touch.clientY, true);
  smoothedPointerPos = { ...pointerPos };
}

function handleTouchMove(event) {
  if (game.state !== GAME_STATES.READY && game.state !== GAME_STATES.PLAYING) return;
  event.preventDefault();
  if (!pointerActive) return;
  const touch = event.touches[0];
  if (!touch) return;
  setPointerPosition(touch.clientX, touch.clientY);
}

function handleTouchEnd(event) {
  event.preventDefault();
  if (event.touches.length === 0) {
    pointerActive = false;
    lastPointerCanvas = null;
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
