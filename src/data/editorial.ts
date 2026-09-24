import { supabase } from "@/lib/supabase";
import { EditorialArticle } from "@/types";

// Map Supabase row (snake_case) to our TypeScript type (camelCase)
function mapEditorial(row: Record<string, unknown>): EditorialArticle {
  return {
    slug: row.slug as string,
    title: row.title as string,
    subtitle: row.subtitle as string,
    author: row.author as string,
    date: row.date as string,
    heroImageUrl: row.hero_image_url as string,
    content: row.content as string[],
    pullQuote: (row.pull_quote as string) || undefined,
    relatedArtistId: row.related_artist_id as string,
  };
}

export async function getEditorials(): Promise<EditorialArticle[]> {
  const { data, error } = await supabase.from("editorials").select("*");
  if (error) {
    console.error("Error fetching editorials:", error);
    return [];
  }
  return (data ?? []).map(mapEditorial);
}

export async function getEditorialBySlug(
  slug: string
): Promise<EditorialArticle | undefined> {
  const { data, error } = await supabase
    .from("editorials")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return undefined;
  return mapEditorial(data);
}
