import { supabase } from "@/lib/supabase";

export interface ArtworkRating {
  averageRating: number;
  totalRatings: number;
}

export async function getArtworkRating(
  artworkId: string
): Promise<ArtworkRating> {
  const { data, error } = await supabase
    .from("artwork_ratings")
    .select("*")
    .eq("artwork_id", artworkId)
    .single();

  if (error || !data) {
    return { averageRating: 0, totalRatings: 0 };
  }

  return {
    averageRating: Number(data.average_rating),
    totalRatings: Number(data.total_ratings),
  };
}

export async function submitRating(
  artworkId: string,
  rating: number
): Promise<boolean> {
  const { error } = await supabase
    .from("ratings")
    .insert({ artwork_id: artworkId, rating });

  if (error) {
    console.error("Error submitting rating:", error);
    return false;
  }
  return true;
}
