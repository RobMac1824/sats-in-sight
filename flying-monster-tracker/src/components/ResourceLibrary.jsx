import React, { useState, useMemo, useRef } from "react";

// Shared organizational pattern for all resource libraries:
// - Category filter sidebar
// - Search bar
// - Card grid with expandable detail
// - Add / Edit / Delete actions
// - Consistent visual style

const s = {
  wrap: {
    display: "flex",
    gap: 20,
    minHeight: "100%",
  },
  sidebar: {
    minWidth: 180,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  sidebarTitle: {
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  catBtn: (active) => ({
    background: active ? "#1e293b" : "transparent",
    border: active ? "1px solid #334155" : "1px solid transparent",
    color: active ? "#e2e8f0" : "#94a3b8",
    padding: "7px 12px",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  }),
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  toolbar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    background: "#0f1117",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "9px 14px",
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  },
  addBtn: {
    background: "#6366f1",
    border: "none",
    borderRadius: 8,
    padding: "9px 18px",
    color: "#fff",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  countBadge: {
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340, 1fr))",
    gap: 12,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  card: (expanded) => ({
    background: "#0f1117",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "14px 18px",
    cursor: "pointer",
    transition: "all 0.15s",
    borderLeft: expanded ? "3px solid #6366f1" : "3px solid transparent",
  }),
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  cardCategory: {
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#6366f1",
    background: "#1e1b4b",
    padding: "2px 8px",
    borderRadius: 4,
    whiteSpace: "nowrap",
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 4,
  },
  cardDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #1e293b",
  },
  detailRow: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  detailLabel: {
    color: "#64748b",
    minWidth: 120,
    flexShrink: 0,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
  },
  detailValue: {
    color: "#cbd5e1",
    flex: 1,
    wordBreak: "break-word",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: (color) => ({
    background: "transparent",
    border: `1px solid ${color}`,
    borderRadius: 6,
    padding: "5px 12px",
    color: color,
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  }),
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#475569",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  statusDot: (color) => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    marginRight: 6,
  }),
};

const EMPTY_QUIPS = [
  "Manny searched the skies… nothing here yet.",
  "Even drones need something to look at!",
  "The airspace is clear — too clear.",
  "No matches. Manny's on it.",
  "Nothing found. Deploying search drone…",
  "Manny flew around the block. Came back empty.",
  "Zero results. Manny is unimpressed.",
];

export default function ResourceLibrary({
  title,
  items,
  categories,
  categoryField = "category",
  titleField = "title",
  subtitleField = null,
  searchFields = [],
  renderDetail,
  renderCardMeta,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Add New",
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const emptyQuipRef = useRef(EMPTY_QUIPS[Math.floor(Math.random() * EMPTY_QUIPS.length)]);

  const filtered = useMemo(() => {
    let result = items;
    if (activeCategory !== "All") {
      result = result.filter((item) => item[categoryField] === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const fields = [titleField, subtitleField, "notes", ...searchFields].filter(Boolean);
        return fields.some((f) => {
          const val = item[f];
          if (typeof val === "string") return val.toLowerCase().includes(q);
          if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(q));
          return false;
        });
      });
    }
    return result;
  }, [items, activeCategory, search, categoryField, titleField, subtitleField, searchFields]);

  const categoryCounts = useMemo(() => {
    const counts = { All: items.length };
    categories.forEach((c) => {
      counts[c] = items.filter((item) => item[categoryField] === c).length;
    });
    return counts;
  }, [items, categories, categoryField]);

  return (
    <div style={s.wrap}>
      {/* Category Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTitle}>{title}</div>
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            style={s.catBtn(activeCategory === cat)}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            {categoryCounts[cat] > 0 && (
              <span style={{ float: "right", opacity: 0.5, fontSize: 11 }}>
                {categoryCounts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={s.main}>
        <div style={s.toolbar}>
          <input
            style={s.searchInput}
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={s.countBadge}>
            {filtered.length} of {items.length}
          </span>
          {onAdd && (
            <button style={s.addBtn} onClick={onAdd}>
              + {addLabel}
            </button>
          )}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={s.emptyState}>
            <img
              src="/assets/manny-jetpack.png"
              alt=""
              style={{
                width: 80,
                height: 80,
                objectFit: "contain",
                opacity: 0.5,
                filter: "grayscale(0.3)",
              }}
            />
            <div>{emptyQuipRef.current}</div>
            <div style={{ fontSize: 12, color: "#334155" }}>
              No {title.toLowerCase()} found
              {search && " matching your search"}
              {activeCategory !== "All" && ` in ${activeCategory}`}.
            </div>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  style={s.card(isExpanded)}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div style={s.cardHeader}>
                    <div style={{ flex: 1 }}>
                      <p style={s.cardTitle}>
                        {item[titleField]}
                        {!item[titleField] && (
                          <span style={{ color: "#475569", fontStyle: "italic" }}>
                            Untitled
                          </span>
                        )}
                      </p>
                      {subtitleField && item[subtitleField] && (
                        <div style={s.cardMeta}>{item[subtitleField]}</div>
                      )}
                      {renderCardMeta && renderCardMeta(item)}
                    </div>
                    <span style={s.cardCategory}>{item[categoryField]}</span>
                  </div>

                  {isExpanded && (
                    <div style={s.cardDetail}>
                      {renderDetail && renderDetail(item)}
                      {item.notes && (
                        <div style={s.detailRow}>
                          <span style={s.detailLabel}>Notes</span>
                          <span style={s.detailValue}>{item.notes}</span>
                        </div>
                      )}
                      <div style={s.actions}>
                        {onEdit && (
                          <button
                            style={s.actionBtn("#6366f1")}
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            style={s.actionBtn("#ef4444")}
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable detail row component
export function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  const display = Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{display}</span>
    </div>
  );
}
