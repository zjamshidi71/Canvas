import type { CapacitorConfig } from "@capacitor/cli";

// ---------------------------------------------------------------------------
// Capacitor turns Canvas into native Android and iOS apps.
//
// Teaching note:
//   Canvas needs a server (AI routes, Stripe, Supabase), so the app can't be
//   bundled as static files. Instead the native app opens our live Vercel
//   site (server.url). Every web deploy updates the app instantly — no app
//   store resubmission needed for normal changes.
//
//   mobile/www only holds a fallback page shown if the site can't load.
// ---------------------------------------------------------------------------
const config: CapacitorConfig = {
  appId: "ca.mru.canvas",
  appName: "Canvas",
  webDir: "mobile/www",
  server: {
    url: "https://canvas-ten-virid.vercel.app",
    errorPath: "index.html",
  },
  backgroundColor: "#FAFAF8",
};

export default config;
