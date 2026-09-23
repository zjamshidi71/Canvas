"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtworkBySlug, getArtworksByArtist } from "@/data/artworks";
import { getArtistById } from "@/data/artists";
import { useCart } from "@/context/CartContext";
import ArtworkCard from "@/components/ArtworkCard";

export default function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const artwork = getArtworkBySlug(slug);
  const { addItem } = useCart();

  if (!artwork) {
    notFound();
  }

  const artist = getArtistById(artwork.artistId);
  const moreByArtist = getArtworksByArtist(artwork.artistId).filter(
    (a) => a.id !== artwork.id
  );

  const handleAddToCart = () => {
    addItem(artwork);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gallery-muted">
          <Link href="/gallery" className="hover:text-gallery-text transition-colors">
            Gallery
          </Link>
          <span className="mx-2">·</span>
          <span className="text-gallery-text">{artwork.title}</span>
        </nav>

        {/* Main content */}
        <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-16">
          {/* Image */}
          <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[600px] overflow-hidden bg-gallery-subtle rounded-sm mb-8 lg:mb-0">
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-28 lg:self-start space-y-6">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl text-gallery-text mb-2 leading-tight">
                {artwork.title}
              </h1>
              {artist && (
                <Link
                  href={`/artist/${artist.slug}`}
                  className="text-gallery-muted hover:text-gallery-text transition-colors"
                >
                  {artist.name}
                </Link>
              )}
            </div>

            <div className="border-t border-b border-gallery-border py-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gallery-muted">Medium</span>
                <span className="text-gallery-text capitalize">
                  {artwork.medium}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gallery-muted">Dimensions</span>
                <span className="text-gallery-text">{artwork.dimensions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gallery-muted">Year</span>
                <span className="text-gallery-text">{artwork.year}</span>
              </div>
            </div>

            <p className="font-serif text-3xl text-gallery-text">
              ${artwork.price.toLocaleString()}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
              >
                Add to Cart
              </button>
              <Link
                href="/cart"
                onClick={handleAddToCart}
                className="block w-full py-4 text-center border border-gallery-text text-gallery-text text-sm uppercase tracking-widest hover:bg-gallery-text hover:text-white transition-colors"
              >
                Buy Now
              </Link>
            </div>

            <div className="pt-4">
              <h2 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
                About This Work
              </h2>
              <p className="text-gallery-text leading-relaxed text-[15px]">
                {artwork.description}
              </p>
            </div>
          </div>
        </div>

        {/* More by this artist */}
        {moreByArtist.length > 0 && (
          <section className="mt-20 pt-12 border-t border-gallery-border">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-serif text-2xl lg:text-3xl text-gallery-text">
                More by {artist?.name}
              </h2>
              {artist && (
                <Link
                  href={`/artist/${artist.slug}`}
                  className="text-sm text-gallery-muted hover:text-gallery-text transition-colors uppercase tracking-widest"
                >
                  View Profile →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {moreByArtist.slice(0, 3).map((a) => (
                <ArtworkCard key={a.id} artwork={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
