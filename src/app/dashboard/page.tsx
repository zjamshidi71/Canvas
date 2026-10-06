"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getArtworksByArtist, deleteArtwork } from "@/data/artworks";
import { Artwork } from "@/types";

// ---------------------------------------------------------------------------
// /dashboard — "My Listings" page.
// Shows every artwork the current user has listed, with quick-access buttons
// to edit or delete each one. Also shows a summary stats bar at the top.
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Artwork | null>(null);

  const loadArtworks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getArtworksByArtist(user.id);
    setArtworks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadArtworks();
  }, [user, loadArtworks]);

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    setDeletingId(showDeleteModal.id);
    const result = await deleteArtwork(showDeleteModal.id);
    if (result.success) {
      setArtworks((prev) => prev.filter((a) => a.id !== showDeleteModal.id));
      setShowDeleteModal(null);
    } else {
      alert(result.error || "Failed to delete artwork.");
    }
    setDeletingId(null);
  };

  // ---- Auth gate ----
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
          Sign in to view and manage your artwork listings.
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

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Artist";
  const totalValue = artworks.reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-gallery-muted mb-2">
            Dashboard
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl text-gallery-text mb-2">
            My Listings
          </h1>
          <p className="text-gallery-muted leading-relaxed">
            Welcome back, {displayName}. Manage your artworks below.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white border border-gallery-border p-5 rounded-sm">
            <p className="text-xs uppercase tracking-widest text-gallery-muted mb-1">
              Total Listings
            </p>
            <p className="font-serif text-3xl text-gallery-text">
              {loading ? "—" : artworks.length}
            </p>
          </div>
          <div className="bg-white border border-gallery-border p-5 rounded-sm">
            <p className="text-xs uppercase tracking-widest text-gallery-muted mb-1">
              Portfolio Value
            </p>
            <p className="font-serif text-3xl text-gallery-text">
              {loading ? "—" : `$${totalValue.toLocaleString()}`}
            </p>
          </div>
          <div className="bg-white border border-gallery-border p-5 rounded-sm">
            <p className="text-xs uppercase tracking-widest text-gallery-muted mb-1">
              Avg. Price
            </p>
            <p className="font-serif text-3xl text-gallery-text">
              {loading || artworks.length === 0
                ? "—"
                : `$${Math.round(totalValue / artworks.length).toLocaleString()}`}
            </p>
          </div>
          <div className="bg-white border border-gallery-border p-5 rounded-sm">
            <p className="text-xs uppercase tracking-widest text-gallery-muted mb-1">
              Status
            </p>
            <p className="font-serif text-3xl text-gallery-text">
              {loading ? "—" : "Active"}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gallery-muted">
            Your Artworks
          </h2>
          <Link
            href="/artwork/new"
            className="px-6 py-2.5 bg-gallery-text text-white text-xs uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
          >
            + New Artwork
          </Link>
        </div>

        {/* Artworks list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-gallery-muted">
              Loading your artworks…
            </div>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gallery-border rounded-sm">
            <p className="font-serif text-2xl text-gallery-text mb-3">
              No artworks yet
            </p>
            <p className="text-gallery-muted mb-6">
              List your first artwork to get started on Canvas.
            </p>
            <Link
              href="/artwork/new"
              className="inline-block px-8 py-3 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
            >
              List Your First Artwork
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                className="bg-white border border-gallery-border rounded-sm p-4 flex items-center gap-5 group hover:border-gallery-accent transition-colors"
              >
                {/* Thumbnail */}
                <Link
                  href={`/artwork/${artwork.slug}`}
                  className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-gallery-subtle rounded-sm"
                >
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/artwork/${artwork.slug}`}
                    className="font-serif text-lg text-gallery-text hover:opacity-70 transition-opacity block truncate"
                  >
                    {artwork.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gallery-muted">
                    <span className="capitalize">{artwork.medium}</span>
                    <span>·</span>
                    <span>{artwork.year}</span>
                    <span>·</span>
                    <span className="text-gallery-text font-medium">
                      ${artwork.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/artwork/${artwork.slug}/edit`}
                    className="px-4 py-2 border border-gallery-border text-gallery-muted text-xs uppercase tracking-widest hover:border-gallery-accent hover:text-gallery-text transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(artwork)}
                    className="px-4 py-2 border border-gallery-border text-gallery-muted text-xs uppercase tracking-widest hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full mx-6 p-8 rounded-sm shadow-xl">
            <h3 className="font-serif text-2xl text-gallery-text mb-3">
              Delete This Artwork?
            </h3>
            <p className="text-gallery-muted text-sm leading-relaxed mb-6">
              This will permanently remove &ldquo;{showDeleteModal.title}&rdquo;
              from Canvas. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={deletingId !== null}
                className="flex-1 py-3 border border-gallery-border text-gallery-text text-sm uppercase tracking-widest hover:bg-gallery-subtle transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex-1 py-3 bg-red-500 text-white text-sm uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingId === showDeleteModal.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
