import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { escapeHtml, money, sendEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// Weekly collector digest — a four-step multi-agent pipeline.
//
//   1. Scout    code shortlists unseen works → AI picks 3 that fit the taste
//   2. Writer   AI writes the words only (subject, intro, one line per pick)
//   3. Checker  code verifies facts; a second AI reviews tone & invented claims
//               → sends feedback back to the Writer (max 2 retries)
//   4. Sender   code builds the email (titles, prices, links come from the
//               DATABASE, never from the AI), checks consent, sends or saves a
//               draft, and records what was sent so it's never repeated.
//
// Teaching idea: use AI where JUDGMENT is needed, code where CORRECTNESS is.
// ---------------------------------------------------------------------------

const SITE_URL = process.env.SITE_URL ?? "https://canvas-ten-virid.vercel.app";
const MAX_WRITER_ATTEMPTS = 3;

interface ArtworkRow {
  id: string;
  slug: string;
  title: string;
  medium: string;
  price: number;
  year: number;
  description: string;
  image_url: string;
  collections: string[];
  artists: { name: string } | null;
}

interface Collector {
  id: string;
  name: string;
  email: string;
  opted_in: boolean;
  unsubscribe_token: string;
}

export interface LogEntry {
  agent: "Scout" | "Writer" | "Checker" | "Sender";
  summary: string;
  detail?: unknown;
}

export interface RunResult {
  collector: string;
  status: "draft" | "sent" | "skipped" | "failed";
  runId?: string;
  log: LogEntry[];
}

const describe = (a: ArtworkRow) =>
  `${a.id}: "${a.title}" by ${a.artists?.name ?? "unknown"} — ${a.medium}, $${a.price}, ${a.year}. ` +
  `Collections: ${(a.collections ?? []).join(", ") || "none"}. ${a.description.slice(0, 160)}`;

// ======================== 1. SCOUT =========================================
async function scout(collector: Collector, log: LogEntry[]) {
  const db = getSupabaseAdmin();
  const [{ data: artworks }, { data: saved }, { data: sent }, { data: orders }] = await Promise.all([
    db.from("artworks").select("id, slug, title, medium, price, year, description, image_url, collections, artists(name)"),
    db.from("saved_artworks").select("artwork_id").eq("collector_id", collector.id),
    db.from("recommendations_sent").select("artwork_id").eq("collector_id", collector.id),
    db.from("orders").select("status, order_items(artwork_id)").eq("email", collector.email).neq("status", "pending"),
  ]);

  const all = (artworks ?? []) as unknown as ArtworkRow[];
  const savedIds = new Set((saved ?? []).map((r) => r.artwork_id));
  const purchasedIds = new Set(
    (orders ?? []).flatMap((o) => (o.order_items as { artwork_id: string }[]).map((i) => i.artwork_id))
  );
  const sentIds = new Set((sent ?? []).map((r) => r.artwork_id));
  const taste = all.filter((a) => savedIds.has(a.id) || purchasedIds.has(a.id));

  // Code does the rules: never re-recommend saved, bought, or already-sent works
  const candidates = all.filter((a) => !savedIds.has(a.id) && !purchasedIds.has(a.id) && !sentIds.has(a.id));
  log.push({
    agent: "Scout",
    summary: `Shortlisted ${candidates.length} unseen works (excluded ${savedIds.size} saved, ${purchasedIds.size} bought, ${sentIds.size} already sent)`,
  });
  if (!taste.length || candidates.length < 1) return { taste, picks: [] as { artwork: ArtworkRow; reason: string }[] };

  // AI does the judgment: which unseen works fit this collector's taste?
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({
      schema: z.object({
        picks: z
          .array(z.object({ artworkId: z.string(), reason: z.string().describe("One sentence linking it to a saved work") }))
          .min(1)
          .max(3),
      }),
    }),
    instructions:
      "You are the Scout for Canvas, an online art gallery. Pick the 3 candidate artworks that best fit the " +
      "collector's taste, based on medium, style, price range and artist. Only use IDs from the candidate list.",
    prompt:
      `Collector ${collector.name} saved or bought:\n${taste.map(describe).join("\n")}\n\n` +
      `Candidates:\n${candidates.map(describe).join("\n")}`,
  });

  const byId = new Map(candidates.map((a) => [a.id, a]));
  const picks = output.picks
    .filter((p, i, arr) => byId.has(p.artworkId) && arr.findIndex((q) => q.artworkId === p.artworkId) === i)
    .map((p) => ({ artwork: byId.get(p.artworkId)!, reason: p.reason }));

  log.push({
    agent: "Scout",
    summary: `Picked ${picks.length}: ${picks.map((p) => p.artwork.title).join(", ")}`,
    detail: picks.map((p) => ({ title: p.artwork.title, reason: p.reason })),
  });
  return { taste, picks };
}

