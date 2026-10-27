import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Server-only Supabase client using the SERVICE ROLE key.
//
// Teaching note:
//   The service role key BYPASSES Row Level Security. We need it for the
//   Stripe webhook, because Stripe (not a logged-in user) is the one telling
//   us an order was paid. Never import this file from a "use client" component
//   and never give this key a NEXT_PUBLIC_ prefix.
// ---------------------------------------------------------------------------
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  adminClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  return adminClient;
}
