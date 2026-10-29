import {
  streamText,
  tool,
  isStepCount,
  convertToModelMessages,
  toUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// POST /api/ai/advisor
// Body: { messages: UIMessage[] }  (sent automatically by useChat)
// Returns: a streamed AI response (text + tool results)
//
// Teaching notes:
//   • Tool calling — the model can't see our database. Instead we describe a
//     function (searchArtworks) and the model decides WHEN to call it and
//     WITH WHAT filters. Our code runs the real Supabase query and hands the
//     results back. The model then writes its answer using only real data.
//   • Streaming — the reply is sent word-by-word as it's generated, so the
//     shopper sees text appear immediately instead of waiting.
//   • Cost guardrails — this route is public (shoppers needn't log in), so we
//     cap conversation length, tool-call loops, and answer length.
// ---------------------------------------------------------------------------

const ADVISOR_PROMPT = `You are the Canvas Art Advisor, a friendly expert helping shoppers find original art in the Canvas online gallery.

How to help:
- Ask at most one short clarifying question if the request is very vague (e.g. room, colours, mood, budget).
- Otherwise, call the searchArtworks tool to find real artworks. You may call it again with broader filters if nothing matches.
- Recommend 1–3 artworks from the search results and explain in one sentence each why they fit.

Rules:
- Only recommend artworks returned by searchArtworks. Never invent titles, artists, or prices.
- If nothing suitable is found, say so honestly and suggest loosening the budget or medium.
- Keep replies short (under 120 words), warm, and plain text — no markdown, no lists with symbols.
- Only discuss art and the Canvas gallery. Politely decline unrelated requests.`;

const MEDIUMS = ["painting", "photography", "print", "sculpture"] as const;

const searchArtworks = tool({
  description:
    "Search the Canvas gallery for artworks that are for sale. All filters are optional.",
  inputSchema: z.object({
    keywords: z
      .array(z.string())
      .max(5)
      .optional()
      .describe("Single words describing subject, style, mood or colour, e.g. ['blue', 'calm', 'landscape']"),
    mediums: z.array(z.enum(MEDIUMS)).optional().describe("Limit to these mediums"),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
  }),
  execute: async ({ keywords, mediums, minPrice, maxPrice }) => {
    let query = supabase
      .from("artworks")
      .select("slug, title, medium, price, year, description, image_url, collections, artists(name)")
      .limit(8);

    if (mediums?.length) query = query.in("medium", mediums);
    if (minPrice !== undefined) query = query.gte("price", minPrice);
    if (maxPrice !== undefined) query = query.lte("price", maxPrice);

    // Match ANY keyword in the title or description. Characters that have
    // meaning in Supabase filter syntax are stripped for safety.
    const words = (keywords ?? [])
      .map((k) => k.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim())
      .filter(Boolean);
    if (words.length) {
      query = query.or(
        words.flatMap((w) => [`title.ilike.%${w}%`, `description.ilike.%${w}%`]).join(",")
      );
    }

    const { data, error } = await query;
    if (error) return { error: "Search failed. Try again." };

    return {
      artworks: (data ?? []).map((a) => ({
        slug: a.slug,
        title: a.title,
        artist: (a.artists as unknown as { name: string } | null)?.name ?? "Unknown artist",
        medium: a.medium,
        price: Number(a.price),
        year: a.year,
        description: a.description.slice(0, 200),
        imageUrl: a.image_url,
      })),
    };
  },
});

const tools = { searchArtworks };

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: getModel(),
    instructions: ADVISOR_PROMPT,
    messages: await convertToModelMessages(messages.slice(-12), { tools }),
    tools,
    stopWhen: isStepCount(4),
    maxOutputTokens: 600,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      onError: (err) => {
        console.error("Art advisor failed:", err);
        return "Sorry, the advisor is unavailable right now. Please try again.";
      },
    }),
  });
}
