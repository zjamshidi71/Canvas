"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getArtworks, deleteArtwork } from "@/data/artworks";
import { getArtists } from "@/data/artists";
import { getDashboardStats, DashboardStats } from "@/data/dashboard";
import { getAllOrders } from "@/data/orders";
import { Artwork, Artist, Order } from "@/types";

// ---------------------------------------------------------------------------
// Hard-coded admin email(s). In production you'd use a "role" column in your
// Supabase users table, but for this project a simple allowlist works.
// ---------------------------------------------------------------------------
const ADMIN_EMAILS = ["admin@canvas.art", "zjamshidi@mtroyal.ca"];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "artworks" | "artists" | "orders">("overview");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Artwork | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user && ADMIN_EMAILS.includes(user.email ?? "");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [statsData, artworksData, artistsData, ordersData] = await Promise.all([
      getDashboardStats(),
      getArtworks(),
      getArtists(),
      getAllOrders(),
    ]);
    setStats(statsData);
    setArtworks(artworksData);
    setArtists(artistsData);
    setOrders(ordersData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    setDeletingId(showDeleteModal.id);
    const result = await deleteArtwork(showDeleteModal.id);
    if (result.success) {
      setArtworks((prev) => prev.filter((a) => a.id !== showDeleteModal.id));
      setShowDeleteModal(null);
      // Refresh stats
      const updatedStats = await getDashboardStats();
      setStats(updatedStats);
    } else {
      alert(result.error || "Failed to delete artwork.");
    }
    setDeletingId(null);
  };

  // Helper to get artist name by ID
  const getArtistName = (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name ?? "Unknown Artist";
  };

  // Filtered artworks for search
  const filteredArtworks = artworks.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.medium.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getArtistName(a.artistId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---- Auth gate ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gallery-muted">Loading…</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 mb-6 rounded-full bg-gallery-subtle flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gallery-muted">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-gallery-text mb-4">
          Admin Access Only
        </h1>
        <p className="text-gallery-muted mb-6 max-w-md">
          This area is restricted to Canvas administrators. If you believe you
          should have access, contact the site owner.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gallery-subtle/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gallery-text flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="text-xs uppercase tracking-widest text-gallery-muted">
              Admin Panel
            </p>
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-gallery-text mb-2">
            Dashboard
          </h1>
          <p className="text-gallery-muted leading-relaxed">
            Overview of the Canvas marketplace. Manage artworks, artists, and
            monitor platform health.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gallery-border">
          {(["overview", "artworks", "artists", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-gallery-text text-gallery-text"
                  : "border-transparent text-gallery-muted hover:text-gallery-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-gallery-muted">
              Loading dashboard data…
            </div>
          </div>
        ) : (
          <>
            {/* ====== OVERVIEW TAB ====== */}
            {activeTab === "overview" && stats && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Artworks"
                    value={stats.totalArtworks.toString()}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Total Artists"
                    value={stats.totalArtists.toString()}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Total Ratings"
                    value={stats.totalRatings.toString()}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Total Orders"
                    value={stats.totalOrders.toString()}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Avg. Price"
                    value={`$${Math.round(stats.averagePrice).toLocaleString()}`}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    }
                  />
                </div>

                {/* Highest price highlight */}
                <div className="bg-white border border-gallery-border p-6 rounded-sm">
                  <p className="text-xs uppercase tracking-widest text-gallery-muted mb-1">
                    Highest Listed Price
                  </p>
                  <p className="font-serif text-4xl text-gallery-text">
                    ${stats.highestPrice.toLocaleString()}
                  </p>
                </div>

                {/* Medium Breakdown */}
                <div className="bg-white border border-gallery-border p-6 rounded-sm">
                  <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-5">
                    Artworks by Medium
                  </h3>
                  <div className="space-y-3">
                    {stats.mediumBreakdown.map((item) => {
                      const percentage =
                        stats.totalArtworks > 0
                          ? (item.count / stats.totalArtworks) * 100
                          : 0;
                      return (
                        <div key={item.medium}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gallery-text capitalize">
                              {item.medium}
                            </span>
                            <span className="text-gallery-muted">
                              {item.count} ({Math.round(percentage)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gallery-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gallery-text rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gallery-border p-6 rounded-sm">
                  <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-5">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/artwork/new"
                      className="py-3 px-4 border border-gallery-border text-center text-sm text-gallery-text uppercase tracking-widest hover:bg-gallery-subtle transition-colors"
                    >
                      + Add Artwork
                    </Link>
                    <button
                      onClick={() => setActiveTab("artworks")}
                      className="py-3 px-4 border border-gallery-border text-center text-sm text-gallery-text uppercase tracking-widest hover:bg-gallery-subtle transition-colors"
                    >
                      Manage Artworks
                    </button>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="py-3 px-4 border border-gallery-border text-center text-sm text-gallery-text uppercase tracking-widest hover:bg-gallery-subtle transition-colors"
                    >
                      View Orders
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ====== ARTWORKS TAB ====== */}
            {activeTab === "artworks" && (
              <div>
                {/* Search & count */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <p className="text-sm text-gallery-muted">
                    {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? "s" : ""}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search artworks…"
                    className="w-full sm:w-64 px-4 py-2 bg-white border border-gallery-border rounded-sm text-sm text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-accent transition-colors"
                  />
                </div>

                {/* Table */}
                <div className="bg-white border border-gallery-border rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gallery-border bg-gallery-subtle/50">
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium">
                            Artwork
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium hidden md:table-cell">
                            Artist
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium hidden sm:table-cell">
                            Medium
                          </th>
                          <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium">
                            Price
                          </th>
                          <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArtworks.map((artwork) => (
                          <tr
                            key={artwork.id}
                            className="border-b border-gallery-border last:border-0 hover:bg-gallery-subtle/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-gallery-subtle rounded-sm">
                                  <Image
                                    src={artwork.imageUrl}
                                    alt={artwork.title}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                </div>
                                <Link
                                  href={`/artwork/${artwork.slug}`}
                                  className="font-medium text-gallery-text hover:opacity-70 transition-opacity truncate max-w-[200px]"
                                >
                                  {artwork.title}
                                </Link>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gallery-muted hidden md:table-cell">
                              {getArtistName(artwork.artistId)}
                            </td>
                            <td className="px-4 py-3 text-gallery-muted capitalize hidden sm:table-cell">
                              {artwork.medium}
                            </td>
                            <td className="px-4 py-3 text-right text-gallery-text font-medium">
                              ${artwork.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/artwork/${artwork.slug}/edit`}
                                  className="text-xs uppercase tracking-widest text-gallery-muted hover:text-gallery-text transition-colors"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => setShowDeleteModal(artwork)}
                                  className="text-xs uppercase tracking-widest text-gallery-muted hover:text-red-500 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredArtworks.length === 0 && (
                    <div className="py-12 text-center text-gallery-muted text-sm">
                      No artworks found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== ARTISTS TAB ====== */}
            {activeTab === "artists" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.map((artist) => {
                  const artistArtworks = artworks.filter(
                    (a) => a.artistId === artist.id
                  );
                  return (
                    <div
                      key={artist.id}
                      className="bg-white border border-gallery-border rounded-sm p-5 hover:border-gallery-accent transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-full bg-gallery-subtle">
                          <Image
                            src={artist.photoUrl}
                            alt={artist.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/artist/${artist.slug}`}
                            className="font-serif text-lg text-gallery-text hover:opacity-70 transition-opacity block truncate"
                          >
                            {artist.name}
                          </Link>
                          <p className="text-xs text-gallery-muted capitalize">
                            {artist.speciality}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm border-t border-gallery-border pt-3">
                        <span className="text-gallery-muted">
                          {artistArtworks.length} artwork{artistArtworks.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-gallery-text font-medium">
                          $
                          {artistArtworks
                            .reduce((s, a) => s + a.price, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {artists.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gallery-muted text-sm">
                    No artists found.
                  </div>
                )}
              </div>
            )}

            {/* ====== ORDERS TAB ====== */}
            {activeTab === "orders" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gallery-muted">
                    {orders.length} order{orders.length !== 1 ? "s" : ""} total
                  </p>
                </div>
                <div className="bg-white border border-gallery-border rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gallery-border bg-gallery-subtle/50">
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium">
                            Order #
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium">
                            Buyer
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium hidden md:table-cell">
                            Email
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium hidden lg:table-cell">
                            City
                          </th>
                          <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium">
                            Total
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium hidden sm:table-cell">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gallery-muted font-medium hidden lg:table-cell">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-gallery-border last:border-0 hover:bg-gallery-subtle/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-gallery-text">
                              {order.orderNumber}
                            </td>
                            <td className="px-4 py-3 text-gallery-text">
                              {order.firstName} {order.lastName}
                            </td>
                            <td className="px-4 py-3 text-gallery-muted hidden md:table-cell">
                              {order.email}
                            </td>
                            <td className="px-4 py-3 text-gallery-muted hidden lg:table-cell">
                              {order.city}, {order.country}
                            </td>
                            <td className="px-4 py-3 text-right text-gallery-text font-medium">
                              ${order.subtotal.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-medium ${
                                order.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : order.status === "confirmed"
                                  ? "bg-blue-100 text-blue-700"
                                  : order.status === "shipped"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-green-100 text-green-700"
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gallery-muted text-xs hidden lg:table-cell">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {orders.length === 0 && (
                    <div className="py-12 text-center text-gallery-muted text-sm">
                      No orders yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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

// ---------------------------------------------------------------------------
// Reusable stat card component for the overview tab
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gallery-border p-5 rounded-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gallery-muted">
          {label}
        </p>
        <div className="text-gallery-muted">{icon}</div>
      </div>
      <p className="font-serif text-3xl text-gallery-text">{value}</p>
    </div>
  );
}
