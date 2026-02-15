import React, { useState, useMemo, useRef } from "react";
import { createCoiTemplate } from "../data/coi";

const COI_EMPTY_QUIPS = [
  "No COI templates yet. Manny's paperwork-free!",
  "The insurance shelf is bare — Manny's uninsured!",
  "Zero templates. Manny needs some coverage.",
  "Nothing here. Even drones need insurance.",
];

// Inline detail row — no external dependency
function CoiDetailRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  const display = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
      ? JSON.stringify(value, null, 2)
      : String(value);
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ color: "#64748b", minWidth: 120, flexShrink: 0, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
      <span style={{ color: "#cbd5e1", flex: 1, wordBreak: "break-word" }}>
        {display}
      </span>
    </div>
  );
}

// Get a display name from an item regardless of field naming
function getDisplayName(item) {
  return item.studio || item.name || item.title || "Untitled";
}

// Get initials from a display name
function getInitials(name) {
  return name
    .split(/[\s/]+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function CoiLibrary({ items, onUpdate }) {
  const [expandedId, setExpandedId] = useState(null);
  const emptyQuipRef = useRef(COI_EMPTY_QUIPS[Math.floor(Math.random() * COI_EMPTY_QUIPS.length)]);

  // Dynamically group items by their category field, sorted alphabetically
  const grouped = useMemo(() => {
    const catMap = {};
    items.forEach((item) => {
      const cat = item.category || "Uncategorized";
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(item);
    });

    return Object.keys(catMap)
      .sort((a, b) => a.localeCompare(b))
      .map((cat) => ({
        category: cat,
        items: catMap[cat].sort((a, b) =>
          getDisplayName(a).localeCompare(getDisplayName(b))
        ),
      }));
  }, [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#888", textTransform: "uppercase", letterSpacing: 1.5 }}>
          COI Library
        </div>
        <button
          style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}
          onClick={() => onUpdate([...items, createCoiTemplate()])}
        >
          + Add COI Template
        </button>
      </div>

      {/* Grouped sections */}
      {grouped.map(({ category, items: catItems }) => (
        <div key={category}>
          {/* Category header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#e2e8f0" }}>
              {category}
            </span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#6366f1", background: "#1e1b4b", padding: "2px 8px", borderRadius: 4 }}>
              {catItems.length}
            </span>
          </div>

          {/* Two-column parallel grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {catItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const displayName = getDisplayName(item);
              const initials = getInitials(displayName);
              const subtitle = item.holderName || item.holderAddress || "";

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#0f1117",
                    border: isExpanded ? "1px solid #6366f1" : "1px solid #1e293b",
                    borderRadius: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    gridColumn: isExpanded ? "1 / -1" : undefined,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: "#1e1b4b",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#818cf8", fontFamily: "'JetBrains Mono', monospace",
                      flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayName}
                      </div>
                      {subtitle && (
                        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e293b" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                        <CoiDetailRow label="Holder" value={item.holderName} />
                        <CoiDetailRow label="Address" value={item.holderAddress} />
                        <CoiDetailRow label="Addtl Insured" value={item.additionalInsured} />
                        <CoiDetailRow label="Endorsements" value={item.specialEndorsements} />
                        {item.minimumLimits &&
                          Object.entries(item.minimumLimits).map(([key, val]) => (
                            <CoiDetailRow
                              key={key}
                              label={key.replace(/([A-Z])/g, " $1").trim()}
                              value={val}
                            />
                          ))}
                        <CoiDetailRow label="Last Used" value={item.lastUsed} />
                      </div>
                      {item.notes && (
                        <div style={{ marginTop: 8 }}>
                          <CoiDetailRow label="Notes" value={item.notes} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                          style={{ background: "transparent", border: "1px solid #6366f1", borderRadius: 6, padding: "5px 12px", color: "#6366f1", fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const name = prompt("Studio name:", displayName);
                            if (name !== null) {
                              onUpdate(items.map((i) => (i.id === item.id ? { ...i, studio: name } : i)));
                            }
                          }}
                        >
                          Edit
                        </button>
                        <button
                          style={{ background: "transparent", border: "1px solid #ef4444", borderRadius: 6, padding: "5px 12px", color: "#ef4444", fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Remove this COI template?")) {
                              onUpdate(items.filter((i) => i.id !== item.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {grouped.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#475569",
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}>
          <img
            src="/assets/manny-jetpack.png"
            alt=""
            style={{
              width: 80,
              height: 80,
              objectFit: "contain",
              opacity: 0.5,
              filter: "drop-shadow(0 0 8px rgba(139,92,246,0.15)) grayscale(0.3)",
            }}
          />
          <div style={{ fontSize: 14, color: "#94a3b8" }}>
            {emptyQuipRef.current}
          </div>
          <div style={{ fontSize: 12, color: "#334155" }}>
            Click "+ Add COI Template" to get started.
          </div>
        </div>
      )}
    </div>
  );
}
