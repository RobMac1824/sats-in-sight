import React from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { COI_CATEGORIES, createCoiTemplate } from "../data/coi";

export default function CoiLibrary({ items, onUpdate }) {
  return (
    <ResourceLibrary
      title="COI Library"
      items={items}
      categories={COI_CATEGORIES}
      categoryField="category"
      titleField="studio"
      searchFields={["additionalInsured", "holderName", "holderAddress", "specialEndorsements"]}
      addLabel="Add COI Template"
      onAdd={() => onUpdate([...items, createCoiTemplate()])}
      onEdit={(item) => {
        const studio = prompt("Studio name:", item.studio);
        if (studio !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, studio } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this COI template?")) {
          onUpdate(items.filter((i) => i.id !== id));
        }
      }}
      renderCardMeta={(item) => (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {item.holderAddress && <span>{item.holderAddress}</span>}
        </div>
      )}
      renderDetail={(item) => (
        <>
          <DetailRow label="Holder" value={item.holderName} />
          <DetailRow label="Address" value={item.holderAddress} />
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
            Additional Insured Language
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              background: "#080a0e",
              border: "1px solid #1e293b",
              borderRadius: 6,
              padding: "10px 14px",
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.6,
              marginBottom: 10,
            }}
          >
            {item.additionalInsured}
          </div>
          <DetailRow label="Endorsements" value={item.specialEndorsements} />
          {item.minimumLimits && (
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
                Minimum Limits
              </div>
              {Object.entries(item.minimumLimits).map(([key, val]) => (
                <DetailRow
                  key={key}
                  label={key.replace(/([A-Z])/g, " $1").trim()}
                  value={val}
                />
              ))}
            </>
          )}
          <DetailRow label="Last Used" value={item.lastUsed} />
        </>
      )}
    />
  );
}
