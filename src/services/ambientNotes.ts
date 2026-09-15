export interface AmbientNote {
  patientId: string;
  consentGiven: boolean;
  transcript: string;
  summary: string;
  capturedAt: number;
}

const STORAGE_KEY = "medikiosk_ambient_notes";

type NoteMap = Record<string, AmbientNote>;

function loadAll(): NoteMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(notes: NoteMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Storage unavailable — non-fatal for a demo.
  }
}

/**
 * Ambient Listening notes are stored separately from the main patient
 * queue (services/patientQueue.ts) as a lightweight per-patient overlay,
 * so a consultation summary can be attached to *any* patient — including
 * the seeded demo patients, which aren't otherwise editable — without
 * needing to rewrite the base record.
 */
export function loadAmbientNote(patientId: string): AmbientNote | null {
  return loadAll()[patientId] ?? null;
}

export function saveAmbientNote(note: AmbientNote) {
  const all = loadAll();
  all[note.patientId] = note;
  saveAll(all);
}
