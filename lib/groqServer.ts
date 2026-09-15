/**
 * Shared server-side helper for talking to Groq. Imported by both the
 * Vercel serverless functions (api/chat.ts, api/summary.ts) and the
 * Netlify functions (netlify/functions/*.ts) so the intake-assistant
 * system prompt and safety rules live in exactly one place.
 *
 * IMPORTANT: this file only ever runs server-side. GROQ_API_KEY must
 * never be read from a VITE_-prefixed variable or shipped to the browser.
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Sensible default if GROQ_MODEL isn't set — a small, fast, inexpensive
// Groq-hosted model. Override via the GROQ_MODEL environment variable;
// check https://console.groq.com/docs/models for the current catalog.
const DEFAULT_MODEL = "llama-3.1-8b-instant";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
};

export interface ChatBody {
  language?: string;
  pathway?: string | null;
  conversation?: Array<{ role: string; text: string }>;
  patientData?: { answers?: Record<string, string> };
}

export interface SummaryBody {
  language?: string;
  pathway?: string | null;
  patientData?: { answers?: Record<string, string> };
  redFlag?: boolean;
}

const INTAKE_SYSTEM_PROMPT = `You are the MediKiosk patient intake assistant, part of a hospital self-service kiosk prototype.

Your ONLY job is to collect and structure the patient's history before their consultation with a clinician. You are an intake assistant, NOT a doctor.

Strict rules — never break these:
- Do NOT diagnose the patient or name a likely condition.
- Do NOT prescribe or recommend any medication, treatment, or remedy.
- Do NOT claim certainty about any medical condition.
- Do NOT give medical advice of any kind.
- Ask exactly one clear, short question at a time.
- Ask about 8–12 questions total across the whole interview, then set isComplete to true.
- Adapt follow-up questions sensibly to what the patient already said (e.g. if they mention chest pain, ask about location, radiation, and associated breathlessness/sweating/dizziness; if they mention headache, ask about location and associated nausea/light sensitivity/vision changes).
- Cover, roughly in order: presenting complaint, history of present illness, past medical history, medications, allergies, family history, personal/social/lifestyle history, and — if the pathway is "ayush" — a short set of AYUSH lifestyle questions (diet, sleep, digestion, stress).
- Always respond in {LANGUAGE} only.
- Respond with ONLY a single JSON object and nothing else — no markdown, no commentary, no code fences. The JSON object must match exactly this shape:
{"message": string, "questionType": "text" | "single_select" | "multi_select", "options": [{"value": string, "label": string}], "field": string, "nextSection": string, "isComplete": boolean}
- "options" must be an empty array for questionType "text".
- "field" should be a short snake_case identifier for what this question collects (e.g. "presenting_complaint", "onset", "medications").
- Set "isComplete": true only on the final turn, once you have enough information to hand off to review.`;

const SUMMARY_SYSTEM_PROMPT = `You are the MediKiosk clinical summary generator, part of a hospital self-service kiosk prototype.

You convert structured patient-reported intake answers into a concise, factual, physician-facing summary. You are NOT a doctor: never diagnose, never suggest treatment, never speculate beyond what was reported.

Rules:
- Use only the information provided. NEVER invent details.
- If a field is missing or empty, write "Not provided" for that field.
- Always write the summary in {LANGUAGE} only.
- Structure the summary with these exact section headings, each on its own line, in this order:
PATIENT OVERVIEW
PRESENTING COMPLAINT
HISTORY OF PRESENT ILLNESS
PAST MEDICAL HISTORY
MEDICATIONS
ALLERGIES
FAMILY HISTORY
PERSONAL/SOCIAL HISTORY
RELEVANT SYMPTOMS
POTENTIAL RED FLAGS
INFORMATION MISSING
- End with the line: "AI-generated summary — physician review required."
- Respond with plain text only — no markdown formatting, no JSON, no code fences.`;

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 700,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Groq API error ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Empty response from Groq");
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/** Handles POST /api/chat logic. Throws on any failure — caller decides the fallback. */
export async function handleChat(body: ChatBody) {
  const language = LANGUAGE_NAMES[body.language || "en"] || "English";
  const systemPrompt = INTAKE_SYSTEM_PROMPT.replace(/{LANGUAGE}/g, language);

  const userPrompt = JSON.stringify({
    pathway: body.pathway || "general",
    conversationSoFar: (body.conversation || []).slice(-8),
    answersSoFar: body.patientData?.answers || {},
    instruction:
      "Based on the conversation and answers so far, return the single next intake question as the specified JSON object.",
  });

  const raw = await callGroq(systemPrompt, userPrompt);
  const cleaned = stripCodeFences(raw);
  const parsed = JSON.parse(cleaned);

  // Minimal shape validation — malformed output should be treated as a
  // failure by the caller, which falls back to the local question engine.
  if (
    typeof parsed.message !== "string" ||
    typeof parsed.questionType !== "string" ||
    !Array.isArray(parsed.options) ||
    typeof parsed.field !== "string" ||
    typeof parsed.nextSection !== "string" ||
    typeof parsed.isComplete !== "boolean"
  ) {
    throw new Error("Malformed question JSON from Groq");
  }

  return parsed;
}

