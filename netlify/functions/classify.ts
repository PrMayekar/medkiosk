import type { Handler } from "@netlify/functions";
import { handleClassify, isClassifyRequestTooLarge, type ClassifyBody } from "../../lib/grokServer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const rawBody = event.body || "{}";
    if (isClassifyRequestTooLarge(rawBody)) {
      return { statusCode: 413, body: JSON.stringify({ error: "Request too large" }) };
    }

    const body: ClassifyBody = JSON.parse(rawBody);
    const result = await handleClassify(body);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("[netlify/classify] error:", err instanceof Error ? err.message : err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Relevance classification temporarily unavailable" }),
    };
  }
};
