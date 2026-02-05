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
  playerSpeed: 6,
  bulletSpeed: 10,
  targetSpeed: 2.5,
  obstacleSpeed: 3.2,
  powerUpSpeed: 2.2,
  spawnRate: 0.03,
  obstacleRate: 0.008,
  powerUpRate: 0.004,
  fireRate: 180,
  powerUpDuration: 5000,
  maxHealth: 100,
  levelDuration: 15000,
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

const hudScore = document.getElementById("score");
const hudHealth = document.getElementById("health");
const hudLevel = document.getElementById("level");
const hudLingo = document.getElementById("hud-lingo");
const hudAlt = document.getElementById("hud-alt");
const hudSpd = document.getElementById("hud-spd");
const hudRssi = document.getElementById("hud-rssi");
const hudSat = document.getElementById("hud-sat");
const hudPwr = document.getElementById("hud-pwr");
const levelCallout = document.getElementById("level-callout");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const usernameInput = document.getElementById("username");
const finalScore = document.getElementById("finalScore");
const leaderboardList = document.getElementById("leaderboardList");
const yourBest = document.getElementById("yourBest");
const diagnosticsToggle = document.getElementById("diagnosticsToggle");
const diagnostics = document.getElementById("diagnostics");
const fpsEl = document.getElementById("fps");
const touchEl = document.getElementById("touch");
const warningBanner = document.getElementById("warning");
const muteButton = document.getElementById("muteButton");

let lastTime = 0;
let elapsed = 0;
let level = 1;
let score = 0;
let health = CONFIG.maxHealth;
let gameState = "start";
let bullets = [];
let targets = [];
let obstacles = [];
let particles = [];
let powerUps = [];
let lastShotTime = 0;
let powerUpActive = false;
let powerUpTimer = 0;
let diagnosticsEnabled = false;
let pointerActive = false;
let pointerPos = { x: 0, y: 0 };
let player = { x: 0.5, y: 0.7, vx: 0, vy: 0 };

const lingoSnippets = [
  "DRN SYN OK",
  "LINGO LOCK",
  "LNG-LNG BURST",
  "SAT FIX",
  "ARMED",
  "OSD LIVE",
  "BTC TRACE",
  "BLASTER HOT",
];

function resizeCanvas() {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  viewWidth = innerWidth;
  viewHeight = innerHeight;
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function setPointerPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointerPos = {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
  touchEl.textContent = `${Math.round(pointerPos.x * 100)},${Math.round(pointerPos.y * 100)}`;
}

function spawnTarget() {
  targets.push({
    x: Math.random(),
    y: -0.1,
    r: 0.04,
    speed: CONFIG.targetSpeed + level * 0.3,
  });
}

function spawnObstacle() {
  obstacles.push({
    x: Math.random(),
    y: -0.1,
    w: 0.08,
    h: 0.05,
    speed: CONFIG.obstacleSpeed + level * 0.4,
  });
}

function spawnPowerUp() {
  powerUps.push({
    x: Math.random(),
    y: -0.1,
    r: 0.035,
    speed: CONFIG.powerUpSpeed,
  });
}

function fireBullet(now) {
  if (now - lastShotTime < (powerUpActive ? CONFIG.fireRate / 2 : CONFIG.fireRate)) {
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
  score += powerUpActive ? 20 : 10;
  playHit();
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x: target.x,
      y: target.y,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      life: 1,
    });
  }
}

function hurtPlayer() {
  health = Math.max(0, health - 20);
  playHit();
  if (health <= 0) {
    endGame();
  }
}

function activatePowerUp() {
  powerUpActive = true;
  powerUpTimer = CONFIG.powerUpDuration;
  playPowerUp();
}

function updatePlayer(dt) {
  if (!pointerActive) return;
  const dx = pointerPos.x - player.x;
  const dy = pointerPos.y - player.y;
  player.vx = dx * CONFIG.playerSpeed;
  player.vy = dy * CONFIG.playerSpeed;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = Math.max(0.08, Math.min(0.92, player.x));
  player.y = Math.max(0.1, Math.min(0.9, player.y));
}

function updateEntities(dt, now) {
  bullets = bullets.filter((bullet) => bullet.y > -0.1);
  bullets.forEach((bullet) => {
    bullet.y -= bullet.speed * dt;
  });

  targets.forEach((target) => {
    target.y += target.speed * dt;
  });
  targets = targets.filter((target) => target.y < 1.2);

  obstacles.forEach((obstacle) => {
    obstacle.y += obstacle.speed * dt;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.y < 1.2);

  powerUps.forEach((power) => {
    power.y += power.speed * dt;
  });
  powerUps = powerUps.filter((power) => power.y < 1.2);

  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= dt * 1.5;
  });
  particles = particles.filter((particle) => particle.life > 0);

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
      hurtPlayer();
    }
  });

  obstacles.forEach((obstacle, obstacleIndex) => {
    if (
      Math.abs(obstacle.x - player.x) < obstacle.w / 2 + 0.03 &&
      Math.abs(obstacle.y - player.y) < obstacle.h / 2 + 0.04
    ) {
      obstacles.splice(obstacleIndex, 1);
      hurtPlayer();
    }
  });

  powerUps.forEach((power, powerIndex) => {
    const dist = Math.hypot(power.x - player.x, power.y - player.y);
    if (dist < power.r + 0.04) {
      powerUps.splice(powerIndex, 1);
      activatePowerUp();
    }
  });

  if (powerUpActive) {
    powerUpTimer -= dt * 1000;
    if (powerUpTimer <= 0) {
      powerUpActive = false;
    }
  }

  fireBullet(now);
}

