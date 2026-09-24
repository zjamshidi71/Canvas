"use client";

import { useState, useEffect, useMemo } from "react";
import { getArtworks } from "@/data/artworks";
import { Artwork } from "@/types";
import ArtworkGrid from "@/components/ArtworkGrid";
import FilterBar from "@/components/FilterBar";

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getArtworks().then((data) => {
      setArtworks(data);
      setLoading(false);
    });
  }, []);

  const filteredArtworks = useMemo(() => {
    let result = [...artworks];

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
  }, [artworks, selectedMediums, sortBy, priceRange]);

  const activeFilterCount =
    selectedMediums.length +
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0);

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
        <p className="text-gallery-muted max-w-xl">
          Browse our full collection of original contemporary artworks available
          for purchase.
        </p>
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
            <ArtworkGrid artworks={filteredArtworks} columns={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
