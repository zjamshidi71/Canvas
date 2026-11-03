"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ---------------------------------------------------------------------------
// ArtHistoryCompanion
//
// Shown on the artwork detail page. When the visitor clicks "Explore Art History",
// we POST to /api/ai/art-history with the artwork's metadata. The API fetches
// real matches from the Art Institute of Chicago's public collection and asks
// the LLM to write an "In conversation with…" story grounded in those facts.
//
// Teaching note:
//   The story is built from real museum data, so the AI never has to invent
//   anything. This sidesteps the "never invent" rule while giving buyers the
//   historical context that justifies the price.
// ---------------------------------------------------------------------------

interface MuseumWork {
  id: number;
  title: string;
  artist: string;
  year: string;
  imageId: string | null;
  imageUrl: string | null;
  url: string;
}

interface ArtHistoryData {
  story: string;
  museumWorks: MuseumWork[];
}

interface Props {
  title: string;
  medium: string;
  description: string;
}

export default function ArtHistoryCompanion({ title, medium, description }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<ArtHistoryData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleExplore = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/ai/art-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, medium, description }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      if (!json.story && json.museumWorks?.length === 0) {
        setErrorMsg("No museum connections found for this artwork.");
        setState("error");
        return;
      }
      setData(json);
      setState("done");
    } catch {
      setErrorMsg("Could not reach the server. Please try again.");
      setState("error");
    }
  };

  // ── Idle state ──────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <div className="pt-6 border-t border-gallery-border">
        <div className="flex items-start gap-3 mb-3">
          {/* Small museum icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gallery-muted mt-0.5 flex-shrink-0"
          >
            <path d="M3 21h18M3 10h18M12 3L3 10h18L12 3zM9 21V10M15 21V10" />
          </svg>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-1">
              Art History Companion
            </h3>
            <p className="text-[13px] text-gallery-muted leading-relaxed">
              Discover how this piece connects to works in the Art Institute of
              Chicago&apos;s collection.
            </p>
          </div>
        </div>
        <button
          onClick={handleExplore}
          className="w-full py-3 border border-gallery-border text-gallery-text text-xs uppercase tracking-widest hover:bg-gallery-subtle transition-colors"
        >
          Explore Art History
        </button>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="pt-6 border-t border-gallery-border">
        <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
          Art History Companion
        </h3>
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-gallery-subtle rounded w-full" />
          <div className="h-3 bg-gallery-subtle rounded w-5/6" />
          <div className="h-3 bg-gallery-subtle rounded w-4/6" />
          <div className="mt-4 flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-20 h-20 bg-gallery-subtle rounded-sm" />
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gallery-muted mt-3">
          Searching museum archives…
        </p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="pt-6 border-t border-gallery-border">
        <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
          Art History Companion
        </h3>
        <p className="text-[13px] text-gallery-muted mb-3">{errorMsg}</p>
        <button
          onClick={() => setState("idle")}
          className="text-xs uppercase tracking-widest text-gallery-muted hover:text-gallery-text transition-colors underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Done state ───────────────────────────────────────────────────────────
  if (!data) return null;

  return (
    <div className="pt-6 border-t border-gallery-border space-y-5">
      <div className="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gallery-muted flex-shrink-0"
        >
          <path d="M3 21h18M3 10h18M12 3L3 10h18L12 3zM9 21V10M15 21V10" />
        </svg>
        <h3 className="text-xs uppercase tracking-widest text-gallery-muted">
          In Conversation With…
        </h3>
      </div>

      {/* The LLM-written story */}
      <p className="text-[14px] text-gallery-text leading-relaxed">{data.story}</p>

      {/* Museum thumbnails */}
      {data.museumWorks.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {data.museumWorks.map((work) => (
            <Link
              key={work.id}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex-shrink-0"
              title={`${work.title} — ${work.artist} (${work.year})`}
            >
              <div className="relative w-20 h-20 overflow-hidden bg-gallery-subtle rounded-sm border border-gallery-border group-hover:border-gallery-accent transition-colors">
                {work.imageUrl ? (
                  <Image
                    src={work.imageUrl}
                    alt={`${work.title}, ${work.artist}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="80px"
                    unoptimized // AIC CDN — Next.js image optimization can't proxy it
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[9px] text-gallery-muted text-center px-1">
                      No image
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gallery-muted mt-1 w-20 truncate">
                {work.artist.split(",")[0]}
              </p>
              <p className="text-[10px] text-gallery-muted w-20 truncate">{work.year}</p>
            </Link>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gallery-muted">
        Museum works courtesy of the{" "}
        <Link
          href="https://www.artic.edu"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gallery-text transition-colors"
        >
          Art Institute of Chicago
        </Link>
        {" "}open collection.
      </p>
    </div>
  );
}

