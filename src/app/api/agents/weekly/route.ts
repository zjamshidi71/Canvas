import { runWeekly } from "@/lib/agents/collector-digest";

// ---------------------------------------------------------------------------
// GET /api/agents/weekly — called by Vercel Cron every Monday (see vercel.json).
// Vercel sends "Authorization: Bearer <CRON_SECRET>", so strangers can't
// trigger the (paid) AI pipeline.
//
// Safety default: saves DRAFTS for an admin to review. Set AGENT_AUTO_SEND=true
// in Vercel to let the Sender email collectors automatically.
// ---------------------------------------------------------------------------
export const maxDuration = 300;

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await runWeekly({ dryRun: process.env.AGENT_AUTO_SEND !== "true" });
  return Response.json({ results: results.map(({ collector, status }) => ({ collector, status })) });
}
