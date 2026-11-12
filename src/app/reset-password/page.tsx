"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// /reset-password
//
// Supabase sends the user here after they click the password-reset email link.
// The URL contains a recovery token that the Supabase client automatically
// turns into a (temporary) signed-in session.
//
// Once that session exists we show a "Set new password" form.
// On submit we call supabase.auth.updateUser() — Supabase validates the
// recovery session server-side and updates the password.
// ---------------------------------------------------------------------------

type PageState = "waiting" | "ready" | "submitting" | "success" | "expired";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If Supabase rejected the link, it tells us in the URL, e.g.
    //   /reset-password#error=access_denied&error_code=otp_expired
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    if (hashParams.get("error") || queryParams.get("error")) {
      // Defer the state update so it doesn't run synchronously in the effect
      queueMicrotask(() => setPageState("expired"));
      return;
    }

    // The Supabase client reads the recovery token from the URL as soon as
    // the app loads — often BEFORE this page mounts. So the PASSWORD_RECOVERY
    // event may already have fired and we'd miss it.
    //
    // Instead we ask for the current session. getSession() waits until
    // Supabase has finished processing the link, so:
    //   • session exists → the link was valid → show the form
    //   • no session     → the link was invalid or already used
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setPageState((prev) =>
        prev === "waiting" ? (session ? "ready" : "expired") : prev
      );
    });

    // Still listen for the event in case it arrives after getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setPageState((prev) => (prev === "expired" || prev === "waiting" ? "ready" : prev));
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setPageState("submitting");

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setPageState("ready");
      return;
    }

    setPageState("success");
    // Sign out the recovery session so the user logs in fresh
    await supabase.auth.signOut();

    // Redirect to login after a short delay
    setTimeout(() => router.push("/login"), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-serif text-3xl tracking-tight text-gallery-text hover:opacity-70 transition-opacity"
          >
            Canvas
          </Link>
          <p className="text-gallery-muted text-sm mt-2">Reset your password</p>
        </div>

        {/* ── Waiting for recovery token ── */}
        {pageState === "waiting" && (
          <div className="text-center py-12">
            <div className="animate-pulse text-gallery-muted text-sm">
              Verifying reset link…
            </div>
          </div>
        )}

        {/* ── Link expired / invalid ── */}
        {pageState === "expired" && (
          <div className="space-y-6 text-center">
            <div className="px-4 py-5 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-sm">
              This reset link has expired or has already been used. Please
              request a new one.
            </div>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-gallery-text text-white text-xs uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {/* ── Set new password form ── */}
        {(pageState === "ready" || pageState === "submitting") && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-widest text-gallery-muted mb-2"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                autoFocus
                className="w-full px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs uppercase tracking-widest text-gallery-muted mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                required
                className="w-full px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={pageState === "submitting"}
              className="w-full py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {pageState === "submitting" ? "Saving…" : "Set New Password"}
            </button>
          </form>
        )}

        {/* ── Success ── */}
        {pageState === "success" && (
          <div className="space-y-6 text-center">
            <div className="px-4 py-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-sm">
              Password updated! Redirecting you to sign in…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
