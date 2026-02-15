import React, { useState, useEffect, useMemo } from "react";

// ─── Particle Burst ───
function ParticleBurst({ count, color, trigger }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (360 / count) * i + (Math.random() * 30 - 15);
      const dist = 80 + Math.random() * 60;
      const rad = (angle * Math.PI) / 180;
      return {
        id: i,
        px: Math.cos(rad) * dist,
        py: Math.sin(rad) * dist,
        size: 4 + Math.random() * 6,
        delay: Math.random() * 0.15,
      };
    });
  }, [count]);

  if (!trigger) return null;

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="fm-particle"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            "--fm-px": `${p.px}px`,
            "--fm-py": `${p.py}px`,
            animationDelay: `${p.delay}s`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

// ─── CSS Keyframes (injected once) ───
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');

@keyframes fm-stage1 {
  0% { opacity: 0; transform: scale(0.5); }
  15% { opacity: 1; transform: scale(1); }
  35% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.15) rotate(8deg); }
  100% { opacity: 0; transform: scale(1.15) rotate(8deg); }
}

@keyframes fm-stage2 {
  0% { opacity: 0; transform: scale(0.8) rotate(-5deg); }
  30% { opacity: 0; transform: scale(0.8) rotate(-5deg); }
  45% { opacity: 1; transform: scale(1) rotate(0deg); }
  65% { opacity: 1; transform: scale(1) rotate(0deg); }
  80% { opacity: 0; transform: scale(1.1) rotate(3deg); }
  100% { opacity: 0; transform: scale(1.1) rotate(3deg); }
}

@keyframes fm-stage3 {
  0% { opacity: 0; transform: scale(1.8) rotate(-180deg); }
  65% { opacity: 0; transform: scale(1.8) rotate(-180deg); }
  85% { opacity: 1; transform: scale(1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes fm-glow-ring {
  0% { opacity: 0; transform: scale(0.8); }
  65% { opacity: 0; transform: scale(0.8); }
  88% { opacity: 0; }
  95% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes fm-particle-fly {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--fm-px), var(--fm-py)) scale(0); opacity: 0; }
}

@keyframes fm-progress {
  0% { width: 0%; }
  100% { width: 100%; }
}

@keyframes fm-pulse-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes fm-bg-breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.fm-particle {
  animation: fm-particle-fly 0.7s ease-out forwards;
}
`;

// ─── Main Loader Component ───
export default function FlyingMonsterLoader({
  onComplete,
  duration = 5000,
  mannyWaveUrl = "/assets/manny-wave.png",
  mannyJetpackUrl = "/assets/manny-jetpack.png",
  badgeUrl = "/assets/fm-badge.png",
}) {
  const [purpleBurst, setPurpleBurst] = useState(false);
  const [orangeBurst, setOrangeBurst] = useState(false);

  // Timing ratios relative to total duration
  const stage1to2 = duration * 0.35; // purple burst at ~35%
  const stage2to3 = duration * 0.65; // orange burst at ~65%
  const badgeLand = duration * 0.85;  // badge lands at ~85%
  const completeFire = badgeLand + 500; // onComplete 500ms after badge

  useEffect(() => {
    const t1 = setTimeout(() => setPurpleBurst(true), stage1to2);
    const t2 = setTimeout(() => setOrangeBurst(true), stage2to3);
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, completeFire);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duration, onComplete, stage1to2, stage2to3, completeFire]);

  const totalAnimDuration = `${duration / 1000}s`;

  return (
    <div style={styles.overlay}>
      <style>{KEYFRAMES}</style>

      {/* Breathing background glow */}
      <div
        style={{
          ...styles.bgGlow,
          animation: `fm-bg-breathe ${duration / 2000}s ease-in-out infinite`,
        }}
      />

      {/* Stage container */}
      <div style={styles.stageContainer}>
        {/* Stage 1 — Manny Waving */}
        <img
          src={mannyWaveUrl}
          alt="Manny Waving"
          style={{
            ...styles.stageImage,
            animation: `fm-stage1 ${totalAnimDuration} ease-in-out forwards`,
          }}
        />

        {/* Stage 2 — Manny Jetpack */}
        <img
          src={mannyJetpackUrl}
          alt="Manny with Jetpack"
          style={{
            ...styles.stageImage,
            animation: `fm-stage2 ${totalAnimDuration} ease-in-out forwards`,
          }}
        />

        {/* Stage 3 — Badge */}
        <img
          src={badgeUrl}
          alt="Flying Monster Cinema Drones Badge"
          style={{
            ...styles.stageImage,
            animation: `fm-stage3 ${totalAnimDuration} ease-in-out forwards`,
          }}
        />

        {/* Glow ring behind badge */}
        <div
          style={{
            ...styles.glowRing,
            animation: `fm-glow-ring ${totalAnimDuration} ease-in-out forwards`,
          }}
        />

        {/* Purple particle burst (Stage 1→2) */}
        <ParticleBurst count={8} color="#a855f7" trigger={purpleBurst} />

        {/* Orange particle burst (Stage 2→3) */}
        <ParticleBurst count={10} color="#f97316" trigger={orangeBurst} />
      </div>

      {/* Loading bar + text */}
      <div style={styles.loadingSection}>
        <div
          style={{
            ...styles.loadingText,
            animation: `fm-pulse-text 1.5s ease-in-out infinite`,
          }}
        >
          Loading
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              animation: `fm-progress ${totalAnimDuration} ease-out forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Inline Styles ───
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "#0a0a0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 50%, transparent 70%)",
    pointerEvents: "none",
  },
  stageContainer: {
    position: "relative",
    width: 240,
    height: 240,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stageImage: {
    position: "absolute",
    width: 200,
    height: 200,
    objectFit: "contain",
    opacity: 0,
  },
  glowRing: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: "50%",
    border: "2px solid rgba(168,85,247,0.4)",
    boxShadow:
      "0 0 30px rgba(168,85,247,0.2), inset 0 0 30px rgba(168,85,247,0.1)",
    opacity: 0,
    pointerEvents: "none",
  },
  loadingSection: {
    position: "absolute",
    bottom: 80,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    width: 260,
  },
  loadingText: {
    fontFamily: "'Bangers', cursive",
    fontSize: 22,
    color: "#a855f7",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
    background: "linear-gradient(90deg, #a855f7, #f97316)",
    width: "0%",
  },
};
