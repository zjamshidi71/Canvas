import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Same list as the admin page. The page hides the UI; THIS is the real guard,
// because anyone could call an API route directly.
export const ADMIN_EMAILS = ["admin@canvas.art", "zjamshidi@mtroyal.ca"];

/** Returns null if the request comes from a logged-in admin, otherwise an error Response. */
export async function requireAdmin(request: Request): Promise<Response | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const { data } = token ? await getSupabaseAdmin().auth.getUser(token) : { data: { user: null } };
  if (!data.user || !ADMIN_EMAILS.includes(data.user.email ?? "")) {
    return Response.json({ error: "Admins only." }, { status: 403 });
  }
  return null;
}
