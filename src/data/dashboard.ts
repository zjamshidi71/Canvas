import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Dashboard statistics — aggregate data for the admin dashboard.
// Each function performs a single, focused query against Supabase.
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalArtworks: number;
  totalArtists: number;
  totalRatings: number;
  averagePrice: number;
  highestPrice: number;
  mediumBreakdown: { medium: string; count: number }[];
}

/**
 * Fetch all dashboard statistics in one call.
 * We run multiple queries in parallel with Promise.all for speed.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [artworksRes, artistsRes, ratingsRes] = await Promise.all([
    supabase.from("artworks").select("*"),
    supabase.from("artists").select("id"),
    supabase.from("artwork_ratings").select("total_ratings"),
  ]);

  const artworks = artworksRes.data ?? [];
  const artists = artistsRes.data ?? [];
  const ratings = ratingsRes.data ?? [];

  // Calculate price stats
  const prices = artworks.map((a) => Number(a.price));
  const averagePrice =
    prices.length > 0
      ? prices.reduce((sum, p) => sum + p, 0) / prices.length
      : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Calculate total ratings across all artworks
  const totalRatings = ratings.reduce(
    (sum, r) => sum + Number(r.total_ratings || 0),
    0
  );

  // Medium breakdown — count how many artworks per medium type
  const mediumCounts: Record<string, number> = {};
  artworks.forEach((a) => {
    const m = (a.medium as string) || "unknown";
    mediumCounts[m] = (mediumCounts[m] || 0) + 1;
  });
  const mediumBreakdown = Object.entries(mediumCounts).map(
    ([medium, count]) => ({ medium, count })
  );

  return {
    totalArtworks: artworks.length,
    totalArtists: artists.length,
    totalRatings,
    averagePrice,
    highestPrice,
    mediumBreakdown,
  };
}
