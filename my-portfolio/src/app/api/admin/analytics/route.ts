import { NextRequest, NextResponse } from 'next/server';
import {
  ANALYTICS_SETTINGS_ID,
  clampInteger,
  createAnalyticsAdminClient,
  getAnalyticsSettings,
  requireAdminUser,
  shortId,
} from '@/lib/analytics/server';

export const runtime = 'nodejs';

interface AnalyticsPageView {
  id: string;
  visitor_id: string;
  session_id: string;
  path: string;
  url: string | null;
  title: string | null;
  referrer_url: string | null;
  referrer_domain: string | null;
  viewed_at: string;
  time_on_page_seconds: number | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  timezone: string | null;
}

interface AnalyticsSession {
  session_id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  entry_path: string | null;
  exit_path: string | null;
  referrer_url: string | null;
  referrer_domain: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_bot: boolean | null;
}

function toDateRange(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const preset = params.get('range') || '30d';
  const now = new Date();
  const to = params.get('to') ? new Date(`${params.get('to')}T23:59:59.999Z`) : now;
  let from: Date;

  if (preset === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (preset === 'custom' && params.get('from')) {
    from = new Date(`${params.get('from')}T00:00:00.000Z`);
  } else {
    const days = preset === '7d' ? 7 : 30;
    from = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
  }

  return { from, to, preset };
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item) || 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function topLabel(items: Array<{ label: string; value: number }>) {
  return items.find((item) => item.label !== 'Unknown')?.label || 'Unknown';
}

function bucketKey(dateString: string, hourly: boolean) {
  const date = new Date(dateString);
  if (hourly) {
    const hour = String(date.getHours()).padStart(2, '0');
    return `${date.toISOString().slice(0, 10)} ${hour}:00`;
  }
  return date.toISOString().slice(0, 10);
}

function buildSeries(views: AnalyticsPageView[], from: Date, to: Date) {
  const hourly = to.getTime() - from.getTime() <= 36 * 60 * 60 * 1000;
  const buckets = new Map<string, { pageViews: number; visitors: Set<string> }>();

  for (const view of views) {
    const key = bucketKey(view.viewed_at, hourly);
    const entry = buckets.get(key) || { pageViews: 0, visitors: new Set<string>() };
    entry.pageViews += 1;
    entry.visitors.add(view.visitor_id);
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .map(([label, value]) => ({
      label,
      pageViews: value.pageViews,
      visitors: value.visitors.size,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function averageDuration(sessions: AnalyticsSession[]) {
  const durations = sessions
    .map((session) => session.duration_seconds)
    .filter((duration): duration is number => typeof duration === 'number' && duration >= 0);

  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
}

function campaignLabel(session: AnalyticsSession) {
  const parts = [session.utm_campaign, session.utm_source, session.utm_medium].filter(Boolean);
  return parts.length ? parts.join(' / ') : null;
}

export async function GET(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from, to, preset } = toDateRange(request);
  const params = request.nextUrl.searchParams;
  const pathFilter = (params.get('path') || '').trim().toLowerCase();
  const referrerFilter = (params.get('referrer') || '').trim().toLowerCase();
  const countryFilter = (params.get('country') || '').trim().toLowerCase();
  const deviceFilter = (params.get('device') || '').trim().toLowerCase();
  const admin = createAnalyticsAdminClient();
  const settings = await getAnalyticsSettings();

  const { data: viewsData, error: viewsError } = await admin
    .from('analytics_page_views')
    .select('*')
    .gte('viewed_at', from.toISOString())
    .lte('viewed_at', to.toISOString())
    .order('viewed_at', { ascending: false })
    .limit(5000);

  if (viewsError) return NextResponse.json({ error: viewsError.message }, { status: 500 });

  const { data: sessionsData, error: sessionsError } = await admin
    .from('analytics_sessions')
    .select('*')
    .gte('started_at', from.toISOString())
    .lte('started_at', to.toISOString())
    .order('started_at', { ascending: false })
    .limit(5000);

  if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });

  const sessions = (sessionsData || []) as AnalyticsSession[];
  const sessionMap = new Map(sessions.map((session) => [session.session_id, session]));
  const views = ((viewsData || []) as AnalyticsPageView[]).filter((view) => {
    const session = sessionMap.get(view.session_id);
    if (pathFilter && !view.path.toLowerCase().includes(pathFilter)) return false;
    if (referrerFilter && !(view.referrer_domain || session?.referrer_domain || '').toLowerCase().includes(referrerFilter)) return false;
    if (countryFilter && !(session?.country || '').toLowerCase().includes(countryFilter)) return false;
    if (deviceFilter && !(session?.device_type || '').toLowerCase().includes(deviceFilter)) return false;
    return true;
  });

  const filteredSessionIds = new Set(views.map((view) => view.session_id));
  const filteredSessions = sessions.filter((session) => filteredSessionIds.has(session.session_id));
  const referrers = countBy(filteredSessions, (session) => session.referrer_domain);
  const countries = countBy(filteredSessions, (session) => session.country);
  const cities = countBy(filteredSessions, (session) => session.city);
  const devices = countBy(filteredSessions, (session) => session.device_type);
  const browsers = countBy(filteredSessions, (session) => session.browser);
  const topPages = countBy(views, (view) => view.path).slice(0, 12);
  const utmCampaigns = countBy(filteredSessions, campaignLabel).slice(0, 12);
  const uniqueVisitors = new Set(views.map((view) => view.visitor_id));

  const recentViews = views.slice(0, 50).map((view) => {
    const session = sessionMap.get(view.session_id);
    return {
      id: view.id,
      viewedAt: view.viewed_at,
      path: view.path,
      title: view.title,
      referrer: view.referrer_domain || session?.referrer_domain || 'Direct',
      country: session?.country || 'Unknown',
      city: session?.city || '',
      device: session?.device_type || 'unknown',
      browser: session?.browser || 'Unknown',
      os: session?.os || 'Unknown',
      sessionId: view.session_id,
      sessionShort: shortId(view.session_id),
      visitorId: view.visitor_id,
      visitorShort: shortId(view.visitor_id),
      timeOnPage: view.time_on_page_seconds,
    };
  });

  const sessionDetails = Array.from(filteredSessionIds).slice(0, 100).map((sessionId) => {
    const session = sessionMap.get(sessionId);
    return {
      session,
      views: views
        .filter((view) => view.session_id === sessionId)
        .sort((a, b) => new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime()),
    };
  });

  return NextResponse.json({
    range: { preset, from: from.toISOString(), to: to.toISOString() },
    settings,
    summary: {
      pageViews: views.length,
      uniqueVisitors: uniqueVisitors.size,
      sessions: filteredSessionIds.size,
      averageSessionDuration: averageDuration(filteredSessions),
      topReferrer: topLabel(referrers),
      topCountry: topLabel(countries),
    },
    series: buildSeries(views, from, to),
    breakdowns: {
      devices: devices.slice(0, 8),
      browsers: browsers.slice(0, 8),
      referrers: referrers.slice(0, 12),
      countries: countries.slice(0, 12),
      cities: cities.slice(0, 12),
      topPages,
      utmCampaigns,
    },
    recentViews,
    sessionDetails,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await request.json();
  const admin = createAnalyticsAdminClient();
  const update = {
    tracking_enabled: Boolean(payload.tracking_enabled),
    respect_do_not_track: Boolean(payload.respect_do_not_track),
    anonymize_ip: Boolean(payload.anonymize_ip),
    data_retention_days: clampInteger(payload.data_retention_days, 30, 1, 730),
  };

  const { data, error } = await admin
    .from('analytics_settings')
    .upsert({ id: ANALYTICS_SETTINGS_ID, ...update }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