// ======================== 2. WRITER ========================================
const DraftSchema = z.object({
  subject: z.string().describe("Under 70 characters, personal, mentions a saved work"),
  intro: z.string().describe("2 sentences, warm, addresses the collector by first name"),
  blurbs: z.array(z.object({ artworkId: z.string(), text: z.string().describe("One sentence about why it fits") })),
  signoff: z.string(),
});
type Draft = z.infer<typeof DraftSchema>;

async function writer(collector: Collector, taste: ArtworkRow[], picks: { artwork: ArtworkRow; reason: string }[], feedback: string[]) {
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: DraftSchema }),
    instructions:
      "You are the Writer for Canvas, an online art gallery. Write a short, warm, personal recommendation email. " +
      "Write ONLY the words: never include prices, links, or numbers — the system adds those from the database. " +
      "Only state facts given to you. Be friendly, never pushy.",
    prompt:
      `Collector: ${collector.name}\nThey saved: ${taste.map((a) => `"${a.title}"`).join(", ")}\n\n` +
      `Recommended works (write one blurb for EACH, using these exact artworkIds):\n` +
      picks.map((p) => `${describe(p.artwork)}\nScout's reason: ${p.reason}`).join("\n\n") +
      (feedback.length ? `\n\nThe Checker rejected your last draft. Fix these issues:\n- ${feedback.join("\n- ")}` : ""),
  });
  return output;
}

// ======================== 3. CHECKER =======================================
async function checker(draft: Draft, collector: Collector, picks: { artwork: ArtworkRow }[]): Promise<string[]> {
  const issues: string[] = [];
  const pickIds = new Set(picks.map((p) => p.artwork.id));

  // Code checks: exact, free, reliable
  for (const b of draft.blurbs) if (!pickIds.has(b.artworkId)) issues.push(`Unknown artworkId "${b.artworkId}"`);
  for (const id of pickIds) if (!draft.blurbs.some((b) => b.artworkId === id)) issues.push(`Missing blurb for ${id}`);
  const allText = [draft.subject, draft.intro, draft.signoff, ...draft.blurbs.map((b) => b.text)].join(" ");
  if (/\$|https?:\/\/|www\./i.test(allText)) issues.push("Draft contains a price or link — those are added by the system");
  if (draft.subject.length > 80) issues.push("Subject is longer than 80 characters");
  if (issues.length) return issues;

  // AI check: judgment about tone and invented facts
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({
      schema: z.object({ approved: z.boolean(), issues: z.array(z.string()) }),
    }),
    instructions:
      "You are the Checker for Canvas. Compare the email draft to the FACTS. Reject it if it invents facts " +
      "(artist biography, sizes, awards, scarcity), uses the wrong name, or is pushy (fake urgency). Be strict but brief.",
    prompt:
      `FACTS\nCollector: ${collector.name}\n${picks.map((p) => describe(p.artwork)).join("\n")}\n\n` +
      `DRAFT\n${JSON.stringify(draft, null, 2)}`,
  });
  return output.approved ? [] : output.issues.length ? output.issues : ["Rejected without a reason"];
}

// ======================== 4. SENDER ========================================
function buildHtml(collector: Collector, draft: Draft, picks: { artwork: ArtworkRow }[]) {
  const cards = picks
    .map(({ artwork: a }) => {
      const blurb = draft.blurbs.find((b) => b.artworkId === a.id)?.text ?? "";
      const url = `${SITE_URL}/artwork/${a.slug}`;
      return `
        <tr><td style="padding:16px 0;border-bottom:1px solid #eee;">
          <a href="${url}"><img src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.title)}" width="520" style="width:100%;max-width:520px;display:block;"></a>
          <p style="margin:12px 0 2px;font-family:Georgia,serif;font-size:18px;">${escapeHtml(a.title)}</p>
          <p style="margin:0;color:#6b6b6b;font-size:14px;">${escapeHtml(a.artists?.name ?? "")} · ${money(Number(a.price))}</p>
          <p style="margin:8px 0;font-size:15px;">${escapeHtml(blurb)}</p>
          <a href="${url}" style="font-size:13px;color:#1a1a1a;">View artwork →</a>
        </td></tr>`;
    })
    .join("");
  return `
    <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;">
      <h1 style="font-family:Georgia,serif;font-weight:normal;">Canvas</h1>
      <p style="font-size:15px;line-height:1.5;">${escapeHtml(draft.intro)}</p>
      <table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
      <p style="font-size:15px;">${escapeHtml(draft.signoff)}</p>
      <p style="font-size:12px;color:#999;margin-top:32px;">
        You're receiving this because you opted in to recommendations from Canvas.
        <a href="${SITE_URL}/api/unsubscribe?token=${collector.unsubscribe_token}" style="color:#999;">Unsubscribe</a>
      </p>
    </div>`;
}

