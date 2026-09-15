import type { LanguageCode } from "../types/intake";

/**
 * Client-side service for the Ambient Listening demo feature. Calls our
 * own /api/ambient-summary route (Groq, server-side key only). If Groq is
 * unavailable, falls back to a simple local summary built directly from
 * the transcript so the demo never dead-ends.
 */

export interface AmbientSummaryResult {
  summary: string;
  aiAvailable: boolean;
}

export async function generateAmbientSummary(transcript: string, language: LanguageCode): Promise<AmbientSummaryResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("/api/ambient-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, language }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Ambient summary API returned ${res.status}`);
    const data = await res.json();
    if (typeof data.summary !== "string" || !data.summary.trim()) {
      throw new Error("Malformed ambient summary response");
    }
    return { summary: data.summary, aiAvailable: true };
  } catch {
    return { summary: buildFallbackAmbientSummary(transcript), aiAvailable: false };
  }
}

function buildFallbackAmbientSummary(transcript: string): string {
  const trimmed = transcript.trim();
  const preview = trimmed.length > 600 ? `${trimmed.slice(0, 600)}...` : trimmed;
  return [
    "CONSULTATION SUMMARY",
    "AI summarization is temporarily unavailable — showing the captured transcript instead.",
    "",
    "KEY POINTS DISCUSSED",
    preview || "No transcript captured.",
    "",
    "PLAN / NEXT STEPS MENTIONED",
    "Not available in offline mode.",
    "",
    "NOT DISCUSSED OR UNCLEAR",
    "This summary was generated locally, without AI review.",
    "",
    "AI-generated ambient summary (demo) — clinician review required before adding to the record.",
  ].join("\n");
}
