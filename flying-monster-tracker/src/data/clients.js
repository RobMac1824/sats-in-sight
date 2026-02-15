// Flying Monster LLC — Client Contacts Library
// Organizational pattern: categorized client entries with contact info, history, and preferences

export const CLIENT_CATEGORIES = [
  "Production Company",
  "Studio",
  "Network",
  "Advertising / Agency",
  "Corporate",
  "Independent",
  "Government / Municipal",
];

export const DEFAULT_CLIENTS = [
  {
    id: "client-001",
    company: "",
    category: "Production Company",
    contacts: [
      {
        name: "",
        title: "",
        phone: "",
        email: "",
        role: "Primary Contact",
      },
    ],
    address: "",
    billingAddress: "",
    paymentTerms: "Net 30",
    preferredPayroll: "FM Payroll",
    notes: "",
    jobHistory: [],
    coiTemplate: "",
    slackChannel: "",
  },
];

export const PAYMENT_TERMS_OPTIONS = [
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due on Receipt",
  "50% Upfront / 50% Wrap",
];

export const CONTACT_ROLE_OPTIONS = [
  "Primary Contact",
  "Line Producer",
  "UPM",
  "Production Coordinator",
  "Location Manager",
  "Post Supervisor",
  "Accounts Payable",
  "Legal / Business Affairs",
];

export function createClient(overrides = {}) {
  return {
    id: `client-${Date.now()}`,
    company: "",
    category: "Production Company",
    contacts: [
      {
        name: "",
        title: "",
        phone: "",
        email: "",
        role: "Primary Contact",
      },
    ],
    address: "",
    billingAddress: "",
    paymentTerms: "Net 30",
    preferredPayroll: "FM Payroll",
    notes: "",
    jobHistory: [],
    coiTemplate: "",
    slackChannel: "",
    ...overrides,
  };
}

export function createContact(overrides = {}) {
  return {
    name: "",
    title: "",
    phone: "",
    email: "",
    role: "Primary Contact",
    ...overrides,
  };
}
