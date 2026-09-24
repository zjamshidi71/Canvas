"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEditorialBySlug } from "@/data/editorial";
import { getArtistById } from "@/data/artists";
import { getArtworksByArtist } from "@/data/artworks";
import ArtworkCard from "@/components/ArtworkCard";
import { EditorialArticle, Artist, Artwork } from "@/types";

export default function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [editorial, setEditorial] = useState<EditorialArticle | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistWorks, setArtistWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function loadData() {
      const ed = await getEditorialBySlug(slug);
      if (!ed) {
        setNotFoundState(true);
        return;
      }
      setEditorial(ed);

      const artistData = await getArtistById(ed.relatedArtistId);
      setArtist(artistData ?? null);

      if (artistData) {
        const works = await getArtworksByArtist(artistData.id);
        setArtistWorks(works.slice(0, 3));
      }

      setLoading(false);
    }

    loadData();
  }, [slug]);

  if (notFoundState) {
    notFound();
  }

  if (loading || !editorial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gallery-muted">Loading…</div>
      </div>
    );
  }

  return (
    <article className="min-h-screen">
      {/* Hero */}
      <header className="relative h-[60vh] min-h-[400px] overflow-hidden bg-gallery-subtle">
        <Image
          src={editorial.heroImageUrl}
          alt={editorial.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-4">
              Canvas Stories
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight">
              {editorial.title}
            </h1>
            <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto">
              {editorial.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Meta */}
      <div className="max-w-2xl mx-auto px-6 py-8 flex items-center justify-center gap-4 text-sm text-gallery-muted border-b border-gallery-border">
        <span>By {editorial.author}</span>
        <span>·</span>
        <span>{editorial.date}</span>
      </div>

      {/* Article body */}
      <div className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
        {editorial.content.map((paragraph, index) => (
          <div key={index}>
            {/* Insert pull quote after the 4th paragraph */}
            {index === 4 && editorial.pullQuote && (
              <blockquote className="my-12 py-8 border-t border-b border-gallery-border">
                <p className="font-serif text-2xl lg:text-3xl text-gallery-text leading-relaxed text-center italic">
                  &ldquo;{editorial.pullQuote}&rdquo;
                </p>
              </blockquote>
            )}
            <p className="text-gallery-text leading-[1.85] text-[16px] mb-6">
              {paragraph}
            </p>
          </div>
        ))}
      </div>

      {/* Related Artist & Works */}
      {artist && (
        <section className="border-t border-gallery-border bg-gallery-subtle">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-widest text-gallery-muted mb-2">
                Featured Artist
              </p>
              <h2 className="font-serif text-3xl text-gallery-text mb-3">
                {artist.name}
              </h2>
              <Link
                href={`/artist/${artist.slug}`}
                className="text-sm text-gallery-muted hover:text-gallery-text underline underline-offset-4 transition-colors"
              >
                View full profile →
              </Link>
            </div>

            {artistWorks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
                {artistWorks.map((work) => (
                  <ArtworkCard key={work.id} artwork={work} artistName={artist.name} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
