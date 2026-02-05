import {
  resumeAudio,
  startMusic,
  stopMusic,
  toggleMute,
  playShoot,
  playHit,
  playPowerUp,
  playGameOver,
} from "./audio.js";
import {
  submitScore,
  fetchLeaderboard,
  fetchUserBest,
  leaderboardNeedsWarning,
} from "./supabase.js";

const CONFIG = {
  playerSpeed: 3,
  bulletSpeed: 5,
  targetSpeed: 1.25,
  obstacleSpeed: 1.6,
  powerUpSpeed: 1.1,
  spawnRate: 0.015,
  obstacleRate: 0.005,
  powerUpRate: 0.002,
  fireRate: 240,
  maxHealth: 100,
  waveDuration: 20000,
  readyDuration: 3000,
};
const PLAY_PADDING_FACTOR = 0.08;
const SPEED_MULTIPLIER = 0.5;
const INPUT_SMOOTHING = 0.25;
const SWIPE_SENSITIVITY = 1.8;
const MAX_FOLLOW_SPEED_MULTIPLIER = 1.5;
const INPUT_ACCEL = 0.4;
const POINTER_FOLLOW_STRENGTH = 0.35;

const DRONE_STORAGE_KEY = "sats_drone_skin";
const DRONE_OPTIONS = [
  {
    id: "cinewhoop",
    name: "Cinewhoop",
    image: "assets/drones/cinewhoop.svg",
    speedMultiplier: 0.95,
    fireRateMultiplier: 0.95,
    healthBonus: 1,
  },
  {
    id: "racer",
    name: "Racer",
    image: "assets/drones/racer.svg",
    speedMultiplier: 1.1,
    fireRateMultiplier: 1.05,
    healthBonus: -1,
  },
  {
    id: "freestyle",
    name: "Freestyle",
    image: "assets/drones/freestyle.svg",
    speedMultiplier: 1.05,
    fireRateMultiplier: 1.1,
    healthBonus: 0,
  },
  {
    id: "mapper",
    name: "Mapper",
    image: "assets/drones/mapper.svg",
    speedMultiplier: 0.9,
    fireRateMultiplier: 0.95,
    healthBonus: 1,
  },
  {
    id: "delivery",
    name: "Delivery",
    image: "assets/drones/delivery.svg",
    speedMultiplier: 0.9,
    fireRateMultiplier: 0.9,
    healthBonus: 1,
  },
  {
    id: "heavy-lift",
    name: "Heavy Lift",
    image: "assets/drones/heavy-lift.svg",
    speedMultiplier: 0.85,
    fireRateMultiplier: 0.9,
    healthBonus: 1,
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
const dangerFill = document.getElementById("dangerFill");
const hudLingo = document.getElementById("hud-lingo");
const hudAlt = document.getElementById("hud-alt");
const hudSpd = document.getElementById("hud-spd");
const hudRssi = document.getElementById("hud-rssi");
const hudSat = document.getElementById("hud-sat");
const hudPwr = document.getElementById("hud-pwr");
const levelCallout = document.getElementById("level-callout");
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
const warningBanner = document.getElementById("warning");
const muteButton = document.getElementById("muteButton");
const droneButtons = document.querySelectorAll(".drone-option");
const hudStack = document.getElementById("hud-stack");

let lastTime = 0;
let elapsed = 0;
let wave = 1;
let waveTimer = 0;
let waveState = "ready";
let readyTimer = CONFIG.readyDuration;
let score = 0;
let health = CONFIG.maxHealth;
let maxHealth = CONFIG.maxHealth;
let danger = 0;
let combo = 0;
let gameState = "start";
let bullets = [];
let targets = [];
let obstacles = [];
let particles = [];
let flashes = [];
let powerUps = [];
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
let player = { x: 0.5, y: 0.7, vx: 0, vy: 0 };
let activeDroneId = DRONE_OPTIONS[0].id;
let activeDrone = DRONE_OPTIONS[0];
let playerSpeedMultiplier = 1;
let fireRateMultiplier = 1;
let currentFireRate = CONFIG.fireRate;
const droneImages = new Map();
const stars = [];
const STAR_COUNT = 140;
let playPaddingX = 0;
let playPaddingY = 0;
let stackHeightPx = 0;
let loseThresholdPx = 0;
let shakeTime = 0;
let shakeDuration = 0;
let shakeMagnitude = 0;

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
  levelCallout.textContent = `WAVE ${wave}`;
  levelCallout.classList.remove("hidden");
  setTimeout(() => levelCallout.classList.add("hidden"), 1200);
}

function startReadyPhase() {
  waveState = "ready";
  readyTimer = CONFIG.readyDuration;
  readyPanel.classList.remove("hidden");
}

function startWave() {
  waveState = "active";
  waveTimer = 0;
  readyPanel.classList.add("hidden");
  showWaveCallout();
}

function resizeCanvas() {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  viewWidth = innerWidth;
  viewHeight = innerHeight;
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  playPaddingX = viewWidth * PLAY_PADDING_FACTOR;
  playPaddingY = viewHeight * PLAY_PADDING_FACTOR;
  loseThresholdPx = viewHeight * 0.3;
  stackHeightPx = Math.min(stackHeightPx, viewHeight);
  initStars();
}

function initStars() {
  stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      size: Math.random() * 1.6 + 0.4,
      speed: Math.random() * 18 + 6,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }
}

