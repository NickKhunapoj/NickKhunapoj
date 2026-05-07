-- ============================================
-- Supabase Pause Prevention Keep-Alive Status
-- ============================================

CREATE TABLE IF NOT EXISTS keepalive_status (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  last_ping_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ping_count BIGINT NOT NULL DEFAULT 0,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE keepalive_status ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON keepalive_status FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON keepalive_status TO service_role;

CREATE OR REPLACE FUNCTION set_keepalive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_keepalive_status_updated_at ON keepalive_status;
CREATE TRIGGER trg_keepalive_status_updated_at
  BEFORE UPDATE ON keepalive_status
  FOR EACH ROW EXECUTE FUNCTION set_keepalive_updated_at();

CREATE OR REPLACE FUNCTION record_keepalive_ping(source_arg TEXT DEFAULT 'vercel-cron')
RETURNS keepalive_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ping keepalive_status;
BEGIN
  INSERT INTO keepalive_status (id, last_ping_at, ping_count, source)
  VALUES ('default', now(), 1, COALESCE(NULLIF(source_arg, ''), 'vercel-cron'))
  ON CONFLICT (id) DO UPDATE
  SET
    last_ping_at = EXCLUDED.last_ping_at,
    ping_count = keepalive_status.ping_count + 1,
    source = EXCLUDED.source,
    updated_at = now()
  RETURNING * INTO ping;

  RETURN ping;
END;
$$;

REVOKE ALL ON FUNCTION record_keepalive_ping(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_keepalive_ping(TEXT) TO service_role;
