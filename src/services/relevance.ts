import type { LanguageCode, Pathway } from "../types/intake";

/**
 * Client-side service for the Grok-powered response relevance classifier.
 * This is a SEPARATE integration from services/groq.ts (question
 * generation + summary, which uses Groq). The browser never talks to
 * xAI directly — this only calls our own /api/classify serverless route.
 *
 * Per the "don't call the AI for every action" rule, this should only be
 * invoked for free-text answers to real interview questions — never for
 * button/select choices, navigation, or language/pathway selection.
 */

export interface ClassifyParams {
  question: string;
  response: string;
  language: LanguageCode;
  field: string;
  pathway: Pathway | null;
}

export interface ClassifyResult {
  relevant: boolean;
  confidence: number;
  reason: string;
  cleanedResponse: string;
  /** False whenever the classifier itself was unreachable/misconfigured — the caller should let the answer through. */
  classifierAvailable: boolean;
}

function isValidResult(value: unknown): value is Omit<ClassifyResult, "classifierAvailable"> {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.relevant === "boolean" &&
    typeof v.confidence === "number" &&
    typeof v.reason === "string" &&
    typeof v.cleanedResponse === "string"
  );
}

export async function classifyRelevance(params: ClassifyParams): Promise<ClassifyResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Classify API returned ${res.status}`);

    const data = await res.json();
    if (!isValidResult(data)) throw new Error("Malformed classify response");

    return { ...data, classifierAvailable: true };
  } catch {
    // Graceful fallback: never block the intake because the classifier
    // is unavailable. Treat the response as relevant and let it through.
    return {
      relevant: true,
      confidence: 0,
      reason: "Classifier unavailable — response accepted without AI review.",
      cleanedResponse: params.response,
      classifierAvailable: false,
    };
  }
}
