"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getArtistById } from "@/data/artists";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gallery-border mx-auto"
          >
            <rect x="8" y="16" width="48" height="40" rx="2" />
            <path d="M20 16V12a12 12 0 1 1 24 0v4" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-gallery-text mb-3">
          Your cart is empty
        </h1>
        <p className="text-gallery-muted mb-8 max-w-sm">
          Discover something extraordinary in our gallery and add it to your
          collection.
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
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="font-serif text-4xl text-gallery-text mb-2">Cart</h1>
        <p className="text-gallery-muted mb-10">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </p>

        {/* Cart items */}
        <div className="space-y-0">
          {items.map((item) => {
            const artist = getArtistById(item.artwork.artistId);
            return (
              <div
                key={item.artwork.id}
                className="flex gap-5 py-6 border-t border-gallery-border"
              >
                {/* Thumbnail */}
                <Link
                  href={`/artwork/${item.artwork.slug}`}
                  className="shrink-0 relative w-24 h-28 sm:w-28 sm:h-32 overflow-hidden bg-gallery-subtle rounded-sm"
                >
                  <Image
                    src={item.artwork.imageUrl}
                    alt={item.artwork.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <Link
                      href={`/artwork/${item.artwork.slug}`}
                      className="font-serif text-lg text-gallery-text hover:opacity-70 transition-opacity block truncate"
                    >
                      {item.artwork.title}
                    </Link>
                    <p className="text-sm text-gallery-muted mt-0.5">
                      {artist?.name} · {item.artwork.medium}
                    </p>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    <div className="flex items-center border border-gallery-border rounded-sm">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.artwork.id,
                            item.quantity - 1
                          )
                        }
                        className="px-3 py-1.5 text-gallery-muted hover:text-gallery-text transition-colors text-sm"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-3 py-1.5 text-sm text-gallery-text border-x border-gallery-border min-w-[40px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.artwork.id,
                            item.quantity + 1
                          )
                        }
                        className="px-3 py-1.5 text-gallery-muted hover:text-gallery-text transition-colors text-sm"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.artwork.id)}
                      className="text-sm text-gallery-muted hover:text-gallery-text underline underline-offset-4 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="shrink-0 text-right">
                  <p className="font-serif text-lg text-gallery-text">
                    ${(item.artwork.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="border-t border-gallery-border mt-2 pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gallery-muted">Subtotal</span>
            <span className="font-serif text-2xl text-gallery-text">
              ${subtotal.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gallery-muted mb-6">
            Shipping and taxes calculated at checkout.
          </p>
          <Link
            href="/checkout"
            className="block w-full py-4 text-center bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/gallery"
            className="block w-full py-4 text-center text-gallery-muted text-sm uppercase tracking-widest hover:text-gallery-text transition-colors mt-2"
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
