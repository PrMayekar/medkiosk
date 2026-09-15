import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleSummary, isRequestTooLarge, type SummaryBody } from "../lib/groqServer";

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

    const body: SummaryBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const summary = await handleSummary(body);
    res.status(200).json({ summary });
  } catch (err) {
    console.error("[/api/summary] error:", err instanceof Error ? err.message : err);
    res.status(502).json({ error: "AI summary temporarily unavailable" });
  }
}
