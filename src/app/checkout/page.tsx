"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getArtistById } from "@/data/artists";

export default function CheckoutPage() {
  const { items, subtotal, completeCheckout } = useCart();
  const router = useRouter();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate processing delay
    setTimeout(() => {
      completeCheckout();
      router.push("/checkout/confirmation");
    }, 1500);
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
              <p className="text-sm text-gallery-muted mb-4">
                This is a mock checkout — no payment will be processed.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing…" : "Place Order"}
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
                  const artist = getArtistById(item.artwork.artistId);
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
                          {artist?.name}
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
