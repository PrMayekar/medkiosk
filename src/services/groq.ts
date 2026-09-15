import type { IntakeAnswers, IntakeQuestion, LanguageCode, Pathway, TranscriptTurn } from "../types/intake";
import { getFallbackQuestion } from "../data/fallbackQuestions";

/**
 * Client-side service for the AI intake assistant. The Groq API key is
 * NEVER used here — this file only calls our own serverless routes
 * (/api/chat, /api/summary), which hold the secret server-side. If those
 * routes are unreachable, missing a key, or return something malformed,
 * every function here falls back to a local, deterministic result so the
 * patient-facing flow never breaks.
 */

// Language‑specific labels for the fallback clinical summary
const summaryLabels: Record<LanguageCode, Record<string, string>> = {
  en: {
    patientOverview: "PATIENT OVERVIEW",
    presentingComplaint: "PRESENTING COMPLAINT",
    historyPresentIllness: "HISTORY OF PRESENT ILLNESS",
    pastMedicalHistory: "PAST MEDICAL HISTORY",
    medications: "MEDICATIONS",
    allergies: "ALLERGIES",
    familyHistory: "FAMILY HISTORY",
    personalSocialHistory: "PERSONAL / SOCIAL HISTORY",
    relevantSymptoms: "RELEVANT SYMPTOMS",
    potentialRedFlags: "POTENTIAL RED FLAGS",
    informationMissing: "INFORMATION MISSING",
    vitalsMissing: "Vitals, examination findings, and diagnostic tests were not collected in this pre-consultation intake.",
    aiGeneratedNote: "AI-generated summary — physician review required.",
    yesRedFlag: "Yes — see red-flag screening panel.",
    noneRedFlag: "None identified by rule-based screening."
  },
  hi: {
    patientOverview: "रोगी सारांश",
    presentingComplaint: "मुख्य शिकायत",
    historyPresentIllness: "वर्तमान रोग की इतिहास",
    pastMedicalHistory: "पिछला चिकित्सीय इतिहास",
    medications: "दवाएँ",
    allergies: "एलर्जी",
    familyHistory: "पारिवारिक इतिहास",
    personalSocialHistory: "व्यक्तिगत / सामाजिक इतिहास",
    relevantSymptoms: "संबंधित लक्षण",
    potentialRedFlags: "संभावित रेड‑फ़्लैग",
    informationMissing: "सत्र में अभाव",
    vitalsMissing: "रक्तविज्ञान, परीक्षा के निष्कर्ष, और निदान परीक्षण इस प्री‑कंसल्टेशन इंटेक में नहीं एकत्र किए गए थे।",
    aiGeneratedNote: "एआई‑जनित सारांश — चिकित्सक की समीक्षा आवश्यक",
    yesRedFlag: "हाँ — रेड‑फ़्लैग स्क्रीनिंग पैनल देखें",
    noneRedFlag: "नियम‑आधारित स्क्रीनिंग द्वारा कोई नहीं पहचाना गया"
  },
  mr: {
    patientOverview: "रुग्ण आढावा",
    presentingComplaint: "मुख्य तक्रार",
    historyPresentIllness: "वर्तमान आजाराचा इतिहास",
    pastMedicalHistory: "भूतपूर्व वैद्यकीय इतिहास",
    medications: "औषधे",
    allergies: "अॅलेर्जी",
    familyHistory: "कुटुंबीय इतिहास",
    personalSocialHistory: "वैयक्तिक / सामाजिक इतिहास",
    relevantSymptoms: "संबंधित लक्षणे",
    potentialRedFlags: "संभाव्य रेड‑फ्लॅग",
    informationMissing: "अजूनही माहिती गायब",
    vitalsMissing: "या प्री‑कन्सल्टेशन इंटेक मध्ये जीवनचिन्हे, शारीरिक परीक्षण निष्णातील आणि निदान चाचण्या गोळा केल्या नाहीत.",
    aiGeneratedNote: "एआय‑निर्मित सारांश — डॉक्टरची समीक्षा आवश्यक",
    yesRedFlag: "होय — रेड‑फ्लॅग स्क्रीनिंग पॅनेल पहा",
    noneRedFlag: "नियम‑आधारित स्क्रीनिंगद्वारे काहीही ओळखले गेले नाही"
  }
};

