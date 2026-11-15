-- ===========================================================================
-- Collector agents: weekly personalised recommendation emails
-- Run once in Supabase → SQL Editor → New query → Run.
--
-- Tables
--   collectors            people who may receive recommendations (opt-in!)
--   saved_artworks        works a collector saved (their taste)
--   recommendations_sent  memory: what we already recommended (no repeats)
--   agent_runs            one row per collector per run: draft, log, status
--
-- Security: RLS is enabled with NO policies, so only the server (service
-- role key) can read or write these tables — never the browser.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS collectors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  opted_in           BOOLEAN NOT NULL DEFAULT FALSE,   -- CASL: consent required
  unsubscribe_token  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_artworks (
  collector_id  UUID NOT NULL REFERENCES collectors(id) ON DELETE CASCADE,
  artwork_id    TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collector_id, artwork_id)
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id  UUID NOT NULL REFERENCES collectors(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'skipped', 'failed')),
  subject       TEXT,
  html          TEXT,
  picks         JSONB NOT NULL DEFAULT '[]',
  log           JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recommendations_sent (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id  UUID NOT NULL REFERENCES collectors(id) ON DELETE CASCADE,
  artwork_id    TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  run_id        UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE collectors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_artworks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations_sent ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Demo data: three collectors with different tastes
-- ---------------------------------------------------------------------------
INSERT INTO collectors (name, email, opted_in) VALUES
  ('Priya Shah',   'priya.demo@example.com',  TRUE),   -- loves photography
  ('Marcus Lee',   'marcus.demo@example.com', TRUE),   -- affordable abstract prints
  ('Sofia Romero', 'sofia.demo@example.com',  TRUE),   -- large abstract paintings
  ('Dev Patel',    'dev.demo@example.com',    FALSE)   -- did NOT opt in: must be skipped
ON CONFLICT (email) DO NOTHING;

INSERT INTO saved_artworks (collector_id, artwork_id)
SELECT c.id, s.artwork_id
FROM (VALUES
  ('priya.demo@example.com',  'art-2'),   -- Station No. 7
  ('priya.demo@example.com',  'art-9'),   -- The Clearing
  ('marcus.demo@example.com', 'art-8'),   -- Parallel 45°
  ('marcus.demo@example.com', 'art-3'),   -- Tessellation III
  ('sofia.demo@example.com',  'art-1'),   -- Dissolving Meridian
  ('sofia.demo@example.com',  'art-4'),   -- Harbour Fragments
  ('dev.demo@example.com',    'art-6')    -- Monument for No One
) AS s(email, artwork_id)
JOIN collectors c ON c.email = s.email
ON CONFLICT DO NOTHING;
