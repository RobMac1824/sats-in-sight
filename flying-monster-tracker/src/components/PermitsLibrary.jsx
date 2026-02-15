import React from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { PERMIT_CATEGORIES, createPermitDoc } from "../data/permits";

const statusColors = {
  Template: "#6366f1",
  "Not Started": "#64748b",
  "In Progress": "#f59e0b",
  Submitted: "#06b6d4",
  Approved: "#10b981",
  Denied: "#ef4444",
  Expired: "#ef4444",
};

export default function PermitsLibrary({ items, onUpdate }) {
  return (
    <ResourceLibrary
      title="Permits & Documents"
      items={items}
      categories={PERMIT_CATEGORIES}
      categoryField="category"
      titleField="title"
      subtitleField="type"
      searchFields={["requirements", "submittedTo", "contactInfo"]}
      addLabel="Add Permit Doc"
      onAdd={() => onUpdate([...items, createPermitDoc()])}
      onEdit={(item) => {
        const title = prompt("Document title:", item.title);
        if (title !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, title } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this permit document?")) {
          onUpdate(items.filter((i) => i.id !== id));
        }
      }}
      renderCardMeta={(item) => (
        <div style={{ fontSize: 12, marginTop: 4 }}>
          <span
            style={{
              color: statusColors[item.status] || "#64748b",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
            }}
          >
            ● {item.status}
          </span>
          {item.leadTime && (
            <span style={{ color: "#64748b", marginLeft: 8 }}>
              Lead: {item.leadTime}
            </span>
          )}
        </div>
      )}
      renderDetail={(item) => (
        <>
          <DetailRow label="Type" value={item.type} />
          <DetailRow label="Status" value={item.status} />
          <DetailRow label="Lead Time" value={item.leadTime} />
          <DetailRow label="Submit To" value={item.submittedTo} />
          <DetailRow label="Contact" value={item.contactInfo} />
          <DetailRow label="Expiration" value={item.expirationDate} />
          {item.requirements && item.requirements.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "#888",
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                Requirements
              </div>
              <div style={{ paddingLeft: 4 }}>
                {item.requirements.map((req, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 13,
                      color: "#cbd5e1",
                      fontFamily: "'DM Sans', sans-serif",
                      padding: "3px 0",
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#475569" }}>▸</span>
                    {req}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    />
  );
}
