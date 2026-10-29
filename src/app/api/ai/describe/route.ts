import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// POST /api/ai/describe
// Headers: Authorization: Bearer <supabase access token>
// Body:    { imageUrl: string, title?: string, medium?: string }
// Returns: { description: string, tags: string[], altText: string }
//
// Teaching notes:
//   • Structured output — instead of asking for free text and hoping it's
//     formatted correctly, we give the model a Zod schema. The AI SDK asks
//     the model for JSON matching it and validates the result for us.
//   • AI calls cost money — so only logged-in users may call this route, and
//     we only accept images from our own Supabase Storage bucket.
// ---------------------------------------------------------------------------
const ArtworkInsights = z.object({
  description: z
    .string()
    .describe("A 2–3 sentence gallery-style description of the artwork for buyers"),
  tags: z
    .array(z.string())
    .describe("3–6 short lowercase tags (style, subject, mood, dominant colours)"),
  altText: z
    .string()
    .describe("One concise sentence describing the image for screen-reader users"),
});

export async function POST(request: Request) {
  // ---- 1. Require a logged-in user ----
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const { data: auth } = token
    ? await getSupabaseAdmin().auth.getUser(token)
    : { data: { user: null } };
  if (!auth.user) {
    return Response.json({ error: "Please log in to use AI features." }, { status: 401 });
  }

  // ---- 2. Only describe images hosted in our own storage bucket ----
  const { imageUrl, title, medium } = await request.json();
  const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/artwork-images/`;
  if (typeof imageUrl !== "string" || !imageUrl.startsWith(storagePrefix)) {
    return Response.json({ error: "Upload an image first." }, { status: 400 });
  }

  // ---- 3. Look up the exact image type (image/png, image/jpeg, …) ----
  // Providers need the precise media type to know how to read the file.
  const head = await fetch(imageUrl, { method: "HEAD" });
  const mediaType = head.headers.get("content-type") ?? "";
  if (!head.ok || !mediaType.startsWith("image/")) {
    return Response.json({ error: "That file doesn't look like an image." }, { status: 400 });
  }

  // ---- 4. Ask the model ----
  try {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({ schema: ArtworkInsights }),
      instructions:
        "You are a curator for Canvas, an online art gallery. Write warm, specific, " +
        "honest copy based only on what you can see. Never invent the artist's biography. Add a story for that painting as well.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Describe this artwork. Title: ${title || "Untitled"}. Medium: ${medium || "unknown"}.`,
            },
            { type: "file", mediaType, data: { type: "url", url: new URL(imageUrl) } },
          ],
        },
      ],
    });

    return Response.json(output);
  } catch (err) {
    console.error("AI describe failed:", err);
    return Response.json({ error: "The AI couldn't describe this image. Try again." }, { status: 502 });
  }
}
