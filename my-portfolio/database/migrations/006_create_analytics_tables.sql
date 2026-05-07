-- ============================================
-- First-party Portfolio Analytics
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS analytics_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_retention_days INTEGER NOT NULL DEFAULT 30 CHECK (data_retention_days BETWEEN 1 AND 730),
  tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  respect_do_not_track BOOLEAN NOT NULL DEFAULT true,
  anonymize_ip BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO analytics_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS analytics_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  hashed_ip TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  language TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  user_agent TEXT,
  is_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  entry_path TEXT,
  exit_path TEXT,
  referrer_url TEXT,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  browser TEXT,
  os TEXT,
  is_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  url TEXT,
  title TEXT,
  referrer_url TEXT,
  referrer_domain TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  time_on_page_seconds INTEGER,
  screen_width INTEGER,
  screen_height INTEGER,
  language TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE,
  session_id TEXT REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT,
  path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_visitors_visitor_id ON analytics_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_country ON analytics_visitors(country);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_device_type ON analytics_visitors(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor_id ON analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_referrer_domain ON analytics_sessions(referrer_domain);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON analytics_sessions(country);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_device_type ON analytics_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_viewed_at ON analytics_page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_visitor_id ON analytics_page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_session_id ON analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_path ON analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_referrer_domain ON analytics_page_views(referrer_domain);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON analytics_events(path);

ALTER TABLE analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read analytics settings" ON analytics_settings;
DROP POLICY IF EXISTS "Admin manage analytics settings" ON analytics_settings;
DROP POLICY IF EXISTS "Admin read analytics visitors" ON analytics_visitors;
DROP POLICY IF EXISTS "Admin read analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Admin read analytics page views" ON analytics_page_views;
DROP POLICY IF EXISTS "Admin read analytics events" ON analytics_events;

CREATE POLICY "Admin read analytics settings" ON analytics_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage analytics settings" ON analytics_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin read analytics visitors" ON analytics_visitors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin read analytics sessions" ON analytics_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin read analytics page views" ON analytics_page_views
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin read analytics events" ON analytics_events
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_analytics_settings_updated_at ON analytics_settings;
DROP TRIGGER IF EXISTS trg_analytics_visitors_updated_at ON analytics_visitors;
DROP TRIGGER IF EXISTS trg_analytics_sessions_updated_at ON analytics_sessions;

CREATE TRIGGER trg_analytics_settings_updated_at BEFORE UPDATE ON analytics_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_analytics_visitors_updated_at BEFORE UPDATE ON analytics_visitors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_analytics_sessions_updated_at BEFORE UPDATE ON analytics_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION cleanup_analytics_data(retention_days_arg INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_retention INTEGER;
  cutoff TIMESTAMPTZ;
  deleted_events INTEGER := 0;
  deleted_page_views INTEGER := 0;
  deleted_sessions INTEGER := 0;
  deleted_visitors INTEGER := 0;
BEGIN
  SELECT COALESCE(retention_days_arg, data_retention_days, 30)
  INTO resolved_retention
  FROM analytics_settings
  ORDER BY created_at ASC
  LIMIT 1;

  resolved_retention := LEAST(GREATEST(COALESCE(resolved_retention, 30), 1), 730);
  cutoff := now() - make_interval(days => resolved_retention);

  DELETE FROM analytics_events
  WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted_events = ROW_COUNT;

  DELETE FROM analytics_page_views
  WHERE viewed_at < cutoff;
  GET DIAGNOSTICS deleted_page_views = ROW_COUNT;

  DELETE FROM analytics_sessions s
  WHERE COALESCE(s.ended_at, s.started_at) < cutoff
    AND NOT EXISTS (
      SELECT 1 FROM analytics_page_views pv WHERE pv.session_id = s.session_id
    );
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

  DELETE FROM analytics_visitors v
  WHERE COALESCE(v.last_seen_at, v.first_seen_at) < cutoff
    AND NOT EXISTS (
      SELECT 1 FROM analytics_sessions s WHERE s.visitor_id = v.visitor_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM analytics_page_views pv WHERE pv.visitor_id = v.visitor_id
    );
  GET DIAGNOSTICS deleted_visitors = ROW_COUNT;

  RETURN jsonb_build_object(
    'retention_days', resolved_retention,
    'cutoff', cutoff,
    'deleted_events', deleted_events,
    'deleted_page_views', deleted_page_views,
    'deleted_sessions', deleted_sessions,
    'deleted_visitors', deleted_visitors
  );
END;
$$;

REVOKE ALL ON FUNCTION cleanup_analytics_data(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_analytics_data(INTEGER) TO authenticated;
