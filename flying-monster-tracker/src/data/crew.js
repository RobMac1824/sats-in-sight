// Flying Monster LLC — Crew Directory
// Organizational pattern: categorized entries with role, contact, certs, and notes

export const CREW_CATEGORIES = [
  "Pilot",
  "Visual Observer",
  "Camera Operator",
  "Crew Chief",
  "Safety",
  "Production",
];

export const DEFAULT_CREW = [
  {
    id: "crew-001",
    name: "Matty Metz",
    role: "Pilot",
    category: "Pilot",
    phone: "",
    email: "",
    certifications: ["Part 107", "Part 107 Waiver — Night Ops", "NYC NYPD Film Permit Approved"],
    dayRate: "",
    notes: "Owner / Lead Pilot. Handles all NYC ops and client-facing shoots.",
    gear: ["DJI Inspire 3", "DJI Mavic 3 Pro", "FPV Custom Build"],
    availability: "Primary",
  },
];

export function createCrewMember(overrides = {}) {
  return {
    id: `crew-${Date.now()}`,
    name: "",
    role: "Pilot",
    category: "Pilot",
    phone: "",
    email: "",
    certifications: [],
    dayRate: "",
    notes: "",
    gear: [],
    availability: "Available",
    ...overrides,
  };
}
