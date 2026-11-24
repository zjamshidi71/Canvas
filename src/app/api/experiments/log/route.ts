import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { EXPERIMENTS } from "@/lib/experiments";

// ---------------------------------------------------------------------------
// POST /api/experiments/log
// Body: { experiment: string, variant: "A"|"B", event: "view"|"conversion", sessionId: string }
//
// Teaching note — "never trust the client": the browser could send ANY
// string as `experiment`. We check it against the same allow-list the
// browser uses, so garbage data (or a prankster in DevTools) can't pollute
// our results table.
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { experiment, variant, event, sessionId } = body ?? {};

  const validExperiment = EXPERIMENTS.includes(experiment);
  const validVariant = variant === "A" || variant === "B";
  const validEvent = event === "view" || event === "conversion";
  const validSession = typeof sessionId === "string" && sessionId.length > 0 && sessionId.length < 100;

  if (!validExperiment || !validVariant || !validEvent || !validSession) {
    return Response.json({ error: "Invalid experiment event." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("experiment_events")
    .insert({ experiment, variant, event, session_id: sessionId });

  if (error) {
    console.error("Failed to log experiment event:", error);
    return Response.json({ error: "Could not log event." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
