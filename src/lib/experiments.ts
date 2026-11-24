// ---------------------------------------------------------------------------
// A/B testing — client-side half.
//
// Teaching notes:
//   • A visitor is assigned a variant the first time they're seen, using a
//     random id saved in their browser (localStorage). The SAME visitor
//     always gets the SAME variant, so results aren't noise from people
//     switching back and forth.
//   • Assignment is a hash of (sessionId + experiment name) — deterministic,
//     no server round-trip needed, and roughly a 50/50 split.
//   • Every allowed experiment name is listed here AND checked again on the
//     server (/api/experiments/log) — never trust the client with what goes
//     into the database, same rule as the checkout route.
// ---------------------------------------------------------------------------

export const EXPERIMENTS = ["generate_button_wording"] as const;
export type ExperimentName = (typeof EXPERIMENTS)[number];
export type Variant = "A" | "B";

const SESSION_KEY = "canvas_experiment_session";

// A small, fast, non-cryptographic hash — plenty for splitting visitors
// into two buckets. (djb2 algorithm)
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // force unsigned
}

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Deterministically assigns this visitor to "A" or "B" for one experiment. */
export function getVariant(experiment: ExperimentName): Variant {
  return hashString(`${getSessionId()}:${experiment}`) % 2 === 0 ? "A" : "B";
}

/** Records that this visitor saw ("view") or completed ("conversion") the experiment. */
export function logExperimentEvent(
  experiment: ExperimentName,
  variant: Variant,
  event: "view" | "conversion"
) {
  // Fire-and-forget: never let analytics slow down or break the real feature.
  fetch("/api/experiments/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ experiment, variant, event, sessionId: getSessionId() }),
    keepalive: true,
  }).catch(() => {});
}
