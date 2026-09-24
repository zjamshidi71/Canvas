"use client";

import { useState, useEffect, useMemo } from "react";
import { getArtworks } from "@/data/artworks";
import { getArtists } from "@/data/artists";
import { Artwork, Artist } from "@/types";
import ArtworkGrid from "@/components/ArtworkGrid";
import FilterBar from "@/components/FilterBar";

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([getArtworks(), getArtists()]).then(([artData, artistData]) => {
      setArtworks(artData);
      setArtists(artistData);
      setLoading(false);
    });
  }, []);

  // Build a map of artistId -> artistName for search
  const artistNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    artists.forEach((a) => {
      map[a.id] = a.name.toLowerCase();
    });
    return map;
  }, [artists]);

  const filteredArtworks = useMemo(() => {
    let result = [...artworks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const artistName = artistNameMap[a.artistId] || "";
        return (
          a.title.toLowerCase().includes(query) ||
          artistName.includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.medium.toLowerCase().includes(query)
        );
      });
    }

    // Filter by medium
    if (selectedMediums.length > 0) {
      result = result.filter((a) => selectedMediums.includes(a.medium));
    }

    // Filter by price
    result = result.filter(
      (a) => a.price >= priceRange[0] && a.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        result.sort((a, b) => b.year - a.year);
        break;
    }

    return result;
  }, [artworks, artistNameMap, searchQuery, selectedMediums, sortBy, priceRange]);

  const activeFilterCount =
    selectedMediums.length +
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gallery-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-8">
        <h1 className="font-serif text-4xl lg:text-5xl text-gallery-text mb-3">
          Gallery
        </h1>
        <p className="text-gallery-muted max-w-xl mb-8">
          Browse our full collection of original contemporary artworks available
          for purchase.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gallery-muted pointer-events-none"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, artist, medium, or keyword…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm transition-colors"
            id="gallery-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gallery-muted hover:text-gallery-text transition-colors"
              aria-label="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 mb-6 text-sm text-gallery-muted hover:text-gallery-text transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 5h12M5 9h8M7 13h4" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-gallery-text text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sidebar Filters */}
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block mb-8 lg:mb-0`}
          >
            <div className="lg:sticky lg:top-28">
              <FilterBar
                selectedMediums={selectedMediums}
                onMediumChange={setSelectedMediums}
                sortBy={sortBy}
                onSortChange={setSortBy}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
              />

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedMediums([]);
                    setPriceRange([0, 50000]);
                    setSearchQuery("");
                  }}
                  className="mt-4 text-sm text-gallery-muted hover:text-gallery-text underline underline-offset-4 transition-colors"
                >
                  Clear all filters
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gallery-border">
                <p className="text-sm text-gallery-muted">
                  {filteredArtworks.length}{" "}
                  {filteredArtworks.length === 1 ? "work" : "works"}
                </p>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div>
            {filteredArtworks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gallery-muted text-lg mb-2">
                  No artworks found
                </p>
                <p className="text-gallery-muted/60 text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <ArtworkGrid artworks={filteredArtworks} columns={3} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
