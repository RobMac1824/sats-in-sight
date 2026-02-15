import React, { useState, useEffect, useCallback, useRef } from "react";

// Data imports
import { DEFAULT_CREW } from "./data/crew";
import { DEFAULT_COMPANY_DOCS } from "./data/companyDocs";
import { DEFAULT_GEAR } from "./data/gear";
import { DEFAULT_COI_TEMPLATES } from "./data/coi";
import { DEFAULT_PERMIT_DOCS } from "./data/permits";
import { DEFAULT_CLIENTS } from "./data/clients";
import { DEFAULT_QUESTIONNAIRES } from "./data/questionnaires";

// Component imports
import FlightBoard from "./components/FlightBoard";
import CrewDirectory from "./components/CrewDirectory";
import CompanyDocs from "./components/CompanyDocs";
import GearLibrary from "./components/GearLibrary";
import CoiLibrary from "./components/CoiLibrary";
import PermitsLibrary from "./components/PermitsLibrary";
import ClientContacts from "./components/ClientContacts";
import Questionnaires from "./components/Questionnaires";
import FlyingMonsterLoader from "./components/FlyingMonsterLoader";

// ─── Admin Users ───
const ADMIN_USERS = [
  { id: "john", name: "John Graham" },
  { id: "dexter", name: "Dexter" },
  { id: "matty", name: "Matty" },
];

// ─── localStorage helpers ───
const STORAGE_KEY = "fm_tracker_v12";

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveState(key, value) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch {}
}

// ─── Navigation ───
const NAV_ITEMS = [
  { id: "board", label: "Flight Board", icon: "\u25A3" },
  { id: "crew", label: "Crew", icon: "\u25C9" },
  { id: "gear", label: "Gear", icon: "\u2B21" },
  { id: "coi", label: "COI Library", icon: "\u25C8" },
  { id: "permits", label: "Permits", icon: "\u25C6" },
  { id: "clients", label: "Clients", icon: "\u25C7" },
  { id: "questionnaires", label: "Questionnaires", icon: "\u25A4" },
  { id: "docs", label: "Company Docs", icon: "\u25A5" },
];

// ─── Styles ───
const s = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#08090c",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e2e8f0",
  },
  nav: {
    width: 220,
    minHeight: "100vh",
    background: "#0a0c10",
    borderRight: "1px solid #1a1d27",
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    overflowY: "auto",
  },
  logo: {
    padding: "0 20px 20px",
    borderBottom: "1px solid #1a1d27",
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e2e8f0",
    letterSpacing: -0.3,
    lineHeight: 1.3,
  },
  logoSub: {
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 20px",
    background: active ? "#131620" : "transparent",
    color: active ? "#e2e8f0" : "#64748b",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    border: "none",
    borderLeft: active ? "2px solid #6366f1" : "2px solid transparent",
    width: "100%",
    textAlign: "left",
    transition: "all 0.12s",
  }),
  navIcon: {
    fontSize: 14,
    width: 20,
    textAlign: "center",
    opacity: 0.6,
  },
  content: {
    flex: 1,
    marginLeft: 220,
    padding: "28px 32px",
    minHeight: "100vh",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  version: {
    marginTop: "auto",
    padding: "16px 20px",
    borderTop: "1px solid #1a1d27",
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#334155",
  },
};

// ─── Fun Extras: CSS Keyframes ───
const APP_KEYFRAMES = `
@keyframes fm-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes fm-spin-once {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes fm-barrel-roll {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.1); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes fm-flyby {
  0% { left: -120px; top: 40%; opacity: 0; transform: rotate(-15deg) scale(0.8); }
  10% { opacity: 1; }
  50% { top: 30%; transform: rotate(5deg) scale(1); }
  90% { opacity: 1; }
  100% { left: calc(100% + 120px); top: 45%; opacity: 0; transform: rotate(-10deg) scale(0.7); }
}
@keyframes fm-login-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.15), 0 0 60px rgba(139,92,246,0.05); }
  50% { box-shadow: 0 0 30px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1); }
}
`;

// ─── Random flyby quips ───
const FLYBY_QUIPS = [
  "Whoooosh!",
  "Clear for takeoff!",
  "Drone inbound!",
  "Flight check!",
  "Manny on the move!",
  "Cameras rolling!",
  "Airspace clear!",
];

