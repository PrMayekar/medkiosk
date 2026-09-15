import type { Handler } from "@netlify/functions";
import { handleAmbientSummary, isRequestTooLarge, type AmbientSummaryBody } from "../../lib/groqServer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const rawBody = event.body || "{}";
    if (isRequestTooLarge(rawBody)) {
      return { statusCode: 413, body: JSON.stringify({ error: "Request too large" }) };
    }

    const body: AmbientSummaryBody = JSON.parse(rawBody);
    const summary = await handleAmbientSummary(body);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    };
  } catch (err) {
    console.error("[netlify/ambient-summary] error:", err instanceof Error ? err.message : err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Ambient summary temporarily unavailable" }),
    };
  }
};
