"use client";

import { useRef } from "react";
import { Artwork } from "@/types";
import ArtworkCard from "./ArtworkCard";

interface CollectionRowProps {
  title: string;
  artworks: Artwork[];
}

export default function CollectionRow({ title, artworks }: CollectionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (artworks.length === 0) return null;

  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-serif text-2xl lg:text-3xl text-gallery-text">
            {title}
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-gallery-border flex items-center justify-center text-gallery-muted hover:text-gallery-text hover:border-gallery-text transition-colors"
              aria-label="Scroll left"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 3L5 8l5 5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-gallery-border flex items-center justify-center text-gallery-muted hover:text-gallery-text hover:border-gallery-text transition-colors"
              aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 lg:gap-6 overflow-x-auto scroll-smooth px-6 lg:px-8 pb-4 no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {/* Left spacer for alignment */}
        <div className="shrink-0 w-0 lg:w-[calc((100vw-80rem)/2)]" />
        {artworks.map((artwork, index) => (
          <div
            key={artwork.id}
            className="shrink-0 w-[280px] sm:w-[300px] lg:w-[320px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ArtworkCard artwork={artwork} priority={index < 3} />
          </div>
        ))}
        <div className="shrink-0 w-6 lg:w-8" />
      </div>
    </section>
  );
}
