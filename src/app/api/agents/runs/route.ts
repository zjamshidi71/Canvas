import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { runWeekly } from "@/lib/agents/collector-digest";

export const maxDuration = 300;

// GET /api/agents/runs — latest agent runs for the admin review page
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { data, error } = await getSupabaseAdmin()
    .from("agent_runs")
    .select("id, status, subject, html, picks, log, created_at, sent_at, collectors(name, email)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ runs: data });
}

// POST /api/agents/runs — "Run agents now" button (always saves drafts)
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const results = await runWeekly({ dryRun: true });
  return Response.json({ results });
}
