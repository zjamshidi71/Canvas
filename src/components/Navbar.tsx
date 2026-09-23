"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Discover" },
    { href: "/gallery", label: "Gallery" },
    { href: "/stories/the-weight-of-lightness", label: "Stories" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl lg:text-3xl tracking-tight text-gallery-text hover:opacity-70 transition-opacity"
          >
            Canvas
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide uppercase transition-colors duration-200 ${
                  pathname === link.href
                    ? "text-gallery-text"
                    : "text-gallery-muted hover:text-gallery-text"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cart"
              className={`relative text-sm tracking-wide uppercase transition-colors duration-200 ${
                pathname === "/cart"
                  ? "text-gallery-text"
                  : "text-gallery-muted hover:text-gallery-text"
              }`}
            >
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-4 bg-gallery-text text-white text-[10px] font-sans font-medium w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gallery-text"
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-6 border-t border-gallery-border">
            <div className="flex flex-col gap-4 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm tracking-wide uppercase ${
                    pathname === link.href
                      ? "text-gallery-text"
                      : "text-gallery-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/cart"
                className={`text-sm tracking-wide uppercase ${
                  pathname === "/cart"
                    ? "text-gallery-text"
                    : "text-gallery-muted"
                }`}
              >
                Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
