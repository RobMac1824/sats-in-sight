import { state } from "./state.js";
import { log } from "./logger.js";
import {
  CONFIG,
  DRONE_OPTIONS,
  IS_COARSE_POINTER,
  MOBILE_ACCEL_MULTIPLIER,
  MOBILE_MAX_SPEED_MULTIPLIER,
  DRONE_MAX_SPEED_MULTIPLIER,
  STICK_FRICTION,
  GAME_STATES,
} from "./config.js";
import { clamp } from "./utils.js";
import { applyStickCurve } from "./input.js";

const droneButtons = document.querySelectorAll(".drone-option");

export function getDroneById(id) {
  return DRONE_OPTIONS.find((drone) => drone.id === id) || DRONE_OPTIONS[0];
}

export function setActiveDrone(id) {
  state.activeDroneId = id;
  const baseDrone = getDroneById(id);
  state.activeDrone = { ...baseDrone };
  state.currentFireRate = CONFIG.fireRate;
  state.maxHealth = CONFIG.maxHealth;
}

export function loadDroneImages() {
  DRONE_OPTIONS.forEach((drone) => {
    const img = new Image();
    img.src = drone.image;
    img
      .decode()
      .then(() => state.droneImages.set(drone.id, img))
      .catch((err) => {
        log("WARN", `Drone image failed to decode: ${drone.id}`, err);
        state.droneImages.set(drone.id, img);
      });
  });
}

export function updateDroneSelectionUI() {
  droneButtons.forEach((button) => {
    const isSelected = button.dataset.drone === state.activeDroneId;
    button.classList.toggle("selected", isSelected);
  });
}

export function updatePlayer(dt) {
  const centerX = state.game.viewW * 0.5;
  const centerY = state.game.viewH * 0.55;
  const accelBase =
    state.activeDrone.accel * (IS_COARSE_POINTER ? MOBILE_ACCEL_MULTIPLIER : 1) * 0.75;
  const accel = 1 - Math.pow(1 - accelBase, dt * 60);
  const maxSpeed =
    state.activeDrone.maxSpeed *
    DRONE_MAX_SPEED_MULTIPLIER *
    (IS_COARSE_POINTER ? MOBILE_MAX_SPEED_MULTIPLIER : 1);
  let desiredVx = 0;
  let desiredVy = 0;
  if (state.isTouching) {
    const curvedVector = applyStickCurve(state.stickVector);
    desiredVx = curvedVector.x * maxSpeed;
    desiredVy = curvedVector.y * maxSpeed;
  }
  state.player.vx += (desiredVx - state.player.vx) * accel;
  state.player.vy += (desiredVy - state.player.vy) * accel;
  if (!state.isTouching) {
    const friction = Math.pow(STICK_FRICTION, dt * 60);
    state.player.vx *= friction;
    state.player.vy *= friction;
  }
  state.player.x += state.player.vx * dt;
  state.player.y += state.player.vy * dt;
  const inset = state.game.hudInset || { top: 0, right: 0, bottom: 0, left: 0 };
  const padding = 26;
  const minX = inset.left + padding;
  const maxX = state.game.viewW - inset.right - padding;
  const minY = inset.top + padding;
  const maxY = state.game.viewH - inset.bottom - padding;
  state.player.x = clamp(state.player.x, minX, maxX);
  state.player.y = clamp(state.player.y, minY, maxY);

  const speed = Math.hypot(state.player.vx, state.player.vy);
  if (speed > 5) {
    state.player.angle = Math.atan2(state.player.vy, state.player.vx);
  } else if (state.game.state === GAME_STATES.READY) {
    const dx = centerX - state.player.x;
    const dy = centerY - state.player.y;
    state.player.angle = Math.atan2(dy, dx);
  }
}
