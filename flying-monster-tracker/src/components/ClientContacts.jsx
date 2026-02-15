import React, { useState, useMemo } from "react";
import { DetailRow } from "./ResourceLibrary";
import { CLIENT_CATEGORIES, createClient } from "../data/clients";

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
  countBadge: {
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#64748b",
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
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    alignItems: "start",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  card: (expanded) => ({
    background: "#0f1117",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "all 0.15s",
    borderLeft: expanded ? "3px solid #6366f1" : "3px solid transparent",
  }),
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  cardCategory: {
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#6366f1",
    background: "#1e1b4b",
    padding: "1px 6px",
    borderRadius: 3,
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 3,
  },
  cardDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #1e293b",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: (color) => ({
    background: "transparent",
    border: `1px solid ${color}`,
    borderRadius: 6,
    padding: "4px 10px",
    color: color,
    fontSize: 11,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  }),
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#475569",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    gridColumn: "1 / -1",
  },
  letterHeader: {
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 2,
    padding: "6px 0 2px",
    borderBottom: "1px solid #1a1d27",
    marginBottom: 2,
  },
};

export default function ClientContacts({ items, onUpdate }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let result = [...items];
    if (activeCategory !== "All") {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const haystack = [
          c.company,
          c.category,
          c.address,
          c.billingAddress,
          c.paymentTerms,
          c.slackChannel,
          c.notes,
          ...(c.contacts || []).flatMap((ct) => [ct.name, ct.title, ct.email, ct.phone]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    // Sort alphabetically by company name
    result.sort((a, b) => {
      const nameA = (a.company || "").toLowerCase();
      const nameB = (b.company || "").toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    return result;
  }, [items, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts = { All: items.length };
    CLIENT_CATEGORIES.forEach((c) => {
      counts[c] = items.filter((item) => item.category === c).length;
    });
    return counts;
  }, [items]);

  // Distribute items across 3 columns evenly (preserving alphabetical order top-to-bottom)
  const columns = useMemo(() => {
    const cols = [[], [], []];
    filtered.forEach((item, i) => {
      cols[i % 3].push(item);
    });
    return cols;
  }, [filtered]);

  const handleEdit = (item) => {
    const company = prompt("Company name:", item.company);
    if (company !== null) {
      onUpdate(items.map((i) => (i.id === item.id ? { ...i, company } : i)));
    }
  };

  const handleDelete = (id) => {
    if (confirm("Remove this client?")) {
      onUpdate(items.filter((i) => i.id !== id));
    }
  };

  const renderCard = (item) => {
    const isExpanded = expandedId === item.id;
    return (
      <div
        key={item.id}
        style={s.card(isExpanded)}
        onClick={() => setExpandedId(isExpanded ? null : item.id)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={s.cardTitle}>
              {item.company || <span style={{ color: "#475569", fontStyle: "italic" }}>Untitled</span>}
            </p>
            <div style={s.cardMeta}>
              {item.contacts && item.contacts.length > 0 && item.contacts[0].name && (
                <span>{item.contacts[0].name}</span>
              )}
              {item.contacts && item.contacts.length > 1 && (
                <span style={{ marginLeft: 4 }}>+{item.contacts.length - 1}</span>
              )}
              {item.paymentTerms && (
                <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {item.paymentTerms}
                </span>
              )}
            </div>
          </div>
          <span style={s.cardCategory}>{item.category}</span>
        </div>

        {isExpanded && (
          <div style={s.cardDetail}>
            <DetailRow label="Address" value={item.address} />
            <DetailRow label="Billing" value={item.billingAddress} />
            <DetailRow label="Payment" value={item.paymentTerms} />
            <DetailRow label="Payroll" value={item.preferredPayroll} />
            <DetailRow label="Slack" value={item.slackChannel} />
            <DetailRow label="COI Template" value={item.coiTemplate} />
            {item.contacts && item.contacts.length > 0 && (
              <>
                <div style={{
                  fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase", letterSpacing: 1, marginTop: 10, marginBottom: 6,
                }}>
                  Contacts
                </div>
                {item.contacts.map((c, i) => (
                  <div key={i} style={{
                    background: "#080a0e", border: "1px solid #1e293b",
                    borderRadius: 6, padding: "8px 12px", marginBottom: 6,
                  }}>
                    <DetailRow label="Name" value={c.name} />
                    <DetailRow label="Title" value={c.title} />
                    <DetailRow label="Role" value={c.role} />
                    <DetailRow label="Phone" value={c.phone} />
                    <DetailRow label="Email" value={c.email} />
                  </div>
                ))}
              </>
            )}
            {item.notes && <DetailRow label="Notes" value={item.notes} />}
            <div style={s.actions}>
              <button style={s.actionBtn("#6366f1")} onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                Edit
              </button>
              <button style={s.actionBtn("#ef4444")} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={s.wrap}>
      {/* Category Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTitle}>Client Contacts</div>
        {["All", ...CLIENT_CATEGORIES].map((cat) => (
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
            placeholder="Search client contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={s.countBadge}>
            {filtered.length} of {items.length}
          </span>
          <button style={s.addBtn} onClick={() => onUpdate([...items, createClient()])}>
            + Add Client
          </button>
        </div>

        {/* 3-Column Grid */}
        {filtered.length === 0 ? (
          <div style={s.emptyState}>
            No clients found{search && " matching your search"}{activeCategory !== "All" && ` in ${activeCategory}`}.
          </div>
        ) : (
          <div style={s.columns}>
            {columns.map((col, ci) => (
              <div key={ci} style={s.column}>
                {col.map((item) => renderCard(item))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
