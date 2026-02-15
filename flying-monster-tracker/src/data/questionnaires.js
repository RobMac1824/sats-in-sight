// Flying Monster LLC — Studio Questionnaires Library
// Organizational pattern: studio-specific drone vendor questionnaire templates with auto-fill answers

export const QUESTIONNAIRE_CATEGORIES = [
  "Major Studio",
  "Streaming",
  "Network",
  "Independent",
  "Generic",
];

// Standard answers that auto-fill across all questionnaires (~80% auto-fill rate)
export const FM_STANDARD_ANSWERS = {
  companyName: "Flying Monster LLC",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  website: "",
  ownerName: "Matty Metz",
  yearsInBusiness: "",
  faaPartCert: "Part 107 Remote Pilot Certificate",
  faaPartCertNumber: "",
  faaWaivers: ["Night Operations (built-in post-2021)", "Operations Over People (pending/as-needed)"],
  insuranceCarrier: "",
  insurancePolicyNumber: "",
  generalLiabilityLimit: "$1,000,000 per occurrence / $2,000,000 aggregate",
  umbrellaLimit: "$5,000,000",
  workersComp: "Yes — Statutory",
  droneHullCoverage: "Yes",
  safetyRecord: "Zero incidents. Clean safety record across all operations.",
  safetyManual: "Yes — SMS (Safety Management System) manual maintained and updated annually.",
  emergencyProcedures: "Yes — documented emergency response procedures including lost link, flyaway, battery failure, and medical emergency protocols.",
  pilotExperience: "1000+ commercial flight hours. Experienced in film/TV, commercial, corporate, and live event operations.",
  pilotCertifications: ["FAA Part 107", "Part 107 Night Ops", "NYC NYPD Film Permit Approved"],
  visualObserverProtocol: "Dedicated VO on all flights. Radio communication with PIC. Trained in airspace scanning and hazard identification.",
  aircraftTypes: [
    "DJI Inspire 3 (cinema-grade, 8K, dual-operator)",
    "DJI Mavic 3 Pro (scout/B-cam, Hasselblad 4/3 CMOS)",
    "Custom FPV 5\" (freestyle/proximity, GoPro mounted)",
  ],
  maintenanceSchedule: "Pre-flight inspection per manufacturer checklist. 50-hour detailed inspection. Annual full maintenance and firmware review.",
  parachuteSystem: "ParaZero SafeAir — ASTM F3322-18 compliant recovery system for operations over people.",
  maxAltitude: "400 feet AGL (or as authorized by FAA waiver / LAANC)",
  maxRange: "Visual line of sight (VLOS) at all times",
  weatherMinimums: "Wind < 25 mph sustained, visibility > 3 statute miles, ceiling > 500 ft AGL, no precipitation",
  nycExperience: "Extensive NYC experience. Familiar with MOME/NYPD permitting process, controlled airspace procedures, and urban operational constraints.",
  previousClients: "Major studios and production companies across film, television, and commercial sectors.",
  references: "Available upon request.",
};

