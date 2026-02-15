import React from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { CREW_CATEGORIES, createCrewMember } from "../data/crew";

export default function CrewDirectory({ items, onUpdate }) {
  return (
    <ResourceLibrary
      title="Crew Directory"
      items={items}
      categories={CREW_CATEGORIES}
      categoryField="category"
      titleField="name"
      subtitleField="role"
      searchFields={["certifications", "gear"]}
      addLabel="Add Crew"
      onAdd={() => onUpdate([...items, createCrewMember()])}
      onEdit={(item) => {
        const name = prompt("Name:", item.name);
        if (name !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, name } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this crew member?")) {
          onUpdate(items.filter((i) => i.id !== id));
        }
      }}
      renderCardMeta={(item) => (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {item.certifications.length > 0 && (
            <span>{item.certifications.length} cert{item.certifications.length !== 1 ? "s" : ""}</span>
          )}
          {item.availability && (
            <span style={{ marginLeft: 8 }}>{item.availability}</span>
          )}
        </div>
      )}
      renderDetail={(item) => (
        <>
          <DetailRow label="Phone" value={item.phone} />
          <DetailRow label="Email" value={item.email} />
          <DetailRow label="Day Rate" value={item.dayRate} />
          <DetailRow label="Certifications" value={item.certifications} />
          <DetailRow label="Gear" value={item.gear} />
          <DetailRow label="Availability" value={item.availability} />
        </>
      )}
    />
  );
}
