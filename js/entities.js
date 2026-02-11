import { state } from "./state.js";
import { CONFIG, ASTEROID_SIZES, IS_COARSE_POINTER, STAR_COUNT } from "./config.js";
import { playShoot, playHit } from "./audio.js";
import { showRadioCallout } from "./hud.js";

export function triggerShake(duration, magnitude) {
  state.shakeTime = duration;
  state.shakeDuration = duration;
  state.shakeMagnitude = magnitude;
}

export function initStars() {
  state.stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i += 1) {
    state.stars.push({
      x: Math.random() * state.game.viewW,
      y: Math.random() * state.game.viewH,
      size: Math.random() * 1.6 + 0.4,
      speed: Math.random() * 8 + 4,
      drift: (Math.random() - 0.5) * 3,
    });
  }
}

export function updateStars(dt) {
  state.stars.forEach((star) => {
    star.y += star.speed * dt;
    star.x += star.drift * dt;
    if (star.y > state.game.viewH + 4) {
      star.y = -4;
      star.x = Math.random() * state.game.viewW;
    }
    if (star.x < -4) {
      star.x = state.game.viewW + 4;
    }
    if (star.x > state.game.viewW + 4) {
      star.x = -4;
    }
  });
}

export function spawnAsteroid(size = "large", position = null) {
  const spec = ASTEROID_SIZES[size];
  const margin = spec.radius + 20;
  let x;
  let y;
  if (position) {
    ({ x, y } = position);
  } else {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      x = Math.random() * state.game.viewW;
      y = -margin;
    } else if (edge === 1) {
      x = state.game.viewW + margin;
      y = Math.random() * state.game.viewH;
    } else if (edge === 2) {
      x = Math.random() * state.game.viewW;
      y = state.game.viewH + margin;
    } else {
      x = -margin;
      y = Math.random() * state.game.viewH;
    }
  }
  const angle = Math.random() * Math.PI * 2;
  const speed = spec.speed + state.wave * 3 + Math.random() * 8;
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
  state.asteroids.push({
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

export function wrapEntity(entity) {
  const margin = entity.radius + 20;
  if (entity.x < -margin) entity.x = state.game.viewW + margin;
  if (entity.x > state.game.viewW + margin) entity.x = -margin;
  if (entity.y < -margin) entity.y = state.game.viewH + margin;
  if (entity.y > state.game.viewH + margin) entity.y = -margin;
}

export function fireShot(now) {
  if (now - state.lastShotTime < state.currentFireRate) {
    return;
  }
  const angle = state.player.angle;
  const speed = CONFIG.bulletSpeed * (IS_COARSE_POINTER ? 1.15 : 1);
  const offset = state.activeDrone.collisionRadius + 8;
  state.shots.push({
    x: state.player.x + Math.cos(angle) * offset,
    y: state.player.y + Math.sin(angle) * offset,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.2,
    hueOffset: Math.random() * 40,
  });
  state.lastShotTime = now;
  playShoot();
}

export function spawnBtcBurst(x, y) {
  const glyphs = ["₿", "₿", "₿", "🟠"];
  const count = Math.floor(8 + Math.random() * 7);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 160;
    const life = 0.35 + Math.random() * 0.25;
    state.fxBursts.push({
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

export function bumpCombo(now) {
  const windowMs = 1200;
  if (now - state.lastComboTime <= windowMs) {
    state.combo = Math.max(1, state.combo + 1);
  } else {
    state.combo = 1;
  }
  state.lastComboTime = now;
  if (state.combo > 0 && state.combo % 5 === 0) {
    showRadioCallout(`Lingo Lingo – Combo x${state.combo}`);
  }
}

export function addScore(baseScore, now) {
  bumpCombo(now);
  const multiplier = 1 + Math.min(4, state.combo * 0.15);
  state.score += Math.round(baseScore * multiplier);
}

export function hitAsteroid(asteroid, now) {
  state.flashes.push({ x: asteroid.x, y: asteroid.y, life: 0.15 });
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
  state.hitPopups.push({
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
    state.satsCollected += 1;
  }
  for (let i = 0; i < 12; i += 1) {
    state.particles.push({
      x: asteroid.x,
      y: asteroid.y,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      life: 0.8,
    });
  }
}

export function resetCombo() {
  state.combo = 0;
}

export function applyDamage(amount) {
  state.health = Math.max(0, state.health - amount);
  state.danger = Math.min(100, state.danger + 12);
  resetCombo();
  triggerShake(0.2, 12);
  playHit();
}

export function updateEntities(dt, now) {
  state.shots.forEach((shot) => {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
  });
  state.shots = state.shots.filter(
    (shot) =>
      shot.life > 0 &&
      shot.x > -40 &&
      shot.x < state.game.viewW + 40 &&
      shot.y > -40 &&
      shot.y < state.game.viewH + 40,
  );

  state.asteroids.forEach((asteroid) => {
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;
    asteroid.angle += asteroid.spin * dt;
    wrapEntity(asteroid);
  });

  state.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  state.particles = state.particles.filter((particle) => particle.life > 0);

  state.fxBursts.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  state.fxBursts = state.fxBursts.filter((particle) => particle.life > 0);

  state.flashes.forEach((flash) => {
    flash.life -= dt;
  });
  state.flashes = state.flashes.filter((flash) => flash.life > 0);

  state.hitPopups.forEach((popup) => {
    popup.life -= dt;
  });
  state.hitPopups = state.hitPopups.filter((popup) => popup.life > 0);

  const hitShots = new Set();
  const hitAsteroids = new Set();
  state.shots.forEach((shot, si) => {
    if (hitShots.has(si)) return;
    state.asteroids.forEach((asteroid, ai) => {
      if (hitShots.has(si) || hitAsteroids.has(ai)) return;
      if (Math.hypot(shot.x - asteroid.x, shot.y - asteroid.y) < asteroid.radius) {
        hitAsteroid(asteroid, now);
        hitShots.add(si);
        hitAsteroids.add(ai);
      }
    });
  });
  state.shots = state.shots.filter((_, i) => !hitShots.has(i));
  state.asteroids = state.asteroids.filter((_, i) => !hitAsteroids.has(i));

  const playerHitAsteroids = new Set();
  state.asteroids.forEach((asteroid, ai) => {
    if (
      Math.hypot(state.player.x - asteroid.x, state.player.y - asteroid.y) <
      asteroid.radius + state.activeDrone.collisionRadius
    ) {
      applyDamage(18);
      hitAsteroid(asteroid, now);
      playerHitAsteroids.add(ai);
    }
  });
  state.asteroids = state.asteroids.filter((_, i) => !playerHitAsteroids.has(i));

  fireShot(now);
}
