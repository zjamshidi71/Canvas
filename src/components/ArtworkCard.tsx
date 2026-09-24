"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Artwork } from "@/types";
import { getArtistById } from "@/data/artists";

interface ArtworkCardProps {
  artwork: Artwork;
  artistName?: string;
  priority?: boolean;
}

export default function ArtworkCard({
  artwork,
  artistName,
  priority = false,
}: ArtworkCardProps) {
  const [resolvedArtistName, setResolvedArtistName] = useState(
    artistName ?? ""
  );

  useEffect(() => {
    if (!artistName) {
      getArtistById(artwork.artistId).then((artist) => {
        if (artist) setResolvedArtistName(artist.name);
      });
    }
  }, [artwork.artistId, artistName]);

  return (
    <Link href={`/artwork/${artwork.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-gallery-subtle rounded-sm">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority={priority}
        />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="font-serif text-lg text-gallery-text group-hover:opacity-70 transition-opacity">
          {artwork.title}
        </h3>
        <p className="text-sm text-gallery-muted">{resolvedArtistName}</p>
        <p className="text-sm text-gallery-text font-medium">
          ${artwork.price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
