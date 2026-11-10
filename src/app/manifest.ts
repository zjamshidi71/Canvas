import type { MetadataRoute } from "next";

// ---------------------------------------------------------------------------
// Web App Manifest — makes Canvas installable as an app (a "PWA").
// Next.js serves this at /manifest.webmanifest and links it automatically.
//
//   • iPhone:  Safari → Share → "Add to Home Screen"
//   • Android: Chrome → menu → "Install app"
// ---------------------------------------------------------------------------
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Canvas — Original Art",
    short_name: "Canvas",
    description: "Discover and collect original contemporary art.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#1A1A1A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