function updateStars(dt) {
  stars.forEach((star) => {
    star.y += star.speed * dt * SPEED_MULTIPLIER;
    if (star.y > viewHeight) {
      star.y = -2;
      star.x = Math.random() * viewWidth;
    }
  });
}

function getDroneById(id) {
  return DRONE_OPTIONS.find((drone) => drone.id === id) || DRONE_OPTIONS[0];
}

function setActiveDrone(id) {
  activeDroneId = id;
  activeDrone = getDroneById(id);
  playerSpeedMultiplier = activeDrone.speedMultiplier;
  fireRateMultiplier = activeDrone.fireRateMultiplier;
  currentFireRate = CONFIG.fireRate / fireRateMultiplier;
  maxHealth = CONFIG.maxHealth + activeDrone.healthBonus;
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
  const bounds = getPlayBounds();
  pointerPos = {
    x: bounds.minX + clamp(rawX, 0, 1) * (bounds.maxX - bounds.minX),
    y: bounds.minY + clamp(rawY, 0, 1) * (bounds.maxY - bounds.minY),
  };
  touchEl.textContent = `${Math.round(pointerPos.x * 100)},${Math.round(pointerPos.y * 100)}`;
}

function spawnTarget() {
  targets.push({
    x: Math.random(),
    y: -0.1,
    r: 0.04,
    speed: (CONFIG.targetSpeed + wave * 0.08) * SPEED_MULTIPLIER,
  });
}

function spawnObstacle() {
  obstacles.push({
    x: Math.random(),
    y: -0.1,
    w: 0.08,
    h: 0.05,
    speed: (CONFIG.obstacleSpeed + wave * 0.12) * SPEED_MULTIPLIER,
  });
}

function spawnPowerUp() {
  const roll = Math.random();
  let type = "shield";
  if (roll > 0.7) {
    type = "multiplier";
  } else if (roll > 0.45) {
    type = "speed";
  }
  powerUps.push({
    x: Math.random(),
    y: -0.1,
    r: 0.035,
    speed: CONFIG.powerUpSpeed * SPEED_MULTIPLIER,
    type,
  });
}

function fireBullet(now) {
  if (now - lastShotTime < currentFireRate) {
    return;
  }
  bullets.push({
    x: player.x,
    y: player.y - 0.05,
    speed: CONFIG.bulletSpeed,
  });
  lastShotTime = now;
  playShoot();
}

function hitTarget(target) {
  combo = Math.max(1, combo + 1);
  const baseScore = 10;
  const multiplier = activePowerUps.multiplier > 0 ? 2 : 1;
  score += baseScore * combo * multiplier;
  triggerShake(0.12, 6);
  flashes.push({ x: target.x, y: target.y, life: 0.15 });
  playHit();
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x: target.x,
      y: target.y,
      vx: (Math.random() - 0.5) * 0.02 * SPEED_MULTIPLIER,
      vy: (Math.random() - 0.5) * 0.02 * SPEED_MULTIPLIER,
      life: 1,
    });
  }
}

function resetCombo() {
  combo = 0;
}

function applyDamage(amount, options = {}) {
  const { isObstacle = false } = options;
  if (activePowerUps.shield > 0) {
    resetCombo();
    return;
  }
  health = Math.max(0, health - amount);
  if (isObstacle) {
    danger = Math.min(100, danger + 8);
    resetCombo();
  } else {
    resetCombo();
  }
  playHit();
  if (health <= 0) {
    endGame();
  }
}

