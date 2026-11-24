"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// Admin "Experiments" tab — the A/B test scoreboard.
//
// Teaching note: with only a handful of clicks, these numbers are NOT
// statistically significant. A real company waits for enough visitors
// before declaring a winner. We show the raw numbers honestly instead of
// pretending a tiny sample proves anything.
// ---------------------------------------------------------------------------

interface Row {
  experiment: string;
  variant: "A" | "B";
  views: number;
  conversions: number;
}

const EXPERIMENT_LABELS: Record<string, { title: string; variants: Record<string, string> }> = {
  generate_button_wording: {
    title: "Description button wording",
    variants: { A: "✨ Generate with AI", B: "✨ Write my description for me" },
  },
};

export default function ExperimentResults() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/experiments/results", {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load results");
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/experiments/results", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load results");
        setRows(data.rows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [session]);

  const byExperiment = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.experiment] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-gallery-text">A/B test results</h2>
          <p className="text-sm text-gallery-muted max-w-xl mt-1">
            Visitors are randomly split into variant A or B the first time they see the feature, then kept on that
            variant. Conversion rate = conversions ÷ views.
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 border border-gallery-border text-xs uppercase tracking-widest text-gallery-text hover:border-gallery-text transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-gallery-muted">Loading…</p>}
      {error && <p className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
      {!loading && !error && !Object.keys(byExperiment).length && (
        <p className="text-sm text-gallery-muted">
          No data yet. Upload an artwork photo on /artwork/new to generate the first events.
        </p>
      )}

      {Object.entries(byExperiment).map(([experiment, variants]) => {
        const meta = EXPERIMENT_LABELS[experiment];
        const sorted = [...variants].sort((a, b) => a.variant.localeCompare(b.variant));
        const best = sorted.reduce((a, b) =>
          b.views > 0 && b.conversions / b.views > (a.views ? a.conversions / a.views : -1) ? b : a
        );
        const totalViews = sorted.reduce((s, r) => s + r.views, 0);

        return (
          <div key={experiment} className="border border-gallery-border bg-white">
            <div className="px-5 py-4 border-b border-gallery-border">
              <h3 className="font-medium text-gallery-text">{meta?.title ?? experiment}</h3>
              {totalViews < 100 && (
                <p className="text-xs text-amber-700 mt-1">
                  Only {totalViews} total views so far — far too few to trust the result. Real experiments run until
                  the sample size is large enough.
                </p>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-gallery-muted border-b border-gallery-border">
                  <th className="px-5 py-3 font-normal">Variant</th>
                  <th className="px-5 py-3 font-normal">Views</th>
                  <th className="px-5 py-3 font-normal">Conversions</th>
                  <th className="px-5 py-3 font-normal">Conversion rate</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const rate = r.views ? (r.conversions / r.views) * 100 : 0;
                  const isLeader = r === best && r.views > 0;
                  return (
                    <tr key={r.variant} className="border-b border-gallery-border last:border-0">
                      <td className="px-5 py-3">
                        <span className="font-medium">{r.variant}</span>
                        {meta && <span className="text-gallery-muted"> — &ldquo;{meta.variants[r.variant]}&rdquo;</span>}
                        {isLeader && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-widest bg-green-100 text-green-800 rounded-full">
                            Leading
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">{r.views}</td>
                      <td className="px-5 py-3">{r.conversions}</td>
                      <td className="px-5 py-3">{rate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
