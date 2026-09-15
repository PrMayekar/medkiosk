import type { UploadedDocument } from "../types/intake";

export interface QueuedPatient {
  id: string;
  queueNumber: string;
  name: string;
  age: number;
  sex: string;
  pathway: "General Medicine" | "Ayurvedic / AYUSH";
  status: "Ready for Review" | "Reviewed";
  redFlag: boolean;
  redFlagReason: string;
  abhaLinked: boolean;
  abhaId: string | null;
  complaint: string;
  symptoms: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  additionalNotes: string;
  answers: Record<string, string>;
  transcript: { role: "assistant" | "patient"; text: string }[];
  documents: UploadedDocument[];
  aiNotes: string;
  submittedAt: number;
  summary: string;
}

const STORAGE_KEY = "medikiosk_patients";

/**
 * A queue is additive by design: every completed intake is appended, and
 * nothing already in the list is ever overwritten. This is still not a
 * database — it's localStorage, scoped to this browser, purely for demo
 * continuity across the kiosk and doctor-dashboard views.
 */
export function loadQueuedPatients(): QueuedPatient[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueuedPatients(list: QueuedPatient[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (quota, private browsing) — non-fatal for a demo.
  }
}

/** Appends a new patient to the persisted queue. Never replaces existing entries. */
export function addQueuedPatient(patient: QueuedPatient): QueuedPatient {
  const list = loadQueuedPatients();
  list.push(patient);
  saveQueuedPatients(list);
  return patient;
}

/**
 * Generates the next sequential queue number (e.g. A-027, A-028, ...)
 * based on the highest numeric suffix seen across both the seeded demo
 * queue numbers and anything already persisted, so numbers never repeat
 * or reset within a browser session.
 */
export function nextQueueNumber(seedNumbers: string[]): string {
  const all = [...seedNumbers, ...loadQueuedPatients().map((p) => p.queueNumber)];
  let max = 26; // demo queue starts its real numbers at A-027
  for (const num of all) {
    const match = /^[A-Z]-(\d+)$/.exec(num);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `A-${String(max + 1).padStart(3, "0")}`;
}
