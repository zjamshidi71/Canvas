-- ===========================================================================
-- A/B testing: one table holds every "view" and "conversion" event.
-- Run once in Supabase → SQL Editor → New query → Run.
--
-- Teaching idea: this is the whole mechanism behind A/B testing tools like
-- Optimizely or PostHog, just small enough to read in one sitting.
--   • A visitor is randomly assigned a variant (A or B), remembered by a
--     browser-generated session id (no login needed).
--   • Every time they SEE the thing being tested → one "view" row.
--   • Every time they DO the target action → one "conversion" row.
--   • Conversion rate = conversions ÷ views, compared across variants.
--
-- Security: RLS is enabled with NO policies, so only the server (service
-- role key) can read or write — never the browser directly. The browser
-- calls our own /api/experiments/log route instead of Supabase directly.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS experiment_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment  TEXT NOT NULL,
  variant     TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  event       TEXT NOT NULL CHECK (event IN ('view', 'conversion')),
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experiment_events_lookup
  ON experiment_events (experiment, variant, event);

ALTER TABLE experiment_events ENABLE ROW LEVEL SECURITY;
