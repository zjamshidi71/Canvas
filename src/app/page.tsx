"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import CollectionRow from "@/components/CollectionRow";
import { getArtworks, getArtworksByCollection } from "@/data/artworks";
import { getEditorials } from "@/data/editorial";
import { getArtistById } from "@/data/artists";
import { Artwork, EditorialArticle } from "@/types";

export default function HomePage() {
  const [featured, setFeatured] = useState<Artwork | null>(null);
  const [featuredArtistName, setFeaturedArtistName] = useState("");
  const [editorial, setEditorial] = useState<EditorialArticle | null>(null);
  const [newThisWeek, setNewThisWeek] = useState<Artwork[]>([]);
  const [abstractWorks, setAbstractWorks] = useState<Artwork[]>([]);
  const [photographyWorks, setPhotographyWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [allArtworks, editorials, newWorks, abstractList, photoList] =
        await Promise.all([
          getArtworks(),
          getEditorials(),
          getArtworksByCollection("new"),
          getArtworksByCollection("abstract"),
          getArtworksByCollection("photography"),
        ]);

      // Blue Atlas (art-7) is index 6 in the original static array,
      // but from DB we find it by id
      const blueAtlas =
        allArtworks.find((a) => a.id === "art-7") || allArtworks[0];
      setFeatured(blueAtlas);

      if (blueAtlas) {
        const artist = await getArtistById(blueAtlas.artistId);
        setFeaturedArtistName(artist?.name ?? "");
      }

      setEditorial(editorials[0] ?? null);
      setNewThisWeek(newWorks);
      setAbstractWorks(abstractList);
      setPhotographyWorks(photoList);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading || !featured) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gallery-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero — Featured Artwork */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden bg-gallery-subtle">
        <Image
          src={featured.imageUrl}
          alt={featured.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-16">
          <div className="max-w-7xl mx-auto">
            <p className="text-white/70 text-sm uppercase tracking-widest mb-3">
              Featured Work
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-3">
              {featured.title}
            </h1>
            <p className="text-white/80 text-lg mb-6">
              by {featuredArtistName} · {featured.medium} ·{" "}
              ${featured.price.toLocaleString()}
            </p>
            <Link
              href={`/artwork/${featured.slug}`}
              className="inline-block px-8 py-3 bg-white text-gallery-text text-sm uppercase tracking-widest hover:bg-white/90 transition-colors"
            >
              View Artwork
            </Link>
          </div>
        </div>
      </section>

      {/* New This Week */}
      <CollectionRow title="New This Week" artworks={newThisWeek} />

      {/* Editorial Teaser */}
      {editorial && (
        <section className="py-8 lg:py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Link href={`/stories/${editorial.slug}`} className="group block">
              <div className="relative aspect-[21/9] overflow-hidden rounded-sm bg-gallery-subtle">
                <Image
                  src={editorial.heroImageUrl}
                  alt={editorial.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8 lg:p-16 max-w-2xl">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-3">
                    Canvas Stories
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-white mb-3 leading-tight">
                    {editorial.title}
                  </h2>
                  <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-2">
                    {editorial.subtitle}
                  </p>
                  <span className="mt-5 text-white/80 text-sm uppercase tracking-widest group-hover:text-white transition-colors">
                    Read the Story →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Abstract */}
      <CollectionRow title="Abstract" artworks={abstractWorks} />

      {/* Photography */}
      <CollectionRow title="Photography" artworks={photographyWorks} />

      {/* Gallery CTA */}
      <section className="py-16 lg:py-24 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-serif text-3xl lg:text-4xl text-gallery-text mb-4">
            Explore the Full Collection
          </h2>
          <p className="text-gallery-muted mb-8 leading-relaxed">
            Browse all available works, filter by medium and price, and find the
            piece that speaks to you.
          </p>
          <Link
            href="/gallery"
            className="inline-block px-10 py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
          >
            View Gallery
          </Link>
        </div>
      </section>
    </div>
  );
}
