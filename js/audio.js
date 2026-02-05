const STATE = {
  context: null,
  muted: false,
  musicInterval: null,
  masterGain: null,
};

const SCALES = [261.63, 329.63, 392.0, 523.25, 659.25, 784.0];

function ensureContext() {
  if (!STATE.context) {
    STATE.context = new (window.AudioContext || window.webkitAudioContext)();
    STATE.masterGain = STATE.context.createGain();
    STATE.masterGain.gain.value = 0.4;
    STATE.masterGain.connect(STATE.context.destination);
  }
  if (STATE.context.state === "suspended") {
    STATE.context.resume();
  }
}

function playTone(freq, duration = 0.1, type = "sine", gainValue = 0.2) {
  if (STATE.muted) return;
  ensureContext();
  const osc = STATE.context.createOscillator();
  const gain = STATE.context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  osc.connect(gain);
  gain.connect(STATE.masterGain);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, STATE.context.currentTime + duration);
  osc.stop(STATE.context.currentTime + duration);
}

function playNoise(duration = 0.2, gainValue = 0.2) {
  if (STATE.muted) return;
  ensureContext();
  const bufferSize = STATE.context.sampleRate * duration;
  const buffer = STATE.context.createBuffer(1, bufferSize, STATE.context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = STATE.context.createBufferSource();
  noise.buffer = buffer;
  const gain = STATE.context.createGain();
  gain.gain.value = gainValue;
  noise.connect(gain);
  gain.connect(STATE.masterGain);
  noise.start();
}

export function toggleMute() {
  STATE.muted = !STATE.muted;
  if (STATE.masterGain) {
    STATE.masterGain.gain.value = STATE.muted ? 0 : 0.4;
  }
  return STATE.muted;
}

export function startMusic() {
  if (STATE.musicInterval) return;
  ensureContext();
  let step = 0;
  STATE.musicInterval = window.setInterval(() => {
    if (STATE.muted) return;
    const freq = SCALES[step % SCALES.length] * (step % 8 < 4 ? 1 : 2);
    playTone(freq, 0.18, "triangle", 0.12);
    step += 1;
  }, 220);
}

export function stopMusic() {
  if (STATE.musicInterval) {
    window.clearInterval(STATE.musicInterval);
    STATE.musicInterval = null;
  }
}

export function playShoot() {
  playTone(740, 0.08, "sawtooth", 0.08);
}

export function playHit() {
  if (STATE.muted) return;
  ensureContext();
  const now = STATE.context.currentTime;
  const boom = STATE.context.createOscillator();
  const boomGain = STATE.context.createGain();
  boom.type = "sine";
  boom.frequency.setValueAtTime(220, now);
  boom.frequency.exponentialRampToValueAtTime(80, now + 0.18);
  boomGain.gain.setValueAtTime(0.25, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  boom.connect(boomGain);
  boomGain.connect(STATE.masterGain);
  boom.start(now);
  boom.stop(now + 0.22);
  playNoise(0.15, 0.35);
  playTone(160, 0.12, "square", 0.14);
}

export function playPowerUp() {
  playTone(600, 0.2, "triangle", 0.2);
  playTone(900, 0.15, "triangle", 0.18);
}

export function playGameOver() {
  playTone(220, 0.4, "sine", 0.18);
  playTone(110, 0.5, "sine", 0.15);
}

export function playCountdownBeep(freq = 520, duration = 0.08, gainValue = 0.16) {
  playTone(freq, duration, "square", gainValue);
}

export function resumeAudio() {
  ensureContext();
}
