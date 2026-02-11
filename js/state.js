import { CONFIG, GAME_STATES, DRONE_OPTIONS } from "./config.js";

export const state = {
    game: {
          state: GAME_STATES.BOOT,
          viewW: window.innerWidth,
          viewH: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
          hudInset: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    canvas: null,
    ctx: null,
    lastTime: 0,
    elapsed: 0,
    wave: 1,
    waveTimer: 0,
    readyTimer: CONFIG.readyDuration,
    score: 0,
    health: CONFIG.maxHealth,
    maxHealth: CONFIG.maxHealth,
    danger: 0,
    combo: 0,
    lastComboTime: 0,
    shots: [],
    asteroids: [],
    particles: [],
    fxBursts: [],
    flashes: [],
    hitPopups: [],
    lastShotTime: 0,
    diagnosticsEnabled: false,
    isTouching: false,
    pointerPos: { x: 0, y: 0 },
    lastPointerCanvas: null,
    stickCenter: { x: 0, y: 0 },
    stickOffset: { x: 0, y: 0 },
    stickVector: { x: 0, y: 0 },
    player: {
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.55,
          vx: 0,
          vy: 0,
          angle: -Math.PI / 2,
    },
    activeDroneId: DRONE_OPTIONS[0].id,
    activeDrone: { ...DRONE_OPTIONS[0] },
    currentFireRate: CONFIG.fireRate,
    satsCollected: 0,
    droneImages: new Map(),
    stars: [],
    shakeTime: 0,
    shakeDuration: 0,
    shakeMagnitude: 0,
    lastWaveCallout: 0,
    fpsAccumulator: 0,
    fpsFrames: 0,
    countdownRemainingMs: 0,
    countdownStepIndex: 0,
    countdownText: "",
    countdownStepDuration: 0,
    keyboardInput: { x: 0, y: 0 },
};

export function resetGameState() {
    state.score = 0;
    state.health = state.maxHealth;
    state.danger = 0;
    state.combo = 0;
    state.lastComboTime = 0;
    state.wave = 1;
    state.waveTimer = 0;
    state.elapsed = 0;
    state.shots = [];
    state.asteroids = [];
    state.particles = [];
    state.fxBursts = [];
    state.flashes = [];
    state.hitPopups = [];
    state.lastShotTime = 0;
    state.satsCollected = 0;
    state.isTouching = false;
    state.lastPointerCanvas = null;
    state.stickOffset = { x: 0, y: 0 };
    state.stickVector = { x: 0, y: 0 };
    state.keyboardInput = { x: 0, y: 0 };
    state.player = {
          x: state.game.viewW * 0.5,
          y: state.game.viewH * 0.55,
          vx: 0,
          vy: 0,
          angle: -Math.PI / 2,
    };
}
