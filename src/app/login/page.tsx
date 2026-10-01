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

  const { signIn, signUp, signInWithGoogle } = useAuth();
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

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gallery-border" />
          <span className="text-xs uppercase tracking-widest text-gallery-muted">or</span>
          <div className="flex-1 h-px bg-gallery-border" />
        </div>

        {/* Google Sign In */}
        <button
          id="google-signin"
          type="button"
          onClick={async () => {
            setError(null);
            const { error: err } = await signInWithGoogle();
            if (err) setError(err);
          }}
          className="w-full py-4 border border-gallery-border rounded-sm text-sm tracking-wide text-gallery-text hover:bg-gallery-subtle transition-colors flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

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
