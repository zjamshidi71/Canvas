"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// MarketPulse — Admin-only component
//
// The admin enters a style or topic. Canvas hits POST /api/ai/market-pulse,
// which pulls the top YouTube videos + comments for that topic and asks the
// LLM to extract what real buyers love, ask, and object to about price.
// The output is a structured report with verbatim quote evidence.
//
// Teaching note:
//   Requires YOUTUBE_API_KEY in .env.local (free Google Cloud quota).
//   The AI only sees real comment data — it never invents quotes.
// ---------------------------------------------------------------------------

interface Insight {
  theme: string;
  evidence: string[];
  implication: string;
}

interface Action {
  type: "feature_collection" | "editorial_idea" | "artist_advice";
  suggestion: string;
  rationale: string;
}

interface MarketPulseReport {
  summary: string;
  loves: Insight[];
  questions: Insight[];
  priceObjections: Insight[];
  actions: Action[];
}

const ACTION_LABELS: Record<Action["type"], string> = {
  feature_collection: "Feature Collection",
  editorial_idea: "Editorial Idea",
  artist_advice: "Artist Advice",
};

const ACTION_COLORS: Record<Action["type"], string> = {
  feature_collection: "bg-blue-50 text-blue-700 border-blue-200",
  editorial_idea: "bg-purple-50 text-purple-700 border-purple-200",
  artist_advice: "bg-green-50 text-green-700 border-green-200",
};

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="bg-white border border-gallery-border rounded-sm p-4 space-y-2">
      <p className="text-xs uppercase tracking-widest text-gallery-muted font-medium">
        {insight.theme}
      </p>
      {insight.evidence.map((quote, i) => (
        <blockquote
          key={i}
          className="border-l-2 border-gallery-accent pl-3 text-[13px] text-gallery-text italic leading-relaxed"
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
      ))}
      <p className="text-[13px] text-gallery-muted leading-relaxed pt-1">
        {insight.implication}
      </p>
    </div>
  );
}

export default function MarketPulse() {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [report, setReport] = useState<MarketPulseReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyse = async () => {
    if (!topic.trim() || topic.trim().length < 3) return;
    setState("loading");
    setReport(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/market-pulse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setReport(json);
      setState("done");
    } catch {
      setErrorMsg("Could not reach the server. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gallery-border rounded-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          {/* YouTube-ish icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gallery-muted"
          >
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
            <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
          </svg>
          <h2 className="font-serif text-xl text-gallery-text">Art Market Pulse</h2>
        </div>
        <p className="text-[13px] text-gallery-muted leading-relaxed mb-5">
          Enter an art style or buyer topic. Canvas will pull the top YouTube
          videos and their comments, then extract what the audience loves,
          asks, and objects to — backed by real quotes.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
            placeholder="e.g. abstract painting, buying original art, watercolor…"
            disabled={state === "loading"}
            className="flex-1 px-4 py-2.5 bg-gallery-subtle border border-gallery-border rounded-sm text-sm text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-accent transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleAnalyse}
            disabled={state === "loading" || topic.trim().length < 3}
            className="px-6 py-2.5 bg-gallery-text text-white text-xs uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors disabled:opacity-40"
          >
            {state === "loading" ? "Analysing…" : "Analyse"}
          </button>
        </div>

        {state === "loading" && (
          <p className="text-[11px] text-gallery-muted mt-3 animate-pulse">
            Fetching YouTube data and running AI analysis — this takes 15–30 seconds…
          </p>
        )}
      </div>

      {/* Error */}
      {state === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-5">
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button
            onClick={() => setState("idle")}
            className="text-xs uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors underline underline-offset-4 mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Report */}
      {state === "done" && report && (
        <div className="space-y-8">
          {/* Summary */}
          <div className="bg-white border border-gallery-border rounded-sm p-6">
            <p className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
              Summary — &ldquo;{topic}&rdquo;
            </p>
            <p className="text-[15px] text-gallery-text leading-relaxed">{report.summary}</p>
          </div>

          {/* Loves */}
          {report.loves.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                What They Love
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {report.loves.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {/* Recurring Questions */}
          {report.questions.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                Recurring Questions
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {report.questions.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {/* Price Objections */}
          {report.priceObjections.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                Price Objections
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {report.priceObjections.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {/* Actions for Canvas */}
          {report.actions.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-4">
                Actions for Canvas
              </h3>
              <div className="space-y-3">
                {report.actions.map((action, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gallery-border rounded-sm p-4 flex gap-4"
                  >
                    <span
                      className={`self-start flex-shrink-0 text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full border ${ACTION_COLORS[action.type]}`}
                    >
                      {ACTION_LABELS[action.type]}
                    </span>
                    <div>
                      <p className="text-[14px] text-gallery-text leading-relaxed font-medium">
                        {action.suggestion}
                      </p>
                      <p className="text-[12px] text-gallery-muted mt-1 leading-relaxed">
                        {action.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

