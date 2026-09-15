import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleChat, isRequestTooLarge, type ChatBody } from "../lib/groqServer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    if (isRequestTooLarge(rawBody)) {
      res.status(413).json({ error: "Request too large" });
      return;
    }

    const body: ChatBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const question = await handleChat(body);
    res.status(200).json(question);
  } catch (err) {
    // Never leak internal error details or the API key to the client —
    // the frontend already has a local fallback for any non-2xx response.
    console.error("[/api/chat] error:", err instanceof Error ? err.message : err);
    res.status(502).json({ error: "AI assistance temporarily unavailable" });
  }
}
