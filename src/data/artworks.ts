import { supabase } from "@/lib/supabase";
import { Artwork } from "@/types";

// ---------------------------------------------------------------------------
// Input type used when creating or updating an artwork.
// Omits auto-generated fields (id, slug) so the caller only provides content.
// ---------------------------------------------------------------------------
export type ArtworkInput = Omit<Artwork, "id" | "slug">;

// ---------------------------------------------------------------------------
// Map Supabase row (snake_case) → TypeScript type (camelCase)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper: turn a title like "Sunset Over Mountains" into "sunset-over-mountains"
// and append a random 4-char suffix to guarantee uniqueness.
// ---------------------------------------------------------------------------
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

// ========================  R E A D  ========================================

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

// ========================  C R E A T E  ====================================

export async function createArtwork(
  input: ArtworkInput
): Promise<{ artwork?: Artwork; error?: string }> {
  const slug = generateSlug(input.title);

  const { data, error } = await supabase
    .from("artworks")
    .insert({
      slug,
      title: input.title,
      artist_id: input.artistId,
      medium: input.medium,
      dimensions: input.dimensions,
      price: input.price,
      year: input.year,
      description: input.description,
      image_url: input.imageUrl,
      collections: input.collections,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating artwork:", error);
    return { error: error.message };
  }

  return { artwork: mapArtwork(data) };
}

// ========================  U P D A T E  ====================================

export async function updateArtwork(
  id: string,
  input: Partial<ArtworkInput>
): Promise<{ artwork?: Artwork; error?: string }> {
  // Build a partial row object with only the fields that were provided
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) {
    row.title = input.title;
    row.slug = generateSlug(input.title); // regenerate slug when title changes
  }
  if (input.artistId !== undefined) row.artist_id = input.artistId;
  if (input.medium !== undefined) row.medium = input.medium;
  if (input.dimensions !== undefined) row.dimensions = input.dimensions;
  if (input.price !== undefined) row.price = input.price;
  if (input.year !== undefined) row.year = input.year;
  if (input.description !== undefined) row.description = input.description;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl;
  if (input.collections !== undefined) row.collections = input.collections;

  const { data, error } = await supabase
    .from("artworks")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating artwork:", error);
    return { error: error.message };
  }

  return { artwork: mapArtwork(data) };
}

// ========================  D E L E T E  ====================================

export async function deleteArtwork(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("artworks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting artwork:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
