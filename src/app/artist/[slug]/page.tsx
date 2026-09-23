import { use } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArtistBySlug } from "@/data/artists";
import { getArtworksByArtist } from "@/data/artworks";
import ArtworkGrid from "@/components/ArtworkGrid";

export default function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const artist = getArtistBySlug(slug);

  if (!artist) {
    notFound();
  }

  const works = getArtworksByArtist(artist.id);

  return (
    <div className="min-h-screen">
      {/* Artist Header */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-16 items-start">
          {/* Photo */}
          <div className="relative w-48 h-48 lg:w-full lg:h-auto lg:aspect-square rounded-full lg:rounded-sm overflow-hidden bg-gallery-subtle mx-auto lg:mx-0 mb-8 lg:mb-0">
            <Image
              src={artist.photoUrl}
              alt={artist.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 192px, 280px"
            />
          </div>

          {/* Bio */}
          <div className="text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest text-gallery-muted mb-2">
              {artist.speciality}
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl text-gallery-text mb-6">
              {artist.name}
            </h1>
            <p className="text-gallery-text leading-relaxed text-[15px] max-w-2xl">
              {artist.bio}
            </p>
          </div>
        </div>
      </section>

      {/* Works */}
      <section className="border-t border-gallery-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <h2 className="font-serif text-2xl lg:text-3xl text-gallery-text mb-8">
            Available Works ({works.length})
          </h2>
          <ArtworkGrid artworks={works} columns={3} />
        </div>
      </section>
    </div>
  );
}
