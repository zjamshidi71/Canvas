import { requireAdmin } from "@/lib/admin";
import { sendRun } from "@/lib/agents/collector-digest";

// POST /api/agents/send — admin approved a draft: the Sender emails it
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { runId } = await request.json();
  const { error } = await sendRun(runId);
  return error ? Response.json({ error }, { status: 400 }) : Response.json({ ok: true });
}
