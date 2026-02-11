const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let currentLevel = LOG_LEVELS.WARN;
const logBuffer = [];
const MAX_BUFFER = 50;

export function setLogLevel(level) {
  currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.WARN;
}

export function log(level, message, data = null) {
  const numericLevel = LOG_LEVELS[level] ?? LOG_LEVELS.INFO;
  if (numericLevel < currentLevel) return;
  const entry = { timestamp: Date.now(), level, message, data };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER) logBuffer.shift();
  if (numericLevel >= LOG_LEVELS.WARN) {
    // eslint-disable-next-line no-console
    console.warn(`[SIS:${level}] ${message}`, data ?? "");
  }
}

export function getLogBuffer() {
  return [...logBuffer];
}
