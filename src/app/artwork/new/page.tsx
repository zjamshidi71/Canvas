"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ArtworkForm from "@/components/ArtworkForm";
import { createArtwork, ArtworkInput } from "@/data/artworks";
import { ensureArtistProfile } from "@/data/artists";

// ---------------------------------------------------------------------------
// /artwork/new — Protected page where a logged-in user can list a new artwork
// for sale. If the user is not signed in, a prompt redirects them to /login.
// On success, the user is sent to the newly created artwork's detail page.
// ---------------------------------------------------------------------------
export default function NewArtworkPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ---- Auth gate: only logged-in users can create artworks ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gallery-muted">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gallery-text mb-4">
          Sign In Required
        </h1>
        <p className="text-gallery-muted mb-6 max-w-md">
          You need to be signed in to list a new artwork. Create a free account
          or sign in to get started.
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

  // ---- Handler: receive form data, call createArtwork, redirect ----
  const handleCreate = async (data: ArtworkInput) => {
    setGlobalError(null);

    // Make sure this user has an artist profile (first listing creates one)
    const profile = await ensureArtistProfile(user);
    if (profile.error) {
      throw new Error(profile.error);
    }

    // Use the current user's ID as the artistId
    const result = await createArtwork({
      ...data,
      artistId: user.id,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    // Redirect to the new artwork's detail page
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
            <span className="text-gallery-text">List New Artwork</span>
          </nav>
          <h1 className="font-serif text-3xl lg:text-4xl text-gallery-text mb-2">
            List a New Artwork
          </h1>
          <p className="text-gallery-muted leading-relaxed">
            Fill in the details below to add your artwork to the Canvas
            marketplace. All fields marked with * are required.
          </p>
        </div>

        {/* Error */}
        {globalError && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
            {globalError}
          </div>
        )}

        {/* The reusable form */}
        <ArtworkForm onSubmit={handleCreate} submitLabel="Create Artwork" />
      </div>
    </div>
  );
}
