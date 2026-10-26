"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getArtistById } from "@/data/artists";
import { createOrder } from "@/data/orders";

export default function CheckoutPage() {
  const { items, subtotal, completeCheckout } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [artistNames, setArtistNames] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtistNames() {
      const names: Record<string, string> = {};
      const uniqueArtistIds = [
        ...new Set(items.map((item) => item.artwork.artistId)),
      ];
      await Promise.all(
        uniqueArtistIds.map(async (id) => {
          const artist = await getArtistById(id);
          if (artist) names[id] = artist.name;
        })
      );
      setArtistNames(names);
    }

    if (items.length > 0) {
      loadArtistNames();
    }
  }, [items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------------------------------------------------------------------
  // handleSubmit — the core of this feature.
  //
  // Previously this used a fake setTimeout. Now it:
  //   1. Calls createOrder() to save the order to the database
  //   2. Only redirects to /confirmation if the save succeeds
  //   3. Shows an error to the user if something goes wrong
  //
  // Teaching note: notice we check result.error BEFORE calling
  // completeCheckout(). If the database fails, we do NOT clear the cart
  // or navigate away — we let the user try again.
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const result = await createOrder({
      userId: user?.id ?? null,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      country: form.country,
      items,
      subtotal,
    });

    if (result.error || !result.order) {
      // Something went wrong — tell the user and let them try again.
      // The cart is NOT cleared because no order was saved.
      setSubmitError(
        result.error ?? "Something went wrong. Please try again."
      );
      setSubmitting(false);
      return;
    }

    // Success — the order is now saved in the database.
    // Pass the real order number (from the DB) to the cart context.
    completeCheckout(result.order.orderNumber);
    router.push("/checkout/confirmation");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gallery-text mb-3">
          Nothing to check out
        </h1>
        <p className="text-gallery-muted mb-8">
          Add some artworks to your cart first.
        </p>
        <Link
          href="/gallery"
          className="px-8 py-3 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
        >
          Browse Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="font-serif text-4xl text-gallery-text mb-10">
          Checkout
        </h1>

        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-16">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full mt-4 px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
              />
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                Shipping Address
              </h2>
              <input
                type="text"
                name="address"
                placeholder="Street address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State / Province"
                  value={form.state}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
                />
                <input
                  type="text"
                  name="zip"
                  placeholder="ZIP / Postal code"
                  value={form.zip}
                  onChange={handleChange}
                  required
                  className="col-span-2 sm:col-span-1 px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
                />
              </div>
              <input
                type="text"
                name="country"
                placeholder="Country"
                value={form.country}
                onChange={handleChange}
                required
                className="w-full mt-4 px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm"
              />
            </div>

            <div className="pt-4 border-t border-gallery-border">
              {/* Error message — shown if the database save fails */}
              {submitError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
                  {submitError}
                </div>
              )}
              <p className="text-sm text-gallery-muted mb-4">
                This is a demo checkout — no payment will be processed.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving order…" : "Place Order"}
              </button>
            </div>
          </form>

          {/* Order summary sidebar */}
          <div className="mt-10 lg:mt-0">
            <div className="lg:sticky lg:top-28 bg-gallery-subtle p-6 rounded-sm">
              <h2 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const artistName =
                    artistNames[item.artwork.artistId] ?? "";
                  return (
                    <div key={item.artwork.id} className="flex gap-3">
                      <div className="relative w-16 h-20 shrink-0 overflow-hidden bg-gallery-card rounded-sm">
                        <Image
                          src={item.artwork.imageUrl}
                          alt={item.artwork.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                        {item.quantity > 1 && (
                          <span className="absolute -top-1 -right-1 bg-gallery-text text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-sm text-gallery-text truncate">
                          {item.artwork.title}
                        </p>
                        <p className="text-xs text-gallery-muted">
                          {artistName}
                        </p>
                      </div>
                      <p className="text-sm text-gallery-text shrink-0">
                        ${(item.artwork.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gallery-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gallery-muted">Subtotal</span>
                  <span className="text-gallery-text">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gallery-muted">Shipping</span>
                  <span className="text-gallery-text">Calculated next</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gallery-border">
                  <span className="text-gallery-text font-medium">Total</span>
                  <span className="font-serif text-xl text-gallery-text">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
