// Flying Monster LLC — Job Data Model & Pipeline
// Core job tracking: Lead → Quoted → Booked → Prepping → Shooting → Wrapping → Invoiced → Complete

export const JOB_STATUSES = [
  "Lead",
  "Quoted",
  "Booked",
  "Prepping",
  "Shooting",
  "Wrapping",
  "Invoiced",
  "Complete",
];

export const JOB_STATUS_COLORS = {
  Lead: "#6366f1",
  Quoted: "#8b5cf6",
  Booked: "#06b6d4",
  Prepping: "#f59e0b",
  Shooting: "#ef4444",
  Wrapping: "#f97316",
  Invoiced: "#10b981",
  Complete: "#6b7280",
};

export function createJob(overrides = {}) {
  return {
    id: `job-${Date.now()}`,
    title: "",
    client: "",
    status: "Lead",
    critical: false,
    shootDate: "",
    location: "",
    city: "",
    state: "",
    isNYC: false,
    description: "",
    gearList: [],
    crewAssigned: [],
    payrollType: "FM Payroll",
    slackChannel: "",
    coiTemplate: "",
    permitStatus: "Not Started",
    notes: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
