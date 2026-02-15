import React from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { GEAR_CATEGORIES, createGearItem } from "../data/gear";

const statusColors = {
  Available: "#10b981",
  Assigned: "#6366f1",
  "In Repair": "#f59e0b",
  "Out of Service": "#ef4444",
  Rental: "#06b6d4",
};

export default function GearLibrary({ items, onUpdate }) {
  return (
    <ResourceLibrary
      title="Gear"
      items={items}
      categories={GEAR_CATEGORIES}
      categoryField="category"
      titleField="name"
      searchFields={["serialNumber", "faaRegistration", "assignedTo"]}
      addLabel="Add Gear"
      onAdd={() => onUpdate([...items, createGearItem()])}
      onEdit={(item) => {
        const name = prompt("Gear name:", item.name);
        if (name !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, name } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this gear item?")) {
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
          {item.assignedTo && (
            <span style={{ color: "#64748b", marginLeft: 8 }}>
              → {item.assignedTo}
            </span>
          )}
        </div>
      )}
      renderDetail={(item) => (
        <>
          <DetailRow label="Serial #" value={item.serialNumber} />
          <DetailRow label="FAA Reg" value={item.faaRegistration} />
          <DetailRow label="Purchase Date" value={item.purchaseDate} />
          <DetailRow label="Assigned To" value={item.assignedTo} />
          <DetailRow label="Last Maint." value={item.lastMaintenance} />
          <DetailRow label="Next Maint." value={item.nextMaintenance} />
          <DetailRow label="Insured Value" value={item.insuranceValue} />
          {item.specs && Object.keys(item.specs).length > 0 && (
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
                Specs
              </div>
              {Object.entries(item.specs).map(([key, val]) => (
                <DetailRow key={key} label={key} value={val} />
              ))}
            </>
          )}
        </>
      )}
    />
  );
}
