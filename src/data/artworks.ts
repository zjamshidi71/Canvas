import { supabase } from "@/lib/supabase";
import { Artwork } from "@/types";

// Map Supabase row (snake_case) to our TypeScript type (camelCase)
function mapArtwork(row: Record<string, unknown>): Artwork {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    artistId: row.artist_id as string,
    medium: row.medium as Artwork["medium"],
    dimensions: row.dimensions as string,
    price: Number(row.price),
    year: row.year as number,
    description: row.description as string,
    imageUrl: row.image_url as string,
    collections: row.collections as string[],
  };
}

export async function getArtworks(): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .order("year", { ascending: false });
  if (error) {
    console.error("Error fetching artworks:", error);
    return [];
  }
  return (data ?? []).map(mapArtwork);
}

export async function getArtworkBySlug(
  slug: string
): Promise<Artwork | undefined> {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return undefined;
  return mapArtwork(data);
}

export async function getArtworksByArtist(
  artistId: string
): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("artist_id", artistId);
  if (error) {
    console.error("Error fetching artworks by artist:", error);
    return [];
  }
  return (data ?? []).map(mapArtwork);
}

export async function getArtworksByCollection(
  collection: string
): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .contains("collections", [collection]);
  if (error) {
    console.error("Error fetching artworks by collection:", error);
    return [];
  }
  return (data ?? []).map(mapArtwork);
}
