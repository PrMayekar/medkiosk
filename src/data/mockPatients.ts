export interface MockDocument {
  name: string;
  url: string;
  type: string;
  isSample: true;
}

export interface MockPatient {
  id: string;
  queueNumber: string;
  name: string;
  age: number;
  sex: string;
  pathway: "General Medicine" | "Ayurvedic / AYUSH";
  status: "Ready for Review" | "In Progress" | "Reviewed";
  redFlag: boolean;
  complaint: string;
  symptoms: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  documents: MockDocument[];
  aiNotes: string;
  timeline: { time: string; event: string }[];
  summary: string;
}

/** Builds a small inline SVG "sample document" preview — no real scanned file exists for seeded demo patients. */
function sampleDoc(name: string): MockDocument {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <rect width="600" height="800" fill="#F6F8F7"/>
    <rect x="24" y="24" width="552" height="752" rx="16" fill="#FFFFFF" stroke="#E1E8E5" stroke-width="2"/>
    <circle cx="90" cy="90" r="22" fill="#0F6E63"/>
    <text x="130" y="98" font-family="Arial" font-size="22" fill="#12201C" font-weight="700">MediKiosk</text>
    <line x1="60" y1="150" x2="540" y2="150" stroke="#E1E8E5" stroke-width="2"/>
    <text x="60" y="210" font-family="Arial" font-size="18" fill="#4B5D57">Sample document — demo data</text>
    <text x="60" y="250" font-family="Arial" font-size="22" fill="#12201C" font-weight="600">${name}</text>
    <text x="60" y="300" font-family="Arial" font-size="14" fill="#7C8B86">No real scanned file exists for this seeded</text>
    <text x="60" y="322" font-family="Arial" font-size="14" fill="#7C8B86">demo patient. OCR integration planned.</text>
  </svg>`;
  return { name, url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, type: "image/svg+xml", isSample: true };
}

/** Fictional demonstration data only — used to populate the doctor dashboard. */
export const mockPatients: MockPatient[] = [
  {
    id: "demo-1",
    queueNumber: "A-024",
    name: "Rahul Sharma",
    age: 42,
    sex: "Male",
    pathway: "General Medicine",
    status: "Ready for Review",
    redFlag: true,
    complaint: "Chest discomfort for two days",
    symptoms: "Intermittent chest discomfort and mild shortness of breath",
    medications: "Amlodipine",
    allergies: "No known allergies",
    familyHistory: "Father — hypertension",
    documents: [sampleDoc("Prescription.pdf"), sampleDoc("Blood_Report.jpg")],
    aiNotes:
      "Patient reports intermittent chest discomfort radiating occasionally, with mild breathlessness. Rule-based screening flagged this combination for urgent clinical attention.",
    timeline: [
      { time: "09:12", event: "Intake started" },
      { time: "09:19", event: "Presenting complaint recorded" },
      { time: "09:24", event: "Red-flag screening triggered" },
      { time: "09:27", event: "Intake submitted for review" },
    ],
    summary:
      "PATIENT OVERVIEW\nPathway: General Medicine\n\nPRESENTING COMPLAINT\nChest discomfort for two days\n\nHISTORY OF PRESENT ILLNESS\nOnset: two days ago. Intermittent, non-exertional. Associated mild breathlessness.\n\nPAST MEDICAL HISTORY\nHypertension, on treatment\n\nMEDICATIONS\nAmlodipine\n\nALLERGIES\nNo known allergies\n\nFAMILY HISTORY\nFather — hypertension\n\nPERSONAL / SOCIAL HISTORY\nNon-smoker\n\nRELEVANT SYMPTOMS\nChest discomfort, mild breathlessness\n\nPOTENTIAL RED FLAGS\nYes — chest discomfort with breathlessness\n\nINFORMATION MISSING\nVitals and ECG not yet available\n\nAI-generated summary — physician review required.",
  },
  {
    id: "demo-2",
    queueNumber: "A-025",
    name: "Anjali Deshmukh",
    age: 29,
    sex: "Female",
    pathway: "Ayurvedic / AYUSH",
    status: "Ready for Review",
    redFlag: false,
    complaint: "Poor digestion and disturbed sleep for three weeks",
    symptoms: "Bloating after meals, irregular sleep, low energy",
    medications: "None",
    allergies: "No known allergies",
    familyHistory: "Mother — thyroid disorder",
    documents: [],
    aiNotes:
      "Patient describes sluggish digestion and disturbed sleep with moderate stress. No red-flag symptoms identified. AYUSH lifestyle questions completed.",
    timeline: [
      { time: "10:02", event: "Intake started" },
      { time: "10:08", event: "AYUSH assessment questions completed" },
      { time: "10:15", event: "Intake submitted for review" },
    ],
    summary:
      "PATIENT OVERVIEW\nPathway: Ayurvedic / AYUSH\n\nPRESENTING COMPLAINT\nPoor digestion and disturbed sleep for three weeks\n\nHISTORY OF PRESENT ILLNESS\nGradual onset, worse in the evenings\n\nPAST MEDICAL HISTORY\nNot provided\n\nMEDICATIONS\nNone\n\nALLERGIES\nNo known allergies\n\nFAMILY HISTORY\nMother — thyroid disorder\n\nPERSONAL / SOCIAL HISTORY\nModerate stress, irregular meal timing\n\nRELEVANT SYMPTOMS\nBloating, low energy, disturbed sleep\n\nPOTENTIAL RED FLAGS\nNone identified by rule-based screening\n\nINFORMATION MISSING\nDosha-based constitution assessment pending clinician review\n\nAI-generated summary — physician review required.",
  },
  {
    id: "demo-3",
    queueNumber: "A-026",
    name: "Kavya Iyer",
    age: 34,
    sex: "Female",
    pathway: "General Medicine",
    status: "Reviewed",
    redFlag: false,
    complaint: "Recurrent headaches for one week",
    symptoms: "Mild nausea, no visual disturbance",
    medications: "Paracetamol as needed",
    allergies: "Penicillin",
    familyHistory: "None relevant",
    documents: [sampleDoc("Discharge_Summary.pdf")],
    aiNotes: "Headache pattern consistent with tension-type presentation. No visual or neurological red flags reported.",
    timeline: [
      { time: "08:40", event: "Intake started" },
      { time: "08:47", event: "Intake submitted for review" },
      { time: "09:05", event: "Reviewed by Dr. Mehta" },
    ],
    summary:
      "PATIENT OVERVIEW\nPathway: General Medicine\n\nPRESENTING COMPLAINT\nRecurrent headaches for one week\n\nHISTORY OF PRESENT ILLNESS\nBoth sides, mild nausea, no visual disturbance\n\nPAST MEDICAL HISTORY\nNot provided\n\nMEDICATIONS\nParacetamol as needed\n\nALLERGIES\nPenicillin\n\nFAMILY HISTORY\nNone relevant\n\nPERSONAL / SOCIAL HISTORY\nNot provided\n\nRELEVANT SYMPTOMS\nMild nausea\n\nPOTENTIAL RED FLAGS\nNone identified by rule-based screening\n\nINFORMATION MISSING\nSleep and screen-time history not collected\n\nAI-generated summary — physician review required.",
  },
];
