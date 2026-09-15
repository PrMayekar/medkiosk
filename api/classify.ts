import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleClassify, isClassifyRequestTooLarge, type ClassifyBody } from "../lib/grokServer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    if (isClassifyRequestTooLarge(rawBody)) {
      res.status(413).json({ error: "Request too large" });
      return;
    }

    const body: ClassifyBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const result = await handleClassify(body);
    res.status(200).json(result);
  } catch (err) {
    // Never leak internal error details or the API key — the frontend
    // already treats any non-2xx response as "let the answer through".
    console.error("[/api/classify] error:", err instanceof Error ? err.message : err);
    res.status(502).json({ error: "Relevance classification temporarily unavailable" });
  }
}
