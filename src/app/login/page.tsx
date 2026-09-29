"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setSuccess(null);
  };

  const switchTab = (tab: Tab) => {
    resetForm();
    setActiveTab(tab);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (activeTab === "signup") {
      if (name.trim().length < 2) {
        setError("Name must be at least 2 characters.");
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setSubmitting(false);
        return;
      }

      const { error: err } = await signUp(email, password, name);
      if (err) {
        setError(err);
      } else {
        setSuccess(
          "Account created! Check your email to confirm, then sign in."
        );
        setActiveTab("signin");
        setName("");
        setPassword("");
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        router.push("/");
      }
    }

    setSubmitting(false);
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
          <p className="text-gallery-muted text-sm mt-2">
            {activeTab === "signin"
              ? "Welcome back. Sign in to your account."
              : "Create an account to start collecting."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gallery-border mb-8">
          <button
            id="tab-signin"
            onClick={() => switchTab("signin")}
            className={`flex-1 pb-3 text-sm uppercase tracking-widest transition-colors relative ${
              activeTab === "signin"
                ? "text-gallery-text"
                : "text-gallery-muted hover:text-gallery-text"
            }`}
          >
            Sign In
            {activeTab === "signin" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gallery-text" />
            )}
          </button>
          <button
            id="tab-signup"
            onClick={() => switchTab("signup")}
            className={`flex-1 pb-3 text-sm uppercase tracking-widest transition-colors relative ${
              activeTab === "signup"
                ? "text-gallery-text"
                : "text-gallery-muted hover:text-gallery-text"
            }`}
          >
            Sign Up
            {activeTab === "signup" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gallery-text" />
            )}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === "signup" && (
            <div>
              <label
                htmlFor="name"
                className="block text-xs uppercase tracking-widest text-gallery-muted mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm transition-colors"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-widest text-gallery-muted mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-widest text-gallery-muted mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                activeTab === "signup" ? "Min. 6 characters" : "Your password"
              }
              required
              className="w-full px-4 py-3 border border-gallery-border rounded-sm bg-transparent text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-text text-sm transition-colors"
            />
          </div>

          <button
            id="auth-submit"
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting
              ? "Please wait…"
              : activeTab === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Footer text */}
        <p className="text-center text-gallery-muted text-xs mt-8">
          {activeTab === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchTab("signup")}
                className="text-gallery-text underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchTab("signin")}
                className="text-gallery-text underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