function activatePowerUp(type) {
  if (type === "shield") {
    activePowerUps.shield = 3000;
  }
  if (type === "multiplier") {
    activePowerUps.multiplier = 5000;
  }
  if (type === "speed") {
    activePowerUps.speed = 3000;
  }
  playPowerUp();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPlayBounds() {
  const minX = playPaddingX / viewWidth;
  const maxX = (viewWidth - playPaddingX) / viewWidth;
  const minY = playPaddingY / viewHeight;
  const floorY = Math.max(playPaddingY, viewHeight - stackHeightPx - playPaddingY);
  const maxY = Math.max(minY, floorY / viewHeight);
  return {
    minX: clamp(minX, 0, 1),
    maxX: clamp(maxX, 0, 1),
    minY: clamp(minY, 0, 1),
    maxY: clamp(maxY, 0, 1),
  };
}

function constrainPlayerToBounds() {
  const bounds = getPlayBounds();
  player.x = clamp(player.x, bounds.minX, bounds.maxX);
  player.y = clamp(player.y, bounds.minY, bounds.maxY);
}

function updatePlayer(dt) {
  if (!pointerActive) return;
  smoothedPointerPos.x += (pointerPos.x - smoothedPointerPos.x) * INPUT_SMOOTHING;
  smoothedPointerPos.y += (pointerPos.y - smoothedPointerPos.y) * INPUT_SMOOTHING;
  const dx = smoothedPointerPos.x - player.x;
  const dy = smoothedPointerPos.y - player.y;
  const speedBoost = activePowerUps.speed > 0 ? 1.35 : 1;
  const speed = CONFIG.playerSpeed * playerSpeedMultiplier * speedBoost * SWIPE_SENSITIVITY;
  const desiredVx = dx * speed;
  const desiredVy = dy * speed;
  player.vx += (desiredVx - player.vx) * INPUT_ACCEL;
  player.vy += (desiredVy - player.vy) * INPUT_ACCEL;
  const maxSpeed = speed * MAX_FOLLOW_SPEED_MULTIPLIER;
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
  player.vy = Math.max(-maxSpeed, Math.min(maxSpeed, player.vy));
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  constrainPlayerToBounds();
}

function updateEntities(dt, now) {
  bullets = bullets.filter((bullet) => bullet.y > -0.1);
  bullets.forEach((bullet) => {
    bullet.y -= bullet.speed * dt;
  });

  targets.forEach((target) => {
    target.y += target.speed * dt;
  });
  const missedTargets = targets.filter((target) => target.y >= 1.2).length;
  targets = targets.filter((target) => target.y < 1.2);
  if (missedTargets > 0) {
    resetCombo();
  }

  obstacles.forEach((obstacle) => {
    obstacle.y += obstacle.speed * dt;
  });
  obstacles = obstacles.filter((obstacle) => {
    const obstacleHeightPx = obstacle.h * viewHeight;
    const obstacleBottom = obstacle.y * viewHeight + obstacleHeightPx / 2;
    const stackTop = viewHeight - stackHeightPx;
    if (obstacleBottom >= stackTop) {
      stackHeightPx = Math.min(viewHeight, stackHeightPx + obstacleHeightPx);
      return false;
    }
    return obstacle.y < 1.2;
  });

  powerUps.forEach((power) => {
    power.y += power.speed * dt;
  });
  powerUps = powerUps.filter((power) => power.y < 1.2);

  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= dt * 1.1;
  });
  particles = particles.filter((particle) => particle.life > 0);
  flashes.forEach((flash) => {
    flash.life -= dt;
  });
  flashes = flashes.filter((flash) => flash.life > 0);

  bullets.forEach((bullet, bulletIndex) => {
    targets.forEach((target, targetIndex) => {
      const dx = bullet.x - target.x;
      const dy = bullet.y - target.y;
      const dist = Math.hypot(dx, dy);
      if (dist < target.r) {
        hitTarget(target);
        bullets.splice(bulletIndex, 1);
        targets.splice(targetIndex, 1);
      }
    });
  });

  targets.forEach((target, targetIndex) => {
    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist < target.r + 0.05) {
      targets.splice(targetIndex, 1);
      applyDamage(20);
    }
  });

  obstacles.forEach((obstacle, obstacleIndex) => {
    if (
      Math.abs(obstacle.x - player.x) < obstacle.w / 2 + 0.03 &&
      Math.abs(obstacle.y - player.y) < obstacle.h / 2 + 0.04
    ) {
      obstacles.splice(obstacleIndex, 1);
      applyDamage(20, { isObstacle: true });
    }
  });

  powerUps.forEach((power, powerIndex) => {
    const dist = Math.hypot(power.x - player.x, power.y - player.y);
    if (dist < power.r + 0.04) {
      powerUps.splice(powerIndex, 1);
      activatePowerUp(power.type);
    }
  });

  Object.keys(activePowerUps).forEach((key) => {
    if (activePowerUps[key] > 0) {
      activePowerUps[key] = Math.max(0, activePowerUps[key] - dt * 1000);
    }
  });

  fireBullet(now);
  constrainPlayerToBounds();
  if (stackHeightPx >= loseThresholdPx) {
    endGame();
  }
}

