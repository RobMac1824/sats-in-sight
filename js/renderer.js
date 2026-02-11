import { state } from "./state.js";
import { GAME_STATES, PLAYER_BASE_SIZE, STICK_RADIUS } from "./config.js";
import { clamp } from "./utils.js";

function drawBackground() {
  const ctx = state.ctx;
  ctx.fillStyle = "#060a12";
  ctx.fillRect(0, 0, state.game.viewW, state.game.viewH);
  ctx.save();
  state.stars.forEach((star) => {
    ctx.globalAlpha = 0.25 + (star.size / 2) * 0.4;
    ctx.fillStyle = "rgba(180, 220, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawPlayer() {
  const ctx = state.ctx;
  ctx.save();
  const img = state.droneImages.get(state.activeDroneId);
  const size = PLAYER_BASE_SIZE;
  ctx.translate(state.player.x, state.player.y);
  ctx.rotate(state.player.angle + Math.PI / 2);
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
  const noseLength = size * 0.45;
  const noseWidth = size * 0.18;
  ctx.strokeStyle = "rgba(240, 250, 255, 0.85)";
  ctx.fillStyle = "rgba(240, 250, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -noseLength);
  ctx.lineTo(-noseWidth, -noseLength + noseWidth * 1.3);
  ctx.lineTo(noseWidth, -noseLength + noseWidth * 1.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawJoystick() {
  if (!state.isTouching) return;
  const ctx = state.ctx;
  const tipX = state.stickCenter.x + state.stickOffset.x;
  const tipY = state.stickCenter.y + state.stickOffset.y;
  ctx.save();
  ctx.strokeStyle = "rgba(160, 210, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.stickCenter.x, state.stickCenter.y, STICK_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(200, 240, 255, 0.55)";
  ctx.beginPath();
  ctx.moveTo(state.stickCenter.x, state.stickCenter.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.fillStyle = "rgba(220, 250, 255, 0.55)";
  ctx.beginPath();
  ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAsteroidShape(asteroid) {
  const ctx = state.ctx;
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
  const ctx = state.ctx;
  ctx.save();
  state.asteroids.forEach((asteroid) => {
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
  const ctx = state.ctx;
  ctx.save();
  state.shots.forEach((shot) => {
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
  const ctx = state.ctx;
  ctx.save();
  state.particles.forEach((particle) => {
    ctx.fillStyle = `rgba(194, 245, 255, ${particle.life})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFxBursts() {
  const ctx = state.ctx;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  state.fxBursts.forEach((particle) => {
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
  const ctx = state.ctx;
  ctx.save();
  state.flashes.forEach((flash) => {
    const alpha = Math.max(0, flash.life / 0.15);
    ctx.fillStyle = `rgba(255, 245, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, 16 * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawHitPopups() {
  const ctx = state.ctx;
  ctx.save();
  state.hitPopups.forEach((popup) => {
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
  if (state.game.state !== GAME_STATES.COUNTDOWN || !state.countdownText) return;
  const ctx = state.ctx;
  const inset = state.game.hudInset || { top: 0, right: 0, bottom: 0, left: 0 };
  const safeWidth = state.game.viewW - inset.left - inset.right;
  const safeHeight = state.game.viewH - inset.top - inset.bottom;
  const centerX = inset.left + safeWidth * 0.5;
  const centerY = inset.top + safeHeight * 0.5;
  const progress = clamp(
    1 - state.countdownRemainingMs / Math.max(1, state.countdownStepDuration),
    0,
    1,
  );
  const alpha = Math.sin(Math.PI * progress);
  const scale = 0.92 + 0.1 * Math.sin(Math.PI * progress);
  const fontSize = Math.min(state.game.viewW, state.game.viewH) * 0.14;
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
  if (state.countdownText.includes("\n")) {
    const lines = state.countdownText.split("\n");
    const lineHeight = fontSize * 0.9;
    const startY = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, 0, startY + index * lineHeight);
    });
  } else {
    ctx.fillText(state.countdownText, 0, 0);
  }
  ctx.restore();
}

export function render() {
  const ctx = state.ctx;
  ctx.clearRect(0, 0, state.game.viewW, state.game.viewH);
  ctx.save();
  if (state.shakeTime > 0) {
    const intensity = state.shakeDuration ? state.shakeTime / state.shakeDuration : 0;
    const offsetX = (Math.random() - 0.5) * state.shakeMagnitude * intensity;
    const offsetY = (Math.random() - 0.5) * state.shakeMagnitude * intensity;
    ctx.translate(offsetX, offsetY);
  }
  drawBackground();
  drawAsteroids();
  drawShots();
  drawParticles();
  drawFxBursts();
  drawFlashes();
  drawHitPopups();
  drawJoystick();
  drawPlayer();
  drawCountdownOverlay();
  ctx.restore();
}
