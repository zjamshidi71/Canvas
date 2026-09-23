import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gallery-border bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="font-serif text-2xl tracking-tight text-gallery-text"
            >
              Canvas
            </Link>
            <p className="mt-3 text-sm text-gallery-muted leading-relaxed max-w-xs">
              An online gallery for discovering and collecting original
              contemporary art from emerging and established artists.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Discover" },
                { href: "/gallery", label: "Gallery" },
                { href: "/stories/the-weight-of-lightness", label: "Stories" },
                { href: "/cart", label: "Cart" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gallery-muted hover:text-gallery-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
              About
            </h4>
            <p className="text-sm text-gallery-muted leading-relaxed">
              Canvas is a concept project demonstrating a modern art gallery
              and marketplace experience. All artworks and artists shown are
              fictional sample data.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gallery-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gallery-muted">
            &copy; {new Date().getFullYear()} Canvas. All rights reserved.
          </p>
          <p className="text-xs text-gallery-muted">
            Designed with care for the art of looking.
          </p>
        </div>
      </div>
    </footer>
  );
}
