import { supabase } from "@/lib/supabase";
import { Artist } from "@/types";
import type { User } from "@supabase/supabase-js";

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

// ---------------------------------------------------------------------------
// Every artwork must belong to a row in the artists table (artist_id is a
// foreign key). Logged-in users use their auth user ID as their artist ID,
// so the first time someone lists an artwork we create their artist profile.
// ---------------------------------------------------------------------------
export async function ensureArtistProfile(
  user: User
): Promise<{ error?: string }> {
  if (await getArtistById(user.id)) return {};

  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "New Artist";
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${user.id.slice(0, 4)}`;

  const { error } = await supabase.from("artists").insert({
    id: user.id,
    slug,
    name,
    bio: "",
    photo_url: "",
    speciality: "",
  });
  if (error) {
    console.error("Error creating artist profile:", error);
    return { error: error.message };
  }
  return {};
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
