"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect } from "react";

export default function ConfirmationPage() {
  const { isCheckoutComplete, orderNumber, resetCheckout } = useCart();

  // Reset checkout state when leaving this page
  useEffect(() => {
    return () => {
      if (isCheckoutComplete) {
        resetCheckout();
      }
    };
  }, [isCheckoutComplete, resetCheckout]);

  if (!isCheckoutComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gallery-text mb-3">
          No order found
        </h1>
        <p className="text-gallery-muted mb-8">
          It looks like you haven&apos;t placed an order yet.
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg">
        {/* Checkmark icon */}
        <div className="w-20 h-20 rounded-full border-2 border-gallery-text flex items-center justify-center mx-auto mb-8">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-gallery-text"
          >
            <path d="M8 16l6 6 10-12" />
          </svg>
        </div>

        <h1 className="font-serif text-4xl text-gallery-text mb-3">
          Thank You
        </h1>
        <p className="text-gallery-muted text-lg mb-2">
          Your order has been placed successfully.
        </p>
        {orderNumber && (
          <p className="text-sm text-gallery-muted mb-8">
            Order number:{" "}
            <span className="text-gallery-text font-medium">{orderNumber}</span>
          </p>
        )}

        <div className="bg-gallery-subtle p-6 rounded-sm mb-10 text-left">
          <h2 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
            What happens next?
          </h2>
          <ul className="space-y-3 text-sm text-gallery-text">
            <li className="flex gap-3">
              <span className="text-gallery-muted shrink-0">1.</span>
              You&apos;ll receive an order confirmation email shortly.
            </li>
            <li className="flex gap-3">
              <span className="text-gallery-muted shrink-0">2.</span>
              The artist will prepare your work for safe shipping.
            </li>
            <li className="flex gap-3">
              <span className="text-gallery-muted shrink-0">3.</span>
              You&apos;ll receive tracking information once it ships.
            </li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block px-10 py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
        >
          Continue Browsing
        </Link>
      </div>
    </div>
  );
}
