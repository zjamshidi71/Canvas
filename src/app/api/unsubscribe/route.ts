import { getSupabaseAdmin } from "@/lib/supabase-admin";

// GET /api/unsubscribe?token=… — the link at the bottom of every agent email.
// CASL requires a working, no-login unsubscribe in every commercial email.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const valid = /^[0-9a-f-]{36}$/i.test(token);
  const { data } = valid
    ? await getSupabaseAdmin().from("collectors").update({ opted_in: false }).eq("unsubscribe_token", token).select("id")
    : { data: null };
  const message = data?.length
    ? "You've been unsubscribed. You won't receive any more recommendations from Canvas."
    : "This unsubscribe link is invalid or has already been used.";
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:Georgia,serif;max-width:480px;margin:80px auto;padding:0 24px;text-align:center;color:#1a1a1a"><h1>Canvas</h1><p>${message}</p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