function updateTelemetry(dt) {
  hudAlt.textContent = Math.round(100 + Math.sin(elapsed / 1000) * 12);
  hudSpd.textContent = Math.round(40 + wave * 3 + Math.cos(elapsed / 700) * 6);
  hudRssi.textContent = Math.round(90 + Math.sin(elapsed / 400) * 8);
  hudSat.textContent = 6 + (wave % 3);
  hudPwr.textContent = (1 + wave * 0.2).toFixed(1);
  if (hudStack) {
    const stackPercent = loseThresholdPx > 0 ? (stackHeightPx / loseThresholdPx) * 100 : 0;
    hudStack.textContent = `${Math.min(100, Math.round(stackPercent))}%`;
  }
  if (elapsed % 2000 < 50) {
    hudLingo.textContent = lingoSnippets[Math.floor(Math.random() * lingoSnippets.length)];
  }
}

function update(dt, now) {
  if (gameState !== "playing") return;
  elapsed += dt * 1000;
  if (waveState === "ready") {
    readyTimer -= dt * 1000;
    if (readyTimer <= 0) {
      startWave();
    }
  } else {
    waveTimer += dt * 1000;
    const targetRate = CONFIG.spawnRate + wave * 0.002;
    const obstacleRate = CONFIG.obstacleRate + wave * 0.0012;
    if (Math.random() < targetRate) {
      spawnTarget();
    }
    if (Math.random() < obstacleRate) {
      spawnObstacle();
    }
    if (Math.random() < CONFIG.powerUpRate) {
      spawnPowerUp();
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

function drawBackground() {
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.save();
  ctx.fillStyle = "rgba(160, 210, 240, 0.6)";
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(90, 140, 180, 0.18)";
  ctx.lineWidth = 1;
  const gridLines = 12;
  for (let i = 0; i < gridLines; i += 1) {
    const y = (i / gridLines) * viewHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewWidth, y);
    ctx.stroke();
  }
  for (let i = 0; i < gridLines; i += 1) {
    const x = (i / gridLines) * viewWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewHeight);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(120, 190, 220, 0.12)";
  const rings = 3;
  for (let i = 1; i <= rings; i += 1) {
    ctx.beginPath();
    ctx.arc(viewWidth * 0.5, viewHeight * 0.55, (Math.min(viewWidth, viewHeight) / 3) * (i / rings), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  const x = player.x * viewWidth;
  const y = player.y * viewHeight;
  const img = droneImages.get(activeDroneId);
  const size = 40;
  if (img && img.complete) {
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else {
    ctx.fillStyle = "#9fd8ff";
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x - 12, y + 14);
    ctx.lineTo(x + 12, y + 14);
    ctx.closePath();
    ctx.fill();
  }
  if (activePowerUps.shield > 0) {
    ctx.strokeStyle = "rgba(130, 220, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (activePowerUps.multiplier > 0) {
    ctx.strokeStyle = "rgba(255, 214, 120, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.95, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (activePowerUps.speed > 0) {
    ctx.strokeStyle = "rgba(120, 255, 215, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.9, y);
    ctx.lineTo(x - size * 0.4, y - size * 0.4);
    ctx.lineTo(x - size * 0.1, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTargets() {
  ctx.save();
  targets.forEach((target) => {
    const x = target.x * viewWidth;
    const y = target.y * viewHeight;
    ctx.fillStyle = "#c2f5ff";
    ctx.font = "20px IBM Plex Mono, Courier New, monospace";
    ctx.fillText("₿", x - 8, y + 8);
  });
  ctx.restore();
}

function drawObstacles() {
  ctx.save();
  obstacles.forEach((obstacle) => {
    const x = obstacle.x * viewWidth;
    const y = obstacle.y * viewHeight;
    ctx.fillStyle = "#ff6b7a";
    ctx.fillRect(
      x - (obstacle.w * viewWidth) / 2,
      y - (obstacle.h * viewHeight) / 2,
      obstacle.w * viewWidth,
      obstacle.h * viewHeight
    );
  });
  ctx.restore();
}

function drawStack() {
  if (stackHeightPx <= 0) return;
  ctx.save();
  const topY = viewHeight - stackHeightPx;
  ctx.fillStyle = "#b73a48";
  ctx.fillRect(0, topY, viewWidth, stackHeightPx);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#8f2a35";
  const blockW = Math.max(22, viewWidth * 0.05);
  const blockH = Math.max(16, viewHeight * 0.035);
  for (let y = topY; y < viewHeight; y += blockH + 4) {
    for (let x = 0; x < viewWidth; x += blockW + 6) {
      ctx.fillRect(x, y, blockW, blockH);
    }
  }
  ctx.restore();
}

function drawPowerUps() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  powerUps.forEach((power) => {
    const x = power.x * viewWidth;
    const y = power.y * viewHeight;
    let stroke = "#c2f5ff";
    let text = "S";
    if (power.type === "multiplier") {
      stroke = "#ffd678";
      text = "x2";
    } else if (power.type === "speed") {
      stroke = "#78ffd7";
      text = ">>";
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, power.r * viewWidth, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.font = "12px IBM Plex Mono, Courier New, monospace";
    ctx.fillText(text, x, y);
  });
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.strokeStyle = "#9fd8ff";
  ctx.lineWidth = 2;
  bullets.forEach((bullet) => {
    const x = bullet.x * viewWidth;
    const y = bullet.y * viewHeight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 12);
    ctx.stroke();
  });
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  particles.forEach((particle) => {
    ctx.fillStyle = `rgba(194, 245, 255, ${particle.life})`;
    ctx.beginPath();
    ctx.arc(particle.x * viewWidth, particle.y * viewHeight, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFlashes() {
  ctx.save();
  flashes.forEach((flash) => {
    const alpha = Math.max(0, flash.life / 0.15);
    ctx.fillStyle = `rgba(255, 245, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(flash.x * viewWidth, flash.y * viewHeight, 18 * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
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
  drawStack();
  drawBullets();
  drawTargets();
  drawObstacles();
  drawPowerUps();
  drawParticles();
  drawFlashes();
  drawPlayer();
  ctx.restore();
}

function loop(timestamp) {
  const now = timestamp || performance.now();
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  updateStars(dt);
  if (shakeTime > 0) {
    shakeTime = Math.max(0, shakeTime - dt);
  }
  if (gameState === "playing") {
    update(dt, now);
  }
  render();
  if (diagnosticsEnabled) {
    fpsEl.textContent = Math.round(1 / dt);
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
  gameState = "playing";
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  warningBanner.classList.add("hidden");
  score = 0;
  health = maxHealth;
  danger = 0;
  combo = 0;
  wave = 1;
  waveTimer = 0;
  waveState = "ready";
  readyTimer = CONFIG.readyDuration;
  elapsed = 0;
  bullets = [];
  targets = [];
  obstacles = [];
  particles = [];
  flashes = [];
  powerUps = [];
  activePowerUps = {
    shield: 0,
    multiplier: 0,
    speed: 0,
  };
  stackHeightPx = 0;
  pointerActive = true;
  player = { x: 0.5, y: 0.7, vx: 0, vy: 0 };
  readyPanel.classList.remove("hidden");
  startMusic();
}

function endGame() {
  gameState = "gameover";
  stopMusic();
  playGameOver();
  finalScore.textContent = score;
  finalWave.textContent = wave;
  finalCombo.textContent = combo;
  readyPanel.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
  updateLeaderboard();
}

function handlePointerDown(event) {
  pointerActive = true;
  resumeAudio();
  setPointerPosition(event.clientX, event.clientY);
  smoothedPointerPos = { ...pointerPos };
}

function handlePointerMove(event) {
  if (!pointerActive) return;
  setPointerPosition(event.clientX, event.clientY);
  player.x += (pointerPos.x - player.x) * POINTER_FOLLOW_STRENGTH;
  player.y += (pointerPos.y - player.y) * POINTER_FOLLOW_STRENGTH;
  constrainPlayerToBounds();
}

function handlePointerUp() {
  pointerActive = false;
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
}

function initInput() {
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
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
