import React from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { DOC_CATEGORIES, createCompanyDoc } from "../data/companyDocs";

const statusColors = {
  Active: "#10b981",
  Current: "#06b6d4",
  Expired: "#ef4444",
  Draft: "#f59e0b",
};

export default function CompanyDocs({ items, onUpdate }) {
  return (
    <ResourceLibrary
      title="Company Documents"
      items={items}
      categories={DOC_CATEGORIES}
      categoryField="category"
      titleField="title"
      subtitleField="type"
      searchFields={["linkedTo", "status"]}
      addLabel="Add Document"
      onAdd={() => onUpdate([...items, createCompanyDoc()])}
      onEdit={(item) => {
        const title = prompt("Document title:", item.title);
        if (title !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, title } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this document?")) {
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
            {item.status}
          </span>
          {item.linkedTo && (
            <span style={{ color: "#64748b", marginLeft: 8 }}>
              → {item.linkedTo}
            </span>
          )}
        </div>
      )}
      renderDetail={(item) => (
        <>
          <DetailRow label="Type" value={item.type} />
          <DetailRow label="Status" value={item.status} />
          <DetailRow label="Issue Date" value={item.issueDate} />
          <DetailRow label="Expiration" value={item.expirationDate} />
          <DetailRow label="Linked To" value={item.linkedTo} />
        </>
      )}
    />
  );
}