/** Handles POST /api/summary logic. Throws on any failure — caller decides the fallback. */
export async function handleSummary(body: SummaryBody) {
  const language = LANGUAGE_NAMES[body.language || "en"] || "English";
  const systemPrompt = SUMMARY_SYSTEM_PROMPT.replace(/{LANGUAGE}/g, language);

  const userPrompt = JSON.stringify({
    pathway: body.pathway || "general",
    answers: body.patientData?.answers || {},
    ruleBasedRedFlag: Boolean(body.redFlag),
  });

  const raw = await callGroq(systemPrompt, userPrompt);
  const summary = stripCodeFences(raw);
  if (!summary) throw new Error("Empty summary from Groq");
  return summary;
}

/** Basic request-size guard shared by both platforms. */
export function isRequestTooLarge(rawBody: string): boolean {
  return rawBody.length > 50_000;
}

// --- Ambient Listening (demo) ---------------------------------------------
// Turns a raw doctor-patient consultation transcript into a short,
// structured clinical note. This is explicitly a summarization task, not
// a diagnostic one: the model may only reflect what was actually said in
// the transcript (including anything the doctor themself stated), and
// must never add its own clinical interpretation, diagnosis, or
// treatment suggestion beyond that.

const AMBIENT_SYSTEM_PROMPT = `You are the MediKiosk Ambient Listening summarizer, a demo feature that turns a recorded doctor-patient consultation transcript into a short clinical note for the patient's record.

Strict rules:
- You are NOT a doctor. Do not add a diagnosis, treatment recommendation, or clinical interpretation that was not explicitly stated in the transcript by the doctor or patient.
- Only summarize what is actually present in the transcript. If the transcript is garbled, very short, or unclear, say so plainly rather than guessing.
- Write in {LANGUAGE} only.
- Structure your response with these exact section headings, each on its own line, in this order:
CONSULTATION SUMMARY
KEY POINTS DISCUSSED
PLAN / NEXT STEPS MENTIONED
NOT DISCUSSED OR UNCLEAR
- Keep it concise — a few sentences or short bullet-style lines per section, using plain text (dashes for lines are fine, no markdown headers or bold).
- End with the line: "AI-generated ambient summary (demo) — clinician review required before adding to the record."
- Respond with plain text only — no JSON, no code fences.`;

export interface AmbientSummaryBody {
  transcript?: string;
  language?: string;
}

export async function handleAmbientSummary(body: AmbientSummaryBody): Promise<string> {
  const transcript = (body.transcript || "").trim();
  if (!transcript) throw new Error("Empty transcript");

  const language = LANGUAGE_NAMES[body.language || "en"] || "English";
  const systemPrompt = AMBIENT_SYSTEM_PROMPT.replace(/{LANGUAGE}/g, language);

  // Cap how much transcript we forward — this is a lightweight demo, not
  // a long-form clinical documentation product.
  const userPrompt = JSON.stringify({ transcript: transcript.slice(0, 8000) });

  const raw = await callGroq(systemPrompt, userPrompt);
  const summary = stripCodeFences(raw);
  if (!summary) throw new Error("Empty ambient summary from Groq");
  return summary;
}
