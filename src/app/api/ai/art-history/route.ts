import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai";

// ---------------------------------------------------------------------------
// POST /api/ai/art-history
// Body: { title: string; medium: string; description: string; imageUrl?: string }
// Returns: { story: string; museumWorks: MuseumWork[] }
//
// Teaching notes:
//   • No API key needed — the Art Institute of Chicago's public API is open.
//     Docs: https://api.artic.edu/docs/
//   • We build a free-text search query from the artwork's title, medium, and
//     description, then ask the AI to write a "In conversation with…" paragraph
//     grounded entirely in real museum data (so we never invent facts).
//   • Structured output (Zod schema) keeps the response predictable for the UI.
// ---------------------------------------------------------------------------

// Shape of a museum work we send to the client
const MuseumWorkSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  year: z.string(),        // display string, e.g. "1930" or "c. 1930"
  imageId: z.string().nullable(),
  url: z.string(),         // deep link to the museum record
});

const ArtHistoryResponseSchema = z.object({
  story: z
    .string()
    .describe(
      "A 3–4 sentence 'In conversation with…' paragraph that connects this Canvas artwork " +
      "to the museum works using specific, factual details from the museum data. " +
      "Name each museum artist and year. Never invent facts."
    ),
  museumWorks: z
    .array(MuseumWorkSchema)
    .describe("The museum works used as reference (1–3 entries)."),
});

type AICResponse = z.infer<typeof ArtHistoryResponseSchema>;

// ---------------------------------------------------------------------------
// Art Institute of Chicago helper
// ---------------------------------------------------------------------------
interface AICWork {
  id: number;
  title: string;
  artist_display: string;         // e.g. "Pablo Picasso\nSpanish, 1881–1973"
  date_display: string;           // e.g. "1930"
  image_id: string | null;
}

async function searchMuseum(query: string, limit = 5): Promise<AICWork[]> {
  const encoded = encodeURIComponent(query);
  const fields = "id,title,artist_display,date_display,image_id";
  const url =
    `https://api.artic.edu/api/v1/artworks/search` +
    `?q=${encoded}&fields=${fields}&limit=${limit}`;

  const res = await fetch(url, {
    headers: { "AIC-User-Agent": "Canvas Gallery / canvas.art (contact: admin@canvas.art)" },
    // Allow a 5-second timeout so a slow museum response doesn't block checkout pages
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as AICWork[];
}

function museumWorkUrl(id: number): string {
  return `https://www.artic.edu/artworks/${id}`;
}

function museumImageUrl(imageId: string): string {
  // AIC image CDN — 400px width thumbnail
  return `https://www.artic.edu/iiif/2/${imageId}/full/400,/0/default.jpg`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.description) {
    return Response.json({ error: "title and description are required." }, { status: 400 });
  }

  const { title, medium, description } = body as {
    title: string;
    medium?: string;
    description: string;
  };

  // Build a search query that captures style, medium and any colour hints
  // Pull notable nouns and adjectives from the first sentence of the description
  const shortDesc = description.split(".")[0].slice(0, 80);
  const searchQuery = [medium, title, shortDesc].filter(Boolean).join(" ");

  // Fetch up to 5 museum works; take the first 3 that have an image
  let museumWorks: AICWork[] = [];
  try {
    const raw = await searchMuseum(searchQuery);
    museumWorks = raw.filter((w) => w.image_id).slice(0, 3);
  } catch {
    // Museum API timeout / network error — degrade gracefully
  }

  if (museumWorks.length === 0) {
    // Try a shorter, broader query
    try {
      const raw = await searchMuseum(medium ?? title, 8);
      museumWorks = raw.filter((w) => w.image_id).slice(0, 3);
    } catch {
      // Still nothing — return a sensible empty state
      return Response.json({
        story: "",
        museumWorks: [],
      });
    }
  }

  // Build a compact summary for the LLM prompt
  const museumContext = museumWorks
    .map(
      (w, i) =>
        `[${i + 1}] "${w.title}" by ${w.artist_display.split("\n")[0]} (${w.date_display})`
    )
    .join("\n");

  // Ask the model to write the "In conversation with…" story
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: ArtHistoryResponseSchema }),
    instructions:
      "You are a curator for Canvas, an online art marketplace. " +
      "Write grounded, specific art-historical context. " +
      "Base every claim strictly on the museum data provided. " +
      "Never invent facts, prices, or biographical details not in the data.",
    messages: [
      {
        role: "user",
        content:
          `Canvas artwork: "${title}" — ${medium ?? "unknown medium"}\n` +
          `Description: ${description}\n\n` +
          `Museum works from the Art Institute of Chicago:\n${museumContext}\n\n` +
          `Write the museumWorks array using the exact details above, ` +
          `then write the story field connecting this artwork to those museum pieces.`,
      },
    ],
  }).catch((err) => {
    console.error("Art-history AI failed:", err);
    return { output: null };
  });

  if (!output) {
    return Response.json({ error: "AI unavailable. Please try again." }, { status: 502 });
  }

  // Merge in the real museum URLs and image URLs (the LLM doesn't generate these)
  const enrichedWorks = output.museumWorks.map((w, i) => {
    const raw = museumWorks[i];
    return {
      ...w,
      id: raw?.id ?? w.id,
      imageId: raw?.image_id ?? null,
      imageUrl: raw?.image_id ? museumImageUrl(raw.image_id) : null,
      url: raw ? museumWorkUrl(raw.id) : w.url,
    };
  });

  return Response.json({
    story: output.story,
    museumWorks: enrichedWorks,
  });
}