function updateTelemetry(dt) {
  hudAlt.textContent = Math.round(100 + Math.sin(elapsed / 1000) * 12);
  hudSpd.textContent = Math.round(40 + level * 3 + Math.cos(elapsed / 700) * 6);
  hudRssi.textContent = Math.round(90 + Math.sin(elapsed / 400) * 8);
  hudSat.textContent = 6 + (level % 3);
  hudPwr.textContent = (1 + level * 0.2).toFixed(1);
  if (elapsed % 2000 < 50) {
    hudLingo.textContent = lingoSnippets[Math.floor(Math.random() * lingoSnippets.length)];
  }
  if (levelCallout.classList.contains("hidden") && elapsed % CONFIG.levelDuration < 100) {
    levelCallout.textContent = `LEVEL ${level}`;
    levelCallout.classList.remove("hidden");
    setTimeout(() => levelCallout.classList.add("hidden"), 1200);
  }
}

function update(dt, now) {
  if (gameState !== "playing") return;
  elapsed += dt * 1000;
  if (Math.random() < CONFIG.spawnRate + level * 0.002) {
    spawnTarget();
  }
  if (Math.random() < CONFIG.obstacleRate + level * 0.001) {
    spawnObstacle();
  }
  if (Math.random() < CONFIG.powerUpRate) {
    spawnPowerUp();
  }
  if (elapsed > level * CONFIG.levelDuration) {
    level += 1;
  }
  updatePlayer(dt);
  updateEntities(dt, now);
  updateTelemetry(dt);
  hudScore.textContent = score;
  hudHealth.textContent = health;
  hudLevel.textContent = level;
}

function drawBackground() {
  ctx.fillStyle = "#05070e";
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.save();
  ctx.strokeStyle = "rgba(80, 120, 160, 0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i += 1) {
    const y = (i / 10) * viewHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewWidth, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  const x = player.x * viewWidth;
  const y = player.y * viewHeight;
  ctx.fillStyle = powerUpActive ? "#ffd84a" : "#9fffe0";
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x - 12, y + 14);
  ctx.lineTo(x + 12, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTargets() {
  ctx.save();
  targets.forEach((target) => {
    const x = target.x * viewWidth;
    const y = target.y * viewHeight;
    ctx.fillStyle = "#ffd84a";
    ctx.font = "20px Courier New";
    ctx.fillText("₿", x - 8, y + 8);
  });
  ctx.restore();
}

function drawObstacles() {
  ctx.save();
  obstacles.forEach((obstacle) => {
    const x = obstacle.x * viewWidth;
    const y = obstacle.y * viewHeight;
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(
      x - (obstacle.w * viewWidth) / 2,
      y - (obstacle.h * viewHeight) / 2,
      obstacle.w * viewWidth,
      obstacle.h * viewHeight
    );
  });
  ctx.restore();
}

function drawPowerUps() {
  ctx.save();
  powerUps.forEach((power) => {
    const x = power.x * viewWidth;
    const y = power.y * viewHeight;
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, power.r * viewWidth, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#7df9ff";
    ctx.fillText("+", x - 4, y + 4);
  });
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.strokeStyle = "#9fffe0";
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
    ctx.fillStyle = `rgba(255, 216, 74, ${particle.life})`;
    ctx.beginPath();
    ctx.arc(particle.x * viewWidth, particle.y * viewHeight, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawBullets();
  drawTargets();
  drawObstacles();
  drawPowerUps();
  drawParticles();
  drawPlayer();
}

function loop(timestamp) {
  const now = timestamp || performance.now();
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  if (gameState === "playing") {
    update(dt, now);
    render();
  }
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
  health = CONFIG.maxHealth;
  level = 1;
  elapsed = 0;
  bullets = [];
  targets = [];
  obstacles = [];
  particles = [];
  powerUps = [];
  powerUpActive = false;
  pointerActive = true;
  player = { x: 0.5, y: 0.7, vx: 0, vy: 0 };
  startMusic();
}

function endGame() {
  gameState = "gameover";
  stopMusic();
  playGameOver();
  finalScore.textContent = score;
  gameOverScreen.classList.remove("hidden");
  updateLeaderboard();
}

function handlePointerDown(event) {
  pointerActive = true;
  resumeAudio();
  setPointerPosition(event.clientX, event.clientY);
}

function handlePointerMove(event) {
  if (!pointerActive) return;
  setPointerPosition(event.clientX, event.clientY);
}

function handlePointerUp() {
  pointerActive = false;
}

function initUI() {
  const savedName = localStorage.getItem("lingo_username");
  if (savedName) {
    usernameInput.value = savedName;
  }
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
