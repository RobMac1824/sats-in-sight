// Minimal DOM fixtures needed by game modules
document.body.innerHTML = `
  <div id="app">
    <canvas id="gameCanvas"></canvas>
    <div id="hud">
      <div class="hud-top-left">
        <div class="hud-brand">SATS IN SIGHT</div>
        <div class="hud-health">
          <span>HEALTH</span>
          <div class="health-bar"><div id="healthFill"></div></div>
          <span id="healthValue">100</span>
        </div>
      </div>
      <div class="hud-top-center" id="hud-wave">WAVE 1</div>
      <div class="hud-left">
        <div class="hud-line">RSSI <span id="hud-rssi">99</span></div>
        <div class="hud-line">LQ <span id="hud-lq">88</span></div>
        <div class="hud-line">VTX <span id="hud-vtx">WFM</span></div>
        <div class="hud-line">SAT <span id="hud-sat">7</span></div>
      </div>
      <div class="hud-center">
        <div class="hud-title">TACTICAL FPV HUD</div>
        <div id="hud-callout">SIGNAL CLEAN</div>
        <div id="level-callout" class="hidden">LEVEL 1</div>
      </div>
      <div class="hud-right">
        <div class="hud-line">ALT <span id="hud-alt">102</span>m</div>
        <div class="hud-line">SPD <span id="hud-spd">42</span>kts</div>
        <div class="hud-line">LINGO <span id="hud-lingo">DRN SYN OK</span></div>
      </div>
      <div class="hud-bottom">
        <div class="hud-score-block">
          <div class="score-label">SCORE</div>
          <div id="score">0</div>
          <div id="combo">COMBO x0</div>
        </div>
        <div>STACK <span id="hud-stack">0%</span></div>
      </div>
    </div>
    <div id="dangerGauge"><div id="dangerFill"></div></div>
    <div id="readyPanel" class="hidden">READY</div>
    <div id="diagnostics" class="hidden">
      <div>STATE: <span id="stateValue">BOOT</span></div>
      <div>DT: <span id="dtValue">0</span></div>
      <div>FPS: <span id="fps">0</span></div>
      <div>DPR: <span id="dprValue">1</span></div>
      <div>VIEW: <span id="viewValue">0x0</span></div>
      <div>CANVAS: <span id="canvasSizeValue">0x0</span></div>
      <div>INSET: <span id="insetValue">L0 R0 T0 B0</span></div>
      <div>TOUCH: <span id="touch">0,0</span></div>
    </div>
    <div id="warning" class="hidden"></div>
    <div id="startScreen" class="screen">
      <div class="screen-inner">
        <input id="username" type="text" maxlength="16" placeholder="LINGO" />
        <button id="startButton">Start Flight</button>
        <button id="muteButton" class="secondary">Mute</button>
      </div>
    </div>
    <div id="gameOverScreen" class="screen hidden">
      <div class="screen-inner">
        <p>Final Score: <span id="finalScore">0</span></p>
        <p>Final Wave: <span id="finalWave">1</span></p>
        <p>Final Combo: <span id="finalCombo">0</span></p>
        <ol id="leaderboardList"></ol>
        <div class="your-best">Your best: <span id="yourBest">0</span></div>
        <button id="restartButton">Restart</button>
      </div>
    </div>
    <div id="controls">
      <button id="diagnosticsToggle">Diagnostics</button>
    </div>
  </div>
`;

// Mock canvas getContext for jsdom (which doesn't support Canvas)
const canvas = document.getElementById("gameCanvas");
if (canvas) {
  canvas.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    drawImage: () => {},
    setTransform: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    measureText: () => ({ width: 0 }),
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    shadowColor: "",
    shadowBlur: 0,
  });
  canvas.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0,
  });
}

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return { matches: false, addListener: () => {}, removeListener: () => {} };
};

// Mock AudioContext
window.AudioContext = window.AudioContext || class {
  constructor() {
    this.state = "running";
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
  }
  createOscillator() {
    return {
      type: "sine", frequency: { value: 440, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {}, start: () => {}, stop: () => {},
    };
  }
  createGain() {
    return { gain: { value: 1, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} };
  }
  createBuffer() { return { getChannelData: () => new Float32Array(1024) }; }
  createBufferSource() { return { buffer: null, connect: () => {}, start: () => {} }; }
  resume() { return Promise.resolve(); }
};
