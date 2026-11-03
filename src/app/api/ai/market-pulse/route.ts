import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// POST /api/ai/market-pulse
// Headers: Authorization: Bearer <supabase access token>  (admin only)
// Body:    { topic: string }  e.g. "abstract painting" or "buying original art"
// Returns: MarketPulseReport
//
// Teaching notes:
//   • YouTube Data API v3 (free quota) — set YOUTUBE_API_KEY in .env.local.
//   • We pull the top 10 recent videos for the topic, then collect up to 20
//     comments per video, and hand everything to the LLM for analysis.
//   • The LLM never surfs the web — it only sees data we explicitly pass it,
//     so every quote in the report is traceable to a real comment.
//   • Only admin users may call this route (expensive YouTube quota + AI cost).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const ActionSchema = z.object({
  type: z.enum(["feature_collection", "editorial_idea", "artist_advice"]),
  suggestion: z.string().describe("One concrete action sentence."),
  rationale: z.string().describe("One sentence explaining why, citing audience signals."),
});

const InsightSchema = z.object({
  theme: z.string().describe("Short label, e.g. 'Desire for authenticity'"),
  evidence: z
    .array(z.string().max(160))
    .max(3)
    .describe("Up to 3 real quoted comment snippets (verbatim, under 160 chars each)"),
  implication: z.string().describe("One sentence: what this means for Canvas."),
});

const MarketPulseReportSchema = z.object({
  summary: z
    .string()
    .describe("2–3 sentence plain-English summary of what the audience cares about right now."),
  loves: z
    .array(InsightSchema)
    .max(3)
    .describe("Things the audience clearly loves or praises."),
  questions: z
    .array(InsightSchema)
    .max(3)
    .describe("Recurring questions or uncertainties buyers have."),
  priceObjections: z
    .array(InsightSchema)
    .max(2)
    .describe("Comments about price, value, or affordability."),
  actions: z
    .array(ActionSchema)
    .max(5)
    .describe("Concrete actions for Canvas based on the insights."),
});

// ---------------------------------------------------------------------------
// YouTube helpers
// ---------------------------------------------------------------------------
interface YTVideo {
  videoId: string;
  title: string;
  channelTitle: string;
}

interface YTComment {
  videoTitle: string;
  text: string;
  likeCount: number;
}

async function fetchTopVideos(topic: string, apiKey: string): Promise<YTVideo[]> {
  const params = new URLSearchParams({
    part: "snippet",
    q: topic,
    type: "video",
    maxResults: "10",
    order: "relevance",
    relevanceLanguage: "en",
    videoCategoryId: "27", // Education — catches art market content well
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube search failed (${res.status}): ${text}`);
  }
  const json = await res.json();

  return (json.items ?? [])
    .filter((item: Record<string, unknown>) => (item as { id?: { videoId?: string } }).id?.videoId)
    .map((item: Record<string, unknown>) => {
      const typedItem = item as {
        id: { videoId: string };
        snippet: { title: string; channelTitle: string };
      };
      return {
        videoId: typedItem.id.videoId,
        title: typedItem.snippet.title,
        channelTitle: typedItem.snippet.channelTitle,
      };
    });
}

async function fetchComments(
  videoId: string,
  videoTitle: string,
  apiKey: string,
  maxResults = 20
): Promise<YTComment[]> {
  const params = new URLSearchParams({
    part: "snippet",
    videoId,
    maxResults: String(maxResults),
    order: "relevance",
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?${params}`,
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return []; // comments disabled on some videos — skip gracefully

  const json = await res.json();
  return (json.items ?? []).map((item: Record<string, unknown>) => {
    const typedItem = item as {
      snippet: {
        topLevelComment: {
          snippet: { textDisplay: string; likeCount: number };
        };
      };
    };
    return {
      videoTitle,
      text: typedItem.snippet.topLevelComment.snippet.textDisplay
        .replace(/<[^>]+>/g, "")   // strip HTML
        .trim()
        .slice(0, 300),
      likeCount: typedItem.snippet.topLevelComment.snippet.likeCount ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  // ---- 1. Admin-only gate ----
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const { data: auth } = token
    ? await getSupabaseAdmin().auth.getUser(token)
    : { data: { user: null } };

  const ADMIN_EMAILS = ["admin@canvas.art", "zjamshidi@mtroyal.ca"];
  if (!auth.user || !ADMIN_EMAILS.includes(auth.user.email ?? "")) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  // ---- 2. Validate input ----
  const body = await request.json().catch(() => null);
  const topic = body?.topic?.trim();
  if (!topic || topic.length < 3) {
    return Response.json({ error: "Provide a topic of at least 3 characters." }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "YOUTUBE_API_KEY is not configured. Add it to .env.local and restart." },
      { status: 503 }
    );
  }

  // ---- 3. Fetch YouTube data ----
  let videos: YTVideo[] = [];
  try {
    videos = await fetchTopVideos(topic, apiKey);
  } catch (err) {
    console.error("YouTube search error:", err);
    return Response.json({ error: "YouTube search failed. Check your API key." }, { status: 502 });
  }

  if (videos.length === 0) {
    return Response.json({ error: "No YouTube videos found for that topic." }, { status: 404 });
  }

  // Fetch comments in parallel (skip videos where comments are disabled)
  const commentArrays = await Promise.all(
    videos.map((v) => fetchComments(v.videoId, v.title, apiKey).catch(() => []))
  );
  const allComments: YTComment[] = commentArrays
    .flat()
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 80); // cap at 80 most-liked comments to stay within token budget

  if (allComments.length === 0) {
    return Response.json({
      error: "No comments found for these videos. Try a broader topic.",
    }, { status: 404 });
  }

  // ---- 4. Build LLM prompt ----
  const videoList = videos
    .slice(0, 10)
    .map((v, i) => `[${i + 1}] "${v.title}" — ${v.channelTitle}`)
    .join("\n");

  const commentBlock = allComments
    .map((c, i) => `[${i + 1}] (👍 ${c.likeCount}) from video "${c.videoTitle}": ${c.text}`)
    .join("\n");

  const prompt =
    `Topic searched on YouTube: "${topic}"\n\n` +
    `Top videos found:\n${videoList}\n\n` +
    `Most-liked comments (${allComments.length} total):\n${commentBlock}\n\n` +
    `Analyse these comments to produce the market-pulse report for Canvas, ` +
    `an online art gallery. Use verbatim comment snippets as evidence. ` +
    `Focus only on what the data shows — never invent insights.`;

  // ---- 5. Ask the model ----
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: MarketPulseReportSchema }),
    instructions:
      "You are a market-research analyst for Canvas, an online art gallery. " +
      "Extract what real buyers and art enthusiasts say about the given topic. " +
      "Quote comment snippets verbatim (under 160 chars). " +
      "Every insight must be backed by at least one quoted comment. " +
      "Never invent data not present in the comments.",
    messages: [{ role: "user", content: prompt }],
  }).catch((err) => {
    console.error("Market pulse AI failed:", err);
    return { output: null };
  });

  if (!output) {
    return Response.json({ error: "AI analysis failed. Please try again." }, { status: 502 });
  }

  return Response.json(output);
}

