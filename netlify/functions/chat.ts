import type { Handler } from "@netlify/functions";
import { handleChat, isRequestTooLarge, type ChatBody } from "../../lib/groqServer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const rawBody = event.body || "{}";
    if (isRequestTooLarge(rawBody)) {
      return { statusCode: 413, body: JSON.stringify({ error: "Request too large" }) };
    }

    const body: ChatBody = JSON.parse(rawBody);
    const question = await handleChat(body);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question),
    };
  } catch (err) {
    console.error("[netlify/chat] error:", err instanceof Error ? err.message : err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "AI assistance temporarily unavailable" }),
    };
  }
};