export const DEFAULT_QUESTIONNAIRES = [
  {
    id: "quest-001",
    studio: "NBC Universal",
    category: "Major Studio",
    title: "NBCU Drone Vendor Qualification Questionnaire",
    sections: [
      {
        title: "Company Information",
        questions: [
          { q: "Legal company name", autoFill: "companyName", answer: "" },
          { q: "Company address", autoFill: "companyAddress", answer: "" },
          { q: "Primary contact name and title", autoFill: "ownerName", answer: "" },
          { q: "Phone number", autoFill: "companyPhone", answer: "" },
          { q: "Email address", autoFill: "companyEmail", answer: "" },
          { q: "Years in business", autoFill: "yearsInBusiness", answer: "" },
          { q: "Website", autoFill: "website", answer: "" },
        ],
      },
      {
        title: "FAA Certification & Compliance",
        questions: [
          { q: "FAA Part 107 certificate number", autoFill: "faaPartCertNumber", answer: "" },
          { q: "List all active FAA waivers", autoFill: "faaWaivers", answer: "" },
          { q: "Any FAA enforcement actions or violations?", autoFill: null, answer: "No. Clean record with no enforcement actions, violations, or incidents." },
        ],
      },
      {
        title: "Insurance",
        questions: [
          { q: "Insurance carrier name", autoFill: "insuranceCarrier", answer: "" },
          { q: "General liability limits", autoFill: "generalLiabilityLimit", answer: "" },
          { q: "Umbrella/excess liability limits", autoFill: "umbrellaLimit", answer: "" },
          { q: "Workers compensation coverage", autoFill: "workersComp", answer: "" },
          { q: "Drone hull coverage", autoFill: "droneHullCoverage", answer: "" },
        ],
      },
      {
        title: "Safety",
        questions: [
          { q: "Describe your safety record", autoFill: "safetyRecord", answer: "" },
          { q: "Do you maintain a written safety manual?", autoFill: "safetyManual", answer: "" },
          { q: "Describe emergency procedures", autoFill: "emergencyProcedures", answer: "" },
          { q: "Do you use a parachute/recovery system?", autoFill: "parachuteSystem", answer: "" },
        ],
      },
      {
        title: "Equipment & Operations",
        questions: [
          { q: "List all aircraft types and capabilities", autoFill: "aircraftTypes", answer: "" },
          { q: "Describe maintenance schedule", autoFill: "maintenanceSchedule", answer: "" },
          { q: "Pilot flight hours and experience", autoFill: "pilotExperience", answer: "" },
          { q: "Visual observer protocol", autoFill: "visualObserverProtocol", answer: "" },
          { q: "Weather minimums for operations", autoFill: "weatherMinimums", answer: "" },
        ],
      },
      {
        title: "NBCU-Specific",
        questions: [
          { q: "Previous NBCU productions worked on", autoFill: null, answer: "" },
          { q: "Available for multi-day bookings?", autoFill: null, answer: "Yes. Available for multi-day, multi-location, and episodic bookings." },
          { q: "NYC experience and permitting capability", autoFill: "nycExperience", answer: "" },
        ],
      },
    ],
    notes: "NBCU typically sends this during vendor onboarding. Turnaround expected within 5 business days.",
    lastUsed: "",
  },
  {
    id: "quest-002",
    studio: "Netflix",
    category: "Streaming",
    title: "Netflix Drone Operations Vendor Assessment",
    sections: [
      {
        title: "Vendor Information",
        questions: [
          { q: "Company legal name", autoFill: "companyName", answer: "" },
          { q: "Business address", autoFill: "companyAddress", answer: "" },
          { q: "Owner / operator name", autoFill: "ownerName", answer: "" },
          { q: "Contact information", autoFill: "companyPhone", answer: "" },
          { q: "Website / reel link", autoFill: "website", answer: "" },
        ],
      },
      {
        title: "Licensing & Insurance",
        questions: [
          { q: "FAA Part 107 number and expiration", autoFill: "faaPartCertNumber", answer: "" },
          { q: "Active waivers and authorizations", autoFill: "faaWaivers", answer: "" },
          { q: "Insurance limits (GL, auto, umbrella, WC)", autoFill: "generalLiabilityLimit", answer: "" },
          { q: "Policy number and carrier", autoFill: "insurancePolicyNumber", answer: "" },
          { q: "Can you provide COI naming Netflix as additional insured?", autoFill: null, answer: "Yes. COI with Netflix-specific additional insured language, primary & non-contributory, and waiver of subrogation." },
        ],
      },
      {
        title: "Aircraft & Capabilities",
        questions: [
          { q: "Drone fleet details (make, model, payload, flight time)", autoFill: "aircraftTypes", answer: "" },
          { q: "Camera/sensor capabilities", autoFill: null, answer: "8K Full-Frame (Inspire 3 / Zenmuse X9), 4/3 CMOS Hasselblad (Mavic 3 Pro), GoPro Hero 12 (FPV). ProRes, CinemaDNG, H.265 capable." },
          { q: "FPV capabilities", autoFill: null, answer: "Yes. Custom 5\" FPV build for proximity/chase shots. Experienced FPV pilot with cinema-quality stabilization." },
          { q: "Maximum altitude and range", autoFill: "maxAltitude", answer: "" },
        ],
      },
      {
        title: "Safety & Experience",
        questions: [
          { q: "Total commercial flight hours", autoFill: "pilotExperience", answer: "" },
          { q: "Safety incident history", autoFill: "safetyRecord", answer: "" },
          { q: "Emergency procedures documentation", autoFill: "emergencyProcedures", answer: "" },
          { q: "Recovery / parachute systems", autoFill: "parachuteSystem", answer: "" },
          { q: "NYC permitting experience", autoFill: "nycExperience", answer: "" },
          { q: "Notable previous clients / productions", autoFill: "previousClients", answer: "" },
        ],
      },
      {
        title: "Netflix-Specific",
        questions: [
          { q: "Have you worked on a Netflix production before?", autoFill: null, answer: "" },
          { q: "Ability to sign NDA and comply with Netflix security protocols?", autoFill: null, answer: "Yes. Fully compliant with NDA and content security requirements." },
          { q: "Available for international travel?", autoFill: null, answer: "" },
          { q: "Day rate structure (pilot, pilot+VO, full crew)", autoFill: null, answer: "" },
        ],
      },
    ],
    notes: "Netflix questionnaire is more detailed than most. They also require a demo reel. Turnaround: 7 business days.",
    lastUsed: "",
  },
  {
    id: "quest-003",
    studio: "Warner Bros. Discovery",
    category: "Major Studio",
    title: "WBD UAS Vendor Qualification Form",
    sections: [
      {
        title: "Company Details",
        questions: [
          { q: "Company name and DBA", autoFill: "companyName", answer: "" },
          { q: "Address", autoFill: "companyAddress", answer: "" },
          { q: "Primary contact", autoFill: "ownerName", answer: "" },
          { q: "Phone / email", autoFill: "companyPhone", answer: "" },
        ],
      },
      {
        title: "Certifications",
        questions: [
          { q: "Part 107 certificate details", autoFill: "faaPartCertNumber", answer: "" },
          { q: "FAA waivers held", autoFill: "faaWaivers", answer: "" },
          { q: "State/local licenses if applicable", autoFill: null, answer: "NYC NYPD Film Permit approved vendor. Additional state permits obtained per-job as required." },
        ],
      },
      {
        title: "Insurance & Liability",
        questions: [
          { q: "GL coverage limits", autoFill: "generalLiabilityLimit", answer: "" },
          { q: "Umbrella coverage", autoFill: "umbrellaLimit", answer: "" },
          { q: "Hull insurance", autoFill: "droneHullCoverage", answer: "" },
          { q: "Workers comp", autoFill: "workersComp", answer: "" },
        ],
      },
      {
        title: "Operations",
        questions: [
          { q: "Aircraft inventory", autoFill: "aircraftTypes", answer: "" },
          { q: "Maintenance program description", autoFill: "maintenanceSchedule", answer: "" },
          { q: "Safety management system", autoFill: "safetyManual", answer: "" },
          { q: "Pilot qualifications and flight hours", autoFill: "pilotExperience", answer: "" },
          { q: "Weather decision-making process", autoFill: "weatherMinimums", answer: "" },
        ],
      },
      {
        title: "WBD-Specific",
        questions: [
          { q: "Previous WBD/HBO/CNN productions", autoFill: null, answer: "" },
          { q: "Multi-camera drone capability", autoFill: null, answer: "Yes. Dual-operator Inspire 3 with dedicated camera operator. Simultaneous multi-drone ops available with additional crew." },
          { q: "Live feed / video village integration", autoFill: null, answer: "Yes. HDMI out from controller to video village. Compatible with Teradek and standard wireless video systems." },
        ],
      },
    ],
    notes: "WBD uses same form for HBO, CNN, Discovery, and all subsidiary productions.",
    lastUsed: "",
  },
  {
    id: "quest-004",
    studio: "Disney / ABC",
    category: "Major Studio",
    title: "Disney Entertainment Drone Vendor Questionnaire",
    sections: [
      {
        title: "Vendor Profile",
        questions: [
          { q: "Legal entity name", autoFill: "companyName", answer: "" },
          { q: "Principal address", autoFill: "companyAddress", answer: "" },
          { q: "Key personnel (owner, lead pilot)", autoFill: "ownerName", answer: "" },
          { q: "Contact details", autoFill: "companyPhone", answer: "" },
          { q: "Years of commercial drone operations", autoFill: "yearsInBusiness", answer: "" },
        ],
      },
      {
        title: "Regulatory Compliance",
        questions: [
          { q: "Part 107 certificate and recency", autoFill: "faaPartCertNumber", answer: "" },
          { q: "All active FAA waivers with expiration dates", autoFill: "faaWaivers", answer: "" },
          { q: "Regulatory violations or incidents (ever)", autoFill: null, answer: "None. Clean regulatory record." },
          { q: "TRUST completion (recreational, if applicable)", autoFill: null, answer: "N/A — all operations conducted under Part 107 commercial authority." },
        ],
      },
      {
        title: "Insurance Requirements",
        questions: [
          { q: "GL limits (Disney minimum: $1M/$2M)", autoFill: "generalLiabilityLimit", answer: "" },
          { q: "Umbrella limits (Disney minimum: $10M)", autoFill: null, answer: "$10,000,000 umbrella/excess liability available for Disney productions." },
          { q: "Workers compensation", autoFill: "workersComp", answer: "" },
          { q: "Aircraft hull coverage amount", autoFill: null, answer: "Full replacement value hull coverage on all aircraft." },
        ],
      },
      {
        title: "Safety & Risk Management",
        questions: [
          { q: "Written SMS (Safety Management System)?", autoFill: "safetyManual", answer: "" },
          { q: "Emergency response plan?", autoFill: "emergencyProcedures", answer: "" },
          { q: "Parachute / recovery system details", autoFill: "parachuteSystem", answer: "" },
          { q: "Incident history (last 5 years)", autoFill: "safetyRecord", answer: "" },
          { q: "Pre-flight checklist process", autoFill: null, answer: "Standardized pre-flight checklist per manufacturer specifications plus FM-specific safety additions. Documented and signed by PIC before each flight." },
        ],
      },
      {
        title: "Equipment & Technical",
        questions: [
          { q: "Complete aircraft fleet list with specs", autoFill: "aircraftTypes", answer: "" },
          { q: "Camera/imaging capabilities", autoFill: null, answer: "Cinema-grade 8K Full-Frame (Zenmuse X9), Hasselblad 4/3 CMOS, thermal imaging capable. ProRes, CinemaDNG, H.265 workflows." },
          { q: "Live monitoring / video village setup", autoFill: null, answer: "Real-time HDMI feed from controller. Compatible with Teradek, Paralinx, and standard wireless video systems. Director's monitor available." },
          { q: "Maintenance and airworthiness program", autoFill: "maintenanceSchedule", answer: "" },
        ],
      },
      {
        title: "Disney-Specific Requirements",
        questions: [
          { q: "Previous Disney/ABC/ESPN/Hulu productions?", autoFill: null, answer: "" },
          { q: "Background check consent for all crew?", autoFill: null, answer: "Yes. All crew members consent to background checks as required by Disney security protocols." },
          { q: "Ability to operate on Disney property?", autoFill: null, answer: "Yes. Experienced with controlled-access production facilities and studio lot operations." },
          { q: "Content security compliance?", autoFill: null, answer: "Yes. Encrypted media handling, NDA compliance, no personal device recording on set." },
        ],
      },
    ],
    notes: "Disney has the most extensive questionnaire. They also require background checks on all crew who will be on Disney property. Allow 10-15 business days for vendor approval.",
    lastUsed: "",
  },
  {
    id: "quest-005",
    studio: "Generic / Independent",
    category: "Generic",
    title: "Standard Drone Vendor Questionnaire (FM Template)",
    sections: [
      {
        title: "Company Information",
        questions: [
          { q: "Company name", autoFill: "companyName", answer: "" },
          { q: "Address", autoFill: "companyAddress", answer: "" },
          { q: "Contact name and title", autoFill: "ownerName", answer: "" },
          { q: "Phone", autoFill: "companyPhone", answer: "" },
          { q: "Email", autoFill: "companyEmail", answer: "" },
        ],
      },
      {
        title: "Certifications & Insurance",
        questions: [
          { q: "FAA Part 107 certificate", autoFill: "faaPartCertNumber", answer: "" },
          { q: "Insurance coverage limits", autoFill: "generalLiabilityLimit", answer: "" },
          { q: "Can you provide a COI?", autoFill: null, answer: "Yes. COI with custom additional insured language available within 24 hours." },
        ],
      },
      {
        title: "Equipment & Safety",
        questions: [
          { q: "Aircraft types available", autoFill: "aircraftTypes", answer: "" },
          { q: "Safety record", autoFill: "safetyRecord", answer: "" },
          { q: "Pilot experience", autoFill: "pilotExperience", answer: "" },
        ],
      },
      {
        title: "Availability & Rates",
        questions: [
          { q: "Day rate (pilot only)", autoFill: null, answer: "" },
          { q: "Day rate (pilot + VO)", autoFill: null, answer: "" },
          { q: "Day rate (full crew: pilot + VO + camera op)", autoFill: null, answer: "" },
          { q: "Travel / per diem requirements", autoFill: null, answer: "" },
        ],
      },
    ],
    notes: "Use this as a starting template for clients who don't have their own questionnaire. Can be customized per-client.",
    lastUsed: "",
  },
];

export function createQuestionnaire(overrides = {}) {
  return {
    id: `quest-${Date.now()}`,
    studio: "",
    category: "Generic",
    title: "",
    sections: [
      {
        title: "General",
        questions: [{ q: "", autoFill: null, answer: "" }],
      },
    ],
    notes: "",
    lastUsed: "",
    ...overrides,
  };
}
