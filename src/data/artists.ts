import { supabase } from "@/lib/supabase";
import { Artist } from "@/types";

// Map Supabase row (snake_case) to our TypeScript type (camelCase)
function mapArtist(row: Record<string, unknown>): Artist {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    bio: row.bio as string,
    photoUrl: row.photo_url as string,
    speciality: row.speciality as string,
  };
}

export async function getArtists(): Promise<Artist[]> {
  const { data, error } = await supabase.from("artists").select("*");
  if (error) {
    console.error("Error fetching artists:", error);
    return [];
  }
  return (data ?? []).map(mapArtist);
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return mapArtist(data);
}

export async function getArtistBySlug(
  slug: string
): Promise<Artist | undefined> {
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return undefined;
  return mapArtist(data);
}
