"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// Admin "Agents" tab — review what each agent did before anything is sent.
// Human in the loop: the agents only DRAFT; an admin clicks Send.
// ---------------------------------------------------------------------------

interface LogEntry {
  agent: "Scout" | "Writer" | "Checker" | "Sender";
  summary: string;
  detail?: unknown;
}

interface Run {
  id: string;
  status: "draft" | "sent" | "skipped" | "failed";
  subject: string | null;
  html: string | null;
  log: LogEntry[];
  created_at: string;
  collectors: { name: string; email: string } | null;
}

const AGENT_COLOURS: Record<LogEntry["agent"], string> = {
  Scout: "bg-teal-100 text-teal-800",
  Writer: "bg-amber-100 text-amber-800",
  Checker: "bg-rose-100 text-rose-800",
  Sender: "bg-slate-200 text-slate-800",
};

const STATUS_COLOURS: Record<Run["status"], string> = {
  draft: "bg-amber-100 text-amber-800",
  sent: "bg-green-100 text-green-800",
  skipped: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

export default function CollectorAgents() {
  const { session } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      return data;
    },
    [session]
  );

  const load = useCallback(async () => {
    try {
      setRuns((await api("/api/agents/runs")).runs);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    if (!session) return;
    api("/api/agents/runs")
      .then((data) => setRuns(data.runs))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [session, api]);

  const runNow = async () => {
    setBusy("run");
    setError(null);
    try {
      await api("/api/agents/runs", { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const send = async (runId: string) => {
    setBusy(runId);
    setError(null);
    try {
      await api("/api/agents/send", { method: "POST", body: JSON.stringify({ runId }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-gallery-text">Collector agents</h2>
          <p className="text-sm text-gallery-muted max-w-xl mt-1">
            Every Monday, four agents run for each opted-in collector: <b>Scout</b> picks works,{" "}
            <b>Writer</b> drafts the email, <b>Checker</b> verifies it, <b>Sender</b> delivers it. Drafts wait here for
            your approval.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={busy !== null}
          className="px-5 py-3 bg-gallery-text text-white text-xs uppercase tracking-widest hover:bg-gallery-accent-hover disabled:opacity-50"
        >
          {busy === "run" ? "Agents working… (about a minute)" : "Run agents now"}
        </button>
      </div>

      {error && <p className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</p>}
      {!runs.length && !error && <p className="text-sm text-gallery-muted">No runs yet. Click “Run agents now”.</p>}

      {runs.map((run) => (
        <div key={run.id} className="border border-gallery-border bg-white">
          <button
            onClick={() => setOpenId(openId === run.id ? null : run.id)}
            className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left"
          >
            <span className={`px-2 py-0.5 text-[11px] uppercase tracking-widest rounded-full ${STATUS_COLOURS[run.status]}`}>
              {run.status}
            </span>
            <span className="font-medium text-gallery-text">{run.collectors?.name}</span>
            <span className="text-sm text-gallery-muted flex-1 truncate">{run.subject ?? "—"}</span>
            <span className="text-xs text-gallery-muted">{new Date(run.created_at).toLocaleString()}</span>
          </button>

          {openId === run.id && (
            <div className="border-t border-gallery-border px-5 py-5 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">What each agent did</h3>
                <ol className="space-y-3">
                  {run.log.map((entry, i) => (
                    <li key={i} className="text-sm">
                      <span className={`inline-block w-20 text-center px-2 py-0.5 mr-2 text-[11px] uppercase tracking-widest rounded ${AGENT_COLOURS[entry.agent]}`}>
                        {entry.agent}
                      </span>
                      {entry.summary}
                      {entry.detail !== undefined && (
                        <pre className="mt-2 p-3 bg-gallery-subtle text-xs whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(entry.detail, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
              {run.html && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">Email preview</h3>
                  <iframe srcDoc={run.html} sandbox="" title="Email preview" className="w-full h-[520px] border border-gallery-border" />
                  {run.status === "draft" && (
                    <button
                      onClick={() => send(run.id)}
                      disabled={busy !== null}
                      className="mt-3 w-full py-3 bg-gallery-text text-white text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      {busy === run.id ? "Sending…" : "Approve & send"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