// ─── Login Styles ───
const loginStyles = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "#0a0a0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#e2e8f0",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 40,
  },
  prompt: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 20,
  },
  userList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: 260,
  },
  userButton: {
    padding: "14px 20px",
    background: "#131620",
    border: "1px solid #1e2231",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  },
};

// ─── App ───
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("board");

  // Fun extras state
  const [badgeSpinning, setBadgeSpinning] = useState(false);
  const [flyby, setFlyby] = useState(false);
  const [flybyQuip, setFlybyQuip] = useState("");
  const badgeClickCount = useRef(0);
  const badgeClickTimer = useRef(null);
  const [barrelRoll, setBarrelRoll] = useState(false);

  // All state with localStorage persistence
  const [jobs, setJobs] = useState(() => loadState("jobs", []));
  const [crew, setCrew] = useState(() => loadState("crew", DEFAULT_CREW));
  const [companyDocs, setCompanyDocs] = useState(() => loadState("companyDocs", DEFAULT_COMPANY_DOCS));
  const [gear, setGear] = useState(() => loadState("gear", DEFAULT_GEAR));
  const [coiTemplates, setCoiTemplates] = useState(() => loadState("coi", DEFAULT_COI_TEMPLATES));
  const [permitDocs, setPermitDocs] = useState(() => loadState("permits", DEFAULT_PERMIT_DOCS));
  const [clients, setClients] = useState(() => loadState("clients", DEFAULT_CLIENTS));
  const [questionnaires, setQuestionnaires] = useState(() => loadState("questionnaires", DEFAULT_QUESTIONNAIRES));

  // Persist all state changes
  useEffect(() => { saveState("jobs", jobs); }, [jobs]);
  useEffect(() => { saveState("crew", crew); }, [crew]);
  useEffect(() => { saveState("companyDocs", companyDocs); }, [companyDocs]);
  useEffect(() => { saveState("gear", gear); }, [gear]);
  useEffect(() => { saveState("coi", coiTemplates); }, [coiTemplates]);
  useEffect(() => { saveState("permits", permitDocs); }, [permitDocs]);
  useEffect(() => { saveState("clients", clients); }, [clients]);
  useEffect(() => { saveState("questionnaires", questionnaires); }, [questionnaires]);

  // Load Google Fonts
  useEffect(() => {
    if (!document.querySelector('link[href*="DM+Sans"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // ─── Sidebar badge easter egg ───
  const handleBadgeClick = useCallback(() => {
    // Quick spin on every click
    setBadgeSpinning(true);
    setTimeout(() => setBadgeSpinning(false), 600);

    // Track rapid clicks for barrel roll
    badgeClickCount.current += 1;
    clearTimeout(badgeClickTimer.current);
    badgeClickTimer.current = setTimeout(() => { badgeClickCount.current = 0; }, 1500);

    if (badgeClickCount.current >= 5) {
      badgeClickCount.current = 0;
      setBarrelRoll(true);
      setTimeout(() => setBarrelRoll(false), 1000);
    }
  }, []);

  // ─── Random Manny flyby on page switch ───
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    // ~30% chance of a Manny flyby on page switch
    if (Math.random() < 0.3) {
      setFlybyQuip(FLYBY_QUIPS[Math.floor(Math.random() * FLYBY_QUIPS.length)]);
      setFlyby(true);
      setTimeout(() => setFlyby(false), 1800);
    }
  }, []);

  const pageInfo = {
    board: { title: "Flight Board", subtitle: "Job Pipeline & Status Tracker" },
    crew: { title: "Crew Directory", subtitle: "Personnel, Certs & Availability" },
    gear: { title: "Gear Management", subtitle: "Fleet, Equipment & Maintenance" },
    coi: { title: "COI Language Library", subtitle: "Certificate of Insurance Templates by Studio" },
    permits: { title: "Permits & Documents", subtitle: "NYC Permits, FAA Auth & General Docs" },
    clients: { title: "Client Contacts", subtitle: "Production Companies, Studios & Contacts" },
    questionnaires: { title: "Studio Questionnaires", subtitle: "Vendor Qualification Forms with Auto-Fill" },
    docs: { title: "Company Documents", subtitle: "Licensing, Insurance & Corporate Records" },
  };

  const current = pageInfo[page];

  // ─── Login Screen ───
  if (!currentUser) {
    return (
      <div style={loginStyles.container}>
        <style>{APP_KEYFRAMES}</style>
        <img
          src="/assets/fm-badge.png"
          alt="Flying Monster"
          style={{
            width: 120,
            height: 120,
            objectFit: "contain",
            marginBottom: 24,
            animation: "fm-float 3s ease-in-out infinite, fm-login-glow 4s ease-in-out infinite",
            borderRadius: "50%",
          }}
        />
        <div style={loginStyles.title}>Flying Monster</div>
        <div style={loginStyles.subtitle}>Job Flight Tracker v1.2</div>
        <div style={loginStyles.prompt}>Select your profile to continue</div>
        <div style={loginStyles.userList}>
          {ADMIN_USERS.map((user) => (
            <button
              key={user.id}
              style={loginStyles.userButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.background = "#191d2b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e2231";
                e.currentTarget.style.background = "#131620";
              }}
              onClick={() => {
                setCurrentUser(user);
                setLoading(true);
              }}
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Loading Animation ───
  if (loading) {
    return (
      <FlyingMonsterLoader
        mannyWaveUrl="/assets/manny-wave.png"
        mannyJetpackUrl="/assets/manny-jetpack.png"
        badgeUrl="/assets/fm-badge.png"
        onComplete={() => setLoading(false)}
      />
    );
  }

  return (
    <div style={s.app}>
      <style>{APP_KEYFRAMES}</style>

      {/* Manny Flyby — random on page switch */}
      {flyby && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            animation: "fm-flyby 1.8s ease-in-out forwards",
          }}>
            <img
              src="/assets/manny-jetpack.png"
              alt=""
              style={{ width: 90, height: 90, objectFit: "contain" }}
            />
            <div style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#f97316",
              whiteSpace: "nowrap",
              textShadow: "0 0 8px rgba(249,115,22,0.5)",
            }}>
              {flybyQuip}
            </div>
          </div>
        </div>
      )}

      {/* Barrel Roll overlay */}
      {barrelRoll && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9997, pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img
            src="/assets/manny-jetpack.png"
            alt=""
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              animation: "fm-barrel-roll 1s ease-in-out forwards",
              filter: "drop-shadow(0 0 20px rgba(139,92,246,0.4))",
            }}
          />
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }} onClick={handleBadgeClick}>
            <img
              src="/assets/fm-badge.png"
              alt="Flying Monster"
              style={{
                width: 36,
                height: 36,
                objectFit: "contain",
                borderRadius: "50%",
                animation: badgeSpinning ? "fm-spin-once 0.6s ease-out" : "none",
                transition: "transform 0.15s",
              }}
            />
            <div>
              <div style={s.logoTitle}>Flying Monster</div>
              <div style={s.logoSub}>Job Flight Tracker v1.2</div>
            </div>
          </div>
        </div>

        {/* User greeting with Manny */}
        <div style={{
          padding: "10px 16px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <img
            src="/assets/manny-wave.png"
            alt=""
            style={{
              width: 28,
              height: 28,
              objectFit: "contain",
              animation: "fm-float 2.5s ease-in-out infinite",
            }}
          />
          <div style={{
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            color: "#94a3b8",
            lineHeight: 1.3,
          }}>
            Hey, <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
              {currentUser.name.split(" ")[0]}
            </span>!
          </div>
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            style={s.navItem(page === item.id)}
            onClick={() => handlePageChange(item.id)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={s.version}>
          v1.2 — Flying Monster LLC
          <br />
          localStorage · No backend
        </div>
      </nav>

      {/* Main Content */}
      <main style={s.content}>
        <div style={s.pageTitle}>{current.title}</div>
        <div style={s.pageSubtitle}>{current.subtitle}</div>

        {page === "board" && (
          <FlightBoard jobs={jobs} onUpdateJobs={setJobs} />
        )}
        {page === "crew" && (
          <CrewDirectory items={crew} onUpdate={setCrew} />
        )}
        {page === "gear" && (
          <GearLibrary items={gear} onUpdate={setGear} />
        )}
        {page === "coi" && (
          <CoiLibrary items={coiTemplates} onUpdate={setCoiTemplates} />
        )}
        {page === "permits" && (
          <PermitsLibrary items={permitDocs} onUpdate={setPermitDocs} />
        )}
        {page === "clients" && (
          <ClientContacts items={clients} onUpdate={setClients} />
        )}
        {page === "questionnaires" && (
          <Questionnaires items={questionnaires} onUpdate={setQuestionnaires} />
        )}
        {page === "docs" && (
          <CompanyDocs items={companyDocs} onUpdate={setCompanyDocs} />
        )}
      </main>
    </div>
  );
}
