export const CONFIG = {
    bulletSpeed: 520,
    fireRate: 220,
    maxHealth: 100,
    waveDuration: 20000,
    readyDuration: 2500,
    spawnRate: 0.35,
    maxAsteroids: 6,
};

export const MOBILE_ACCEL_MULTIPLIER = 2.1;
export const MOBILE_MAX_SPEED_MULTIPLIER = 1.35;
export const DRONE_MAX_SPEED_MULTIPLIER = 0.85;
export const STICK_RESPONSE_CURVE = 1.6;
export const STICK_RADIUS = 80;
export const STICK_FRICTION = 0.94;
export const IS_COARSE_POINTER =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

export const DRONE_STORAGE_KEY = "sats_drone_skin";
export const PLAYER_BASE_SIZE = 28;
export const GAME_STATES = {
    BOOT: "BOOT",
    START: "START",
    SELECT_DRONE: "SELECT_DRONE",
    READY: "READY",
    COUNTDOWN: "COUNTDOWN",
    PLAYING: "PLAYING",
    GAMEOVER: "GAMEOVER",
};

export const DRONE_OPTIONS = [
  {
        id: "cinewhoop",
        name: "Cinewhoop",
        image: "public/assets/drones/cinewhoop.svg",
        accel: 0.42,
        maxSpeed: 260,
        collisionRadius: 18,
  },
  {
        id: "racer",
        name: "Racer",
        image: "public/assets/drones/racer.svg",
        accel: 0.5,
        maxSpeed: 300,
        collisionRadius: 16,
  },
  {
        id: "freestyle",
        name: "Freestyle",
        image: "public/assets/drones/freestyle.svg",
        accel: 0.46,
        maxSpeed: 280,
        collisionRadius: 17,
  },
  {
        id: "heavy-lift",
        name: "Heavy Lift",
        image: "public/assets/drones/heavy-lift.svg",
        accel: 0.34,
        maxSpeed: 230,
        collisionRadius: 20,
  },
  {
        id: "delivery",
        name: "Delivery",
        image: "public/assets/drones/delivery.svg",
        accel: 0.38,
        maxSpeed: 245,
        collisionRadius: 19,
  },
  {
        id: "mapper",
        name: "Mapper",
        image: "public/assets/drones/mapper.svg",
        accel: 0.44,
        maxSpeed: 270,
        collisionRadius: 17,
  },
  ];

export const ASTEROID_SIZES = {
    large: { radius: 52, score: 15, split: "medium", speed: 28 },
    medium: { radius: 32, score: 12, split: "small", speed: 38 },
    small: { radius: 18, score: 28, split: null, speed: 54 },
};

export const COUNTDOWN_SEQUENCE = [
  { text: "DRONES\nGOING UP", duration: 900, beep: 520 },
  { text: "CLEAR PROP", duration: 900, beep: 640 },
  { text: "3", duration: 800, beep: 520 },
  { text: "2", duration: 800, beep: 520 },
  { text: "1", duration: 800, beep: 520 },
  { text: "GO", duration: 500, beep: 820 },
  ];

export const lingoSnippets = [
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

export const STAR_COUNT = 140;
