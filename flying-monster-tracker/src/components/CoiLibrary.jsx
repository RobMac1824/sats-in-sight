import React, { useState, useMemo } from "react";
import { DetailRow } from "./ResourceLibrary";
import { COI_CATEGORIES, createCoiTemplate } from "../data/coi";

export default function CoiLibrary({ items, onUpdate }) {
  const [expandedId, setExpandedId] = useState(null);

  const grouped = useMemo(() => {
    const sortedCategories = [...COI_CATEGORIES].sort();
    return sortedCategories
      .map((cat) => ({
        category: cat,
        items: items
          .filter((i) => i.category === cat)
          .sort((a, b) => a.studio.localeCompare(b.studio)),
      }))
      .filter((g) => g.items.length > 0);
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

          {/* Two-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {catItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const initials = item.studio
                .split(/[\s/]+/)
                .filter((w) => w.length > 1)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join("");

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
                        {item.studio || <span style={{ color: "#475569", fontStyle: "italic" }}>Untitled</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.holderName}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e293b" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                        <DetailRow label="Holder" value={item.holderName} />
                        <DetailRow label="Address" value={item.holderAddress} />
                        <DetailRow label="Addtl Insured" value={item.additionalInsured} />
                        <DetailRow label="Endorsements" value={item.specialEndorsements} />
                        {item.minimumLimits &&
                          Object.entries(item.minimumLimits).map(([key, val]) => (
                            <DetailRow
                              key={key}
                              label={key.replace(/([A-Z])/g, " $1").trim()}
                              value={val}
                            />
                          ))}
                        <DetailRow label="Last Used" value={item.lastUsed} />
                      </div>
                      {item.notes && (
                        <div style={{ marginTop: 8 }}>
                          <DetailRow label="Notes" value={item.notes} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                          style={{ background: "transparent", border: "1px solid #6366f1", borderRadius: 6, padding: "5px 12px", color: "#6366f1", fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const studio = prompt("Studio name:", item.studio);
                            if (studio !== null) {
                              onUpdate(items.map((i) => (i.id === item.id ? { ...i, studio } : i)));
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
    </div>
  );
}
