import React from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { CLIENT_CATEGORIES, createClient } from "../data/clients";

export default function ClientContacts({ items, onUpdate }) {
  return (
    <ResourceLibrary
      title="Client Contacts"
      items={items}
      categories={CLIENT_CATEGORIES}
      categoryField="category"
      titleField="company"
      searchFields={["billingAddress", "paymentTerms", "slackChannel"]}
      addLabel="Add Client"
      onAdd={() => onUpdate([...items, createClient()])}
      onEdit={(item) => {
        const company = prompt("Company name:", item.company);
        if (company !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, company } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this client?")) {
          onUpdate(items.filter((i) => i.id !== id));
        }
      }}
      renderCardMeta={(item) => (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          {item.contacts && item.contacts.length > 0 && item.contacts[0].name && (
            <span>{item.contacts[0].name}</span>
          )}
          {item.contacts && item.contacts.length > 1 && (
            <span style={{ marginLeft: 4 }}>
              +{item.contacts.length - 1} more
            </span>
          )}
          {item.paymentTerms && (
            <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
              {item.paymentTerms}
            </span>
          )}
        </div>
      )}
      renderDetail={(item) => (
        <>
          <DetailRow label="Address" value={item.address} />
          <DetailRow label="Billing" value={item.billingAddress} />
          <DetailRow label="Payment" value={item.paymentTerms} />
          <DetailRow label="Payroll" value={item.preferredPayroll} />
          <DetailRow label="Slack" value={item.slackChannel} />
          <DetailRow label="COI Template" value={item.coiTemplate} />
          {item.contacts && item.contacts.length > 0 && (
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
                Contacts
              </div>
              {item.contacts.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: "#080a0e",
                    border: "1px solid #1e293b",
                    borderRadius: 6,
                    padding: "8px 12px",
                    marginBottom: 6,
                  }}
                >
                  <DetailRow label="Name" value={c.name} />
                  <DetailRow label="Title" value={c.title} />
                  <DetailRow label="Role" value={c.role} />
                  <DetailRow label="Phone" value={c.phone} />
                  <DetailRow label="Email" value={c.email} />
                </div>
              ))}
            </>
          )}
        </>
      )}
    />
  );
}
