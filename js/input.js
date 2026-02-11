import { state } from "./state.js";
import { STICK_RADIUS, STICK_RESPONSE_CURVE, GAME_STATES } from "./config.js";
import { clamp } from "./utils.js";
import { resumeAudio } from "./audio.js";

const touchEl = document.getElementById("touch");

function setPointerPosition(clientX, clientY, force = false) {
  const rect = state.canvas.getBoundingClientRect();
  const canvasX = clientX - rect.left;
  const canvasY = clientY - rect.top;
  if (!force && state.lastPointerCanvas) {
    const dx = Math.abs(canvasX - state.lastPointerCanvas.x);
    const dy = Math.abs(canvasY - state.lastPointerCanvas.y);
    if (dx === 0 && dy === 0) {
      return;
    }
  }
  state.lastPointerCanvas = { x: canvasX, y: canvasY };
  state.pointerPos = {
    x: clamp(clientX - rect.left, 0, rect.width),
    y: clamp(clientY - rect.top, 0, rect.height),
  };
  touchEl.textContent = `${Math.round(canvasX)},${Math.round(canvasY)}`;
}

export function applyStickCurve(vector) {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }
  const curved = Math.pow(magnitude, STICK_RESPONSE_CURVE);
  const scale = curved / magnitude;
  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

function updateStickFromPointer() {
  let dx = state.pointerPos.x - state.stickCenter.x;
  let dy = state.pointerPos.y - state.stickCenter.y;
  const mag = Math.hypot(dx, dy) || 0;
  if (mag > STICK_RADIUS) {
    const scale = STICK_RADIUS / mag;
    dx *= scale;
    dy *= scale;
  }
  state.stickOffset = { x: dx, y: dy };
  state.stickVector = {
    x: dx / STICK_RADIUS,
    y: dy / STICK_RADIUS,
  };
}

function startStickInput(clientX, clientY) {
  state.isTouching = true;
  setPointerPosition(clientX, clientY, true);
  state.stickCenter = { ...state.pointerPos };
  state.stickOffset = { x: 0, y: 0 };
  state.stickVector = { x: 0, y: 0 };
}

function moveStickInput(clientX, clientY) {
  setPointerPosition(clientX, clientY);
  updateStickFromPointer();
}

export function endStickInput() {
  state.isTouching = false;
  state.stickOffset = { x: 0, y: 0 };
  state.stickVector = { x: 0, y: 0 };
  state.lastPointerCanvas = null;
  touchEl.textContent = "0,0";
}

function handlePointerDown(event) {
  if (state.game.state !== GAME_STATES.READY && state.game.state !== GAME_STATES.PLAYING) return;
  resumeAudio();
  startStickInput(event.clientX, event.clientY);
}

function handlePointerMove(event) {
  if (state.game.state !== GAME_STATES.READY && state.game.state !== GAME_STATES.PLAYING) return;
  if (!state.isTouching) return;
  moveStickInput(event.clientX, event.clientY);
}

function handlePointerUp() {
  endStickInput();
}

function handleTouchStart(event) {
  if (state.game.state !== GAME_STATES.READY && state.game.state !== GAME_STATES.PLAYING) return;
  event.preventDefault();
  const touch = event.touches[0];
  if (!touch) return;
  resumeAudio();
  startStickInput(touch.clientX, touch.clientY);
}

function handleTouchMove(event) {
  if (state.game.state !== GAME_STATES.READY && state.game.state !== GAME_STATES.PLAYING) return;
  event.preventDefault();
  if (!state.isTouching) return;
  const touch = event.touches[0];
  if (!touch) return;
  moveStickInput(touch.clientX, touch.clientY);
}

function handleTouchEnd(event) {
  event.preventDefault();
  if (event.touches.length === 0) {
    endStickInput();
  }
}

export function initInput() {
  const canvas = state.canvas;
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
