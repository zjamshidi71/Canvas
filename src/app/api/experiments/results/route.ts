import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// GET /api/experiments/results — admin only.
//
// We fetch the raw rows and count them here in code rather than in SQL.
// For a class-sized dataset this is simple and easy to read; a production
// app with millions of rows would use a database aggregate query instead.
// ---------------------------------------------------------------------------
interface Row {
  experiment: string;
  variant: "A" | "B";
  views: number;
  conversions: number;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { data, error } = await getSupabaseAdmin()
    .from("experiment_events")
    .select("experiment, variant, event");

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = new Map<string, Row>();
  for (const e of data ?? []) {
    const key = `${e.experiment}:${e.variant}`;
    const row = rows.get(key) ?? { experiment: e.experiment, variant: e.variant, views: 0, conversions: 0 };
    if (e.event === "view") row.views++;
    else row.conversions++;
    rows.set(key, row);
  }

  return Response.json({ rows: [...rows.values()] });
}
