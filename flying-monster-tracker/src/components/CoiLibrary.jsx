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
      )}
    />
  );
}
