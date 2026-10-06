"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ArtworkForm from "@/components/ArtworkForm";
import {
  getArtworkBySlug,
  updateArtwork,
  ArtworkInput,
} from "@/data/artworks";
import { Artwork } from "@/types";

// ---------------------------------------------------------------------------
// /artwork/[slug]/edit — Protected page where the artwork owner (the user
// whose ID matches the artwork's artistId) can edit the artwork's details.
// Non-owners see an "Access Denied" message. On save the user is redirected
// to the artwork's (potentially new) detail page.
// ---------------------------------------------------------------------------
export default function EditArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function load() {
      const art = await getArtworkBySlug(slug);
      if (!art) {
        setNotFoundState(true);
      } else {
        setArtwork(art);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  // ---- Loading states ----
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gallery-muted">Loading…</div>
      </div>
    );
  }

  if (notFoundState || !artwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl text-gallery-text mb-4">
          Artwork Not Found
        </h1>
        <p className="text-gallery-muted mb-6">
          The artwork you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/gallery"
          className="px-8 py-3 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  // ---- Auth gate ----
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gallery-text mb-4">
          Sign In Required
        </h1>
        <p className="text-gallery-muted mb-6 max-w-md">
          You need to be signed in to edit artworks.
        </p>
        <Link
          href="/login"
          className="px-8 py-3 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // ---- Ownership check ----
  if (artwork.artistId !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gallery-text mb-4">
          Access Denied
        </h1>
        <p className="text-gallery-muted mb-6 max-w-md">
          You can only edit artworks that you have listed.
        </p>
        <Link
          href={`/artwork/${slug}`}
          className="px-8 py-3 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
        >
          View Artwork
        </Link>
      </div>
    );
  }

  // ---- Handler: receive form data, call updateArtwork, redirect ----
  const handleUpdate = async (data: ArtworkInput) => {
    const result = await updateArtwork(artwork.id, data);

    if (result.error) {
      throw new Error(result.error);
    }

    // Redirect to the updated artwork's detail page (slug may have changed)
    if (result.artwork) {
      router.push(`/artwork/${result.artwork.slug}`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        {/* Header */}
        <div className="mb-10">
          <nav className="mb-6 text-sm text-gallery-muted">
            <Link
              href="/gallery"
              className="hover:text-gallery-text transition-colors"
            >
              Gallery
            </Link>
            <span className="mx-2">·</span>
            <Link
              href={`/artwork/${slug}`}
              className="hover:text-gallery-text transition-colors"
            >
              {artwork.title}
            </Link>
            <span className="mx-2">·</span>
            <span className="text-gallery-text">Edit</span>
          </nav>
          <h1 className="font-serif text-3xl lg:text-4xl text-gallery-text mb-2">
            Edit Artwork
          </h1>
          <p className="text-gallery-muted leading-relaxed">
            Update the details of &ldquo;{artwork.title}&rdquo; below.
          </p>
        </div>

        {/* The reusable form — pre-filled with existing artwork data */}
        <ArtworkForm
          initialData={artwork}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