export interface ChatRequestPayload {
  language: LanguageCode;
  pathway: Pathway | null;
  conversation: TranscriptTurn[];
  patientData: { answers: IntakeAnswers };
}

let aiUnavailableNotified = false;

export function wasAiEverUnavailable() {
  return aiUnavailableNotified;
}

function isValidQuestion(value: unknown): value is IntakeQuestion {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.message === "string" &&
    typeof v.questionType === "string" &&
    Array.isArray(v.options) &&
    typeof v.field === "string" &&
    typeof v.nextSection === "string" &&
    typeof v.isComplete === "boolean"
  );
}

/**
 * Requests the next interview question. Tries Groq via /api/chat first;
 * on any failure (network error, non-2xx, malformed JSON, missing key)
 * it transparently falls back to the local question engine and flags
 * `aiAvailable: false` so the UI can show the "guided intake" notice.
 */
export async function getNextQuestion(
  payload: ChatRequestPayload,
  questionsAsked: number
): Promise<{ question: IntakeQuestion; aiAvailable: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Chat API returned ${res.status}`);

    const data = await res.json();
    if (!isValidQuestion(data)) throw new Error("Malformed AI response");

    return { question: data, aiAvailable: true };
  } catch {
    aiUnavailableNotified = true;
    const fallback = getFallbackQuestion(payload.patientData.answers, questionsAsked, payload.pathway, payload.language);
    return { question: fallback, aiAvailable: false };
  }
}

export interface SummaryRequestPayload {
  language: LanguageCode;
  pathway: Pathway | null;
  patientData: { answers: IntakeAnswers };
  redFlag: boolean;
}

/**
 * Requests a physician-facing structured summary from Groq via
 * /api/summary. Falls back to a locally assembled, purely factual
 * summary (no invented content) if the AI call fails.
 */
export async function getClinicalSummary(payload: SummaryRequestPayload): Promise<{ summary: string; aiAvailable: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Summary API returned ${res.status}`);
    const data = await res.json();
    if (typeof data.summary !== "string" || !data.summary.trim()) {
      throw new Error("Malformed summary response");
    }
    return { summary: data.summary, aiAvailable: true };
  } catch {
    return { summary: buildFallbackSummary(payload), aiAvailable: false };
  }
}

function na(value: string | undefined): string {
  return value && value.trim() ? value : "Not provided";
}

function buildFallbackSummary(payload: SummaryRequestPayload): string {
  const a = payload.patientData.answers;
  return [
    "PATIENT OVERVIEW",
    `Pathway: ${payload.pathway === "ayush" ? "Ayurvedic / AYUSH" : "General Medicine"}`,
    "",
    "PRESENTING COMPLAINT",
    na(a.presenting_complaint),
    "",
    "HISTORY OF PRESENT ILLNESS",
    `Onset: ${na(a.onset)}. Severity: ${na(a.severity)}. Location: ${na(a.pain_location || a.headache_location)}.`,
    "",
    "PAST MEDICAL HISTORY",
    na(a.past_medical_history),
    "",
    "MEDICATIONS",
    na(a.medications),
    "",
    "ALLERGIES",
    na(a.allergies),
    "",
    "FAMILY HISTORY",
    na(a.family_history),
    "",
    "PERSONAL / SOCIAL HISTORY",
    na(a.lifestyle),
    "",
    "RELEVANT SYMPTOMS",
    na(a.associated_symptoms),
    "",
    "POTENTIAL RED FLAGS",
    payload.redFlag ? "Yes — see red-flag screening panel." : "None identified by rule-based screening.",
    "",
    "INFORMATION MISSING",
    "Vitals, examination findings, and diagnostic tests were not collected in this pre-consultation intake.",
    "",
    "AI-generated summary — physician review required.",
  ].join("\n");
}