/** Sends a saved draft (used by the weekly job and the admin "Send" button). */
export async function sendRun(runId: string): Promise<{ error?: string }> {
  const db = getSupabaseAdmin();
  const { data: run } = await db
    .from("agent_runs")
    .select("id, collector_id, status, subject, html, picks, log, collectors(email, opted_in)")
    .eq("id", runId)
    .single();
  if (!run || run.status !== "draft") return { error: "Draft not found or already sent" };
  const collector = run.collectors as unknown as { email: string; opted_in: boolean };
  if (!collector.opted_in) return { error: "Collector has not opted in (CASL consent)" };

  // Until a domain is verified in Resend, all agent emails go to a test inbox
  const to = process.env.AGENT_TEST_RECIPIENT || collector.email;
  const { error } = await sendEmail(to, run.subject!, run.html!);
  if (error) return { error };

  const picks = run.picks as { artworkId: string }[];
  await db.from("recommendations_sent").insert(
    picks.map((p) => ({ collector_id: run.collector_id, artwork_id: p.artworkId, run_id: run.id }))
  );
  await db
    .from("agent_runs")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      log: [...(run.log as LogEntry[]), { agent: "Sender", summary: `Sent to ${to} and recorded ${picks.length} recommendations` }],
    })
    .eq("id", run.id);
  return {};
}

// ======================== THE PIPELINE =====================================
/** Runs Scout → Writer ⇄ Checker → Sender for one collector. */
export async function runForCollector(collector: Collector, { dryRun }: { dryRun: boolean }): Promise<RunResult> {
  const db = getSupabaseAdmin();
  const log: LogEntry[] = [];
  const save = async (status: RunResult["status"], fields: Record<string, unknown> = {}) => {
    const { data } = await db
      .from("agent_runs")
      .insert({ collector_id: collector.id, status, log, ...fields })
      .select("id")
      .single();
    return { collector: collector.name, status, runId: data?.id, log };
  };

  try {
    if (!collector.opted_in) {
      log.push({ agent: "Sender", summary: "Skipped: no consent to email (CASL)" });
      return save("skipped");
    }

    // 1. Scout
    const { taste, picks } = await scout(collector, log);
    if (!picks.length) {
      log.push({ agent: "Scout", summary: "Nothing suitable to recommend this week" });
      return save("skipped");
    }

    // 2 ⇄ 3. Writer and Checker loop
    let draft: Draft | null = null;
    let feedback: string[] = [];
    for (let attempt = 1; attempt <= MAX_WRITER_ATTEMPTS; attempt++) {
      const candidate = await writer(collector, taste, picks, feedback);
      log.push({ agent: "Writer", summary: `Draft ${attempt}: "${candidate.subject}"`, detail: candidate });
      feedback = await checker(candidate, collector, picks);
      if (!feedback.length) {
        log.push({ agent: "Checker", summary: `Approved draft ${attempt}` });
        draft = candidate;
        break;
      }
      log.push({ agent: "Checker", summary: `Rejected draft ${attempt}`, detail: feedback });
    }
    if (!draft) {
      log.push({ agent: "Checker", summary: `Gave up after ${MAX_WRITER_ATTEMPTS} drafts — needs a human` });
      return save("failed");
    }

    // 4. Sender: build the email from DATABASE facts + approved words
    const html = buildHtml(collector, draft, picks);
    log.push({ agent: "Sender", summary: dryRun ? "Saved as draft for review" : "Sending now" });
    const result = await save("draft", {
      subject: draft.subject,
      html,
      picks: picks.map((p) => ({ artworkId: p.artwork.id, title: p.artwork.title, reason: p.reason })),
    });
    if (dryRun || !result.runId) return result;

    const { error } = await sendRun(result.runId);
    if (error) {
      await db.from("agent_runs").update({ status: "failed" }).eq("id", result.runId);
      return { ...result, status: "failed", log: [...log, { agent: "Sender", summary: `Send failed: ${error}` }] };
    }
    return { ...result, status: "sent" };
  } catch (err) {
    log.push({ agent: "Sender", summary: `Pipeline error: ${err instanceof Error ? err.message : String(err)}` });
    return save("failed");
  }
}

/** The weekly job: one pipeline run per collector, one after another. */
export async function runWeekly({ dryRun }: { dryRun: boolean }): Promise<RunResult[]> {
  const { data } = await getSupabaseAdmin()
    .from("collectors")
    .select("id, name, email, opted_in, unsubscribe_token")
    .order("created_at");
  const results: RunResult[] = [];
  for (const collector of (data ?? []) as Collector[]) {
    results.push(await runForCollector(collector, { dryRun }));
  }
  return results;
}
