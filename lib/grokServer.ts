/**
 * Shared server-side helper for talking to xAI's Grok API. This is a
 * SEPARATE integration from lib/groqServer.ts (Groq, used for question
 * generation and the clinical summary). Grok is used for exactly one
 * narrow purpose: classifying whether a free-text patient response is
 * relevant to the question that was asked. It never diagnoses,
 * interprets symptoms, or makes any clinical judgement.
 *
 * IMPORTANT: this file only ever runs server-side. XAI_API_KEY must
 * never be read from a VITE_-prefixed variable or shipped to the browser.
 */

const XAI_ENDPOINT = "https://api.x.ai/v1/chat/completions";

// Sensible default if XAI_MODEL isn't set — a fast, low-latency Grok
// model, appropriate for a lightweight relevance check. Override via the
// XAI_MODEL environment variable; check https://docs.x.ai/docs/models for
// the current catalog.
const DEFAULT_MODEL = "grok-4-fast";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
};

export interface ClassifyBody {
  question?: string;
  response?: string;
  language?: string;
  field?: string;
  pathway?: string | null;
}

export interface ClassifyResult {
  relevant: boolean;
  confidence: number;
  reason: string;
  cleanedResponse: string;
}

const CLASSIFIER_SYSTEM_PROMPT = `You are a narrow response-relevance checker for a patient intake kiosk called MediKiosk.

Your ONLY task: decide whether the patient's free-text response reasonably answers the question that was asked.

Strict rules:
- You are NOT a doctor. Never diagnose, interpret symptoms, assess severity, or make any clinical judgement.
- Do not comment on whether a symptom sounds serious.
- Judge relevance only: does this response plausibly attempt to answer this specific question, in any language ({LANGUAGE} or otherwise, including mixed language or transliterated text)?
- Greetings, filler ("hi", "hello", "ok"), off-topic remarks, test input, or confusion ("what do you mean") are NOT relevant.
- Short but on-topic answers (e.g. "yes, amlodipine", "no known allergies", "3 days") ARE relevant.
- If the response is empty or only whitespace, it is NOT relevant.
- "cleanedResponse" should be the patient's response lightly trimmed of filler words (e.g. "um", "so") but otherwise UNCHANGED — never invent or add information. If irrelevant, cleanedResponse must be an empty string.
- Respond with ONLY a single JSON object and nothing else — no markdown, no commentary, no code fences. Match exactly this shape:
{"relevant": boolean, "confidence": number between 0 and 1, "reason": string (one short sentence), "cleanedResponse": string}`;

async function callGrok(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY not configured");
  }
  const model = process.env.XAI_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(XAI_ENDPOINT, {
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
        temperature: 0,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`xAI API error ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Empty response from Grok");
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

/** Handles POST /api/classify logic. Throws on any failure — caller decides the fallback. */
export async function handleClassify(body: ClassifyBody): Promise<ClassifyResult> {
  const question = (body.question || "").trim();
  const response = (body.response || "").trim();

  if (!question || !response) {
    // Nothing to classify — treat as irrelevant rather than calling the API.
    return { relevant: false, confidence: 1, reason: "Empty question or response.", cleanedResponse: "" };
  }

  const language = LANGUAGE_NAMES[body.language || "en"] || "English";
  const systemPrompt = CLASSIFIER_SYSTEM_PROMPT.replace(/{LANGUAGE}/g, language);

  const userPrompt = JSON.stringify({
    question,
    response,
    field: body.field || "unknown",
    pathway: body.pathway || "general",
  });

  const raw = await callGrok(systemPrompt, userPrompt);
  const cleaned = stripCodeFences(raw);
  const parsed = JSON.parse(cleaned);

  if (
    typeof parsed.relevant !== "boolean" ||
    typeof parsed.confidence !== "number" ||
    typeof parsed.reason !== "string" ||
    typeof parsed.cleanedResponse !== "string"
  ) {
    throw new Error("Malformed classification JSON from Grok");
  }

  return parsed;
}

/** Basic request-size guard shared by both platforms. */
export function isClassifyRequestTooLarge(rawBody: string): boolean {
  return rawBody.length > 10_000;
}
