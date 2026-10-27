import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Server-side Stripe client.
//
// Teaching note:
//   STRIPE_SECRET_KEY has NO "NEXT_PUBLIC_" prefix, so Next.js never sends it
//   to the browser. Only import this file from server code (API routes,
//   Server Actions). The secret key can move money — treat it like a password.
//
//   The client is created lazily (on first use) so `next build` doesn't crash
//   if the environment variable isn't set yet.
// ---------------------------------------------------------------------------
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripeClient;
}
