// Flying Monster LLC — Company Documents Library
// Organizational pattern: categorized document references with type, status, expiration

export const DOC_CATEGORIES = [
  "Insurance",
  "Licensing",
  "Corporate",
  "Safety",
  "Operations",
  "Templates",
];

export const DEFAULT_COMPANY_DOCS = [
  {
    id: "doc-001",
    title: "FAA Part 107 Remote Pilot Certificate",
    category: "Licensing",
    type: "Certificate",
    status: "Active",
    issueDate: "",
    expirationDate: "",
    notes: "Renewed every 24 months via recurrent test.",
    linkedTo: "Matty Metz",
  },
  {
    id: "doc-002",
    title: "General Liability Insurance — $1M/$2M",
    category: "Insurance",
    type: "Policy",
    status: "Active",
    issueDate: "",
    expirationDate: "",
    notes: "Required for all commercial ops. COI generated per-job.",
    linkedTo: "",
  },
  {
    id: "doc-003",
    title: "Hull Insurance — Drone Fleet",
    category: "Insurance",
    type: "Policy",
    status: "Active",
    issueDate: "",
    expirationDate: "",
    notes: "Covers all registered aircraft in fleet.",
    linkedTo: "",
  },
  {
    id: "doc-004",
    title: "NYC NYPD Film Permit Application Template",
    category: "Templates",
    type: "Template",
    status: "Current",
    issueDate: "",
    expirationDate: "",
    notes: "Pre-filled template for NYC drone film permits.",
    linkedTo: "",
  },
  {
    id: "doc-005",
    title: "Safety Management System (SMS) Manual",
    category: "Safety",
    type: "Manual",
    status: "Current",
    issueDate: "",
    expirationDate: "",
    notes: "Required for Part 107 waiver applications.",
    linkedTo: "",
  },
  {
    id: "doc-006",
    title: "W-9 — Flying Monster LLC",
    category: "Corporate",
    type: "Tax Form",
    status: "Current",
    issueDate: "",
    expirationDate: "",
    notes: "Provided to production companies for vendor setup.",
    linkedTo: "",
  },
];

export function createCompanyDoc(overrides = {}) {
  return {
    id: `doc-${Date.now()}`,
    title: "",
    category: "Operations",
    type: "Document",
    status: "Draft",
    issueDate: "",
    expirationDate: "",
    notes: "",
    linkedTo: "",
    ...overrides,
  };
}
