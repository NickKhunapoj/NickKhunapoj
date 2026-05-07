import { NextRequest, NextResponse } from 'next/server';
import {
  clampInteger,
  createAnalyticsAdminClient,
  getAnalyticsSettings,
  getClientIp,
  getLocationFromHeaders,
  getReferrerDomain,
  hasDoNotTrack,
  hashIp,
  isAdminOrAssetPath,
  parseUserAgent,
} from '@/lib/analytics/server';

export const runtime = 'nodejs';

interface TrackPayload {
  eventType?: 'page_view' | 'page_end';
  pageViewId?: string;
  visitorId?: string;
  sessionId?: string;
  sessionStartedAt?: string;
  path?: string;
  url?: string;
  title?: string;
  referrerUrl?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timezone?: string;
  timeOnPageSeconds?: number;
  doNotTrack?: boolean;
}

const recentEvents = new Map<string, number>();
const idPattern = /^[a-zA-Z0-9_-]{8,96}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  return NextResponse.json(
    { tracked: false, error: 'method_not_allowed', allowed: ['POST'] },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { ok: true, allowed: ['POST'] },
    { headers: { Allow: 'POST, OPTIONS' } }
  );
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanId(value: unknown) {
  const cleaned = cleanText(value, 96);
  return cleaned && idPattern.test(cleaned) ? cleaned : null;
}

function cleanPageViewId(value: unknown) {
  const cleaned = cleanText(value, 48);
  return cleaned && uuidPattern.test(cleaned) ? cleaned : null;
}

function safePath(value: unknown) {
  const path = cleanText(value, 512);
  if (!path || !path.startsWith('/')) return null;
  return path;
}

function safeUrl(value: unknown) {
  const url = cleanText(value, 1200);
  if (!url) return null;

  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function getUtmValues(url: string | null) {
  if (!url) return {};

  try {
    const params = new URL(url).searchParams;
    return {
      utm_source: cleanText(params.get('utm_source'), 160),
      utm_medium: cleanText(params.get('utm_medium'), 160),
      utm_campaign: cleanText(params.get('utm_campaign'), 200),
      utm_term: cleanText(params.get('utm_term'), 200),
      utm_content: cleanText(params.get('utm_content'), 200),
    };
  } catch {
    return {};
  }
}

function shouldRateLimit(key: string) {
  const now = Date.now();
  const previous = recentEvents.get(key);

  for (const [eventKey, timestamp] of recentEvents) {
    if (now - timestamp > 60_000) recentEvents.delete(eventKey);
  }

  if (previous && now - previous < 2_500) return true;
  recentEvents.set(key, now);
  return false;
}

async function updatePageEnd(payload: TrackPayload) {
  try {
    const admin = createAnalyticsAdminClient();
    const pageViewId = cleanPageViewId(payload.pageViewId);
    const visitorId = cleanId(payload.visitorId);
    const sessionId = cleanId(payload.sessionId);
    const path = safePath(payload.path);

    if (!pageViewId || !visitorId || !sessionId) {
      return NextResponse.json({ tracked: false }, { status: 202 });
    }

    const timeOnPageSeconds = clampInteger(payload.timeOnPageSeconds, 0, 0, 60 * 60 * 4);
    const endedAt = new Date().toISOString();
    const sessionStartedAt = payload.sessionStartedAt ? new Date(payload.sessionStartedAt) : null;
    const durationSeconds = sessionStartedAt && Number.isFinite(sessionStartedAt.getTime())
      ? Math.max(0, Math.round((Date.now() - sessionStartedAt.getTime()) / 1000))
      : null;

    await admin
      .from('analytics_page_views')
      .update({ time_on_page_seconds: timeOnPageSeconds })
      .eq('id', pageViewId)
      .eq('visitor_id', visitorId)
      .eq('session_id', sessionId);

    const sessionUpdate: Record<string, string | number | null> = {
      ended_at: endedAt,
      exit_path: path,
    };
    if (durationSeconds !== null) sessionUpdate.duration_seconds = durationSeconds;

    await admin
      .from('analytics_sessions')
      .update(sessionUpdate)
      .eq('session_id', sessionId)
      .eq('visitor_id', visitorId);

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error('Analytics page end failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ tracked: false, error: 'tracking_failed' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  let payload: TrackPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ tracked: false }, { status: 400 });
  }

  if (payload.eventType === 'page_end') {
    return updatePageEnd(payload);
  }

  try {
    const settings = await getAnalyticsSettings();
    const path = safePath(payload.path);

    if (!settings.tracking_enabled || !path || isAdminOrAssetPath(path)) {
      return NextResponse.json({ tracked: false }, { status: 202 });
    }

    if (settings.respect_do_not_track && hasDoNotTrack(request, payload.doNotTrack)) {
      return NextResponse.json({ tracked: false, reason: 'do_not_track' }, { status: 202 });
    }

    const visitorId = cleanId(payload.visitorId);
    const sessionId = cleanId(payload.sessionId);

    if (!visitorId || !sessionId) {
      return NextResponse.json({ tracked: false }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const rateKey = `${clientIp || visitorId}:${sessionId}:${path}`;
    if (shouldRateLimit(rateKey)) {
      return NextResponse.json({ tracked: false, reason: 'rate_limited' }, { status: 202 });
    }

    const admin = createAnalyticsAdminClient();
    const now = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || '';
    const parsedUa = parseUserAgent(userAgent);
    const headerLocation = getLocationFromHeaders(request);
    const url = safeUrl(payload.url);
    const referrerUrl = safeUrl(payload.referrerUrl) || safeUrl(request.headers.get('referer'));
    const referrerDomain = getReferrerDomain(referrerUrl);
    const language = cleanText(payload.language, 80) || cleanText(request.headers.get('accept-language')?.split(',')[0], 80);
    const timezone = cleanText(payload.timezone, 120) || headerLocation.timezone;
    const utm = getUtmValues(url);
    const hashedIp = settings.anonymize_ip ? hashIp(clientIp) : null;

  const { data: existingVisitor } = await admin
    .from('analytics_visitors')
    .select('visitor_id')
    .eq('visitor_id', visitorId)
    .maybeSingle();

  const visitorRecord = {
    visitor_id: visitorId,
    last_seen_at: now,
    hashed_ip: hashedIp,
    country: headerLocation.country,
    region: headerLocation.region,
    city: headerLocation.city,
    timezone,
    language,
    device_type: parsedUa.deviceType,
    browser: parsedUa.browser,
    browser_version: parsedUa.browserVersion,
    os: parsedUa.os,
    user_agent: userAgent.slice(0, 1000),
    is_bot: parsedUa.isBot,
  };

  if (existingVisitor) {
    await admin.from('analytics_visitors').update(visitorRecord).eq('visitor_id', visitorId);
  } else {
    await admin.from('analytics_visitors').insert({
      ...visitorRecord,
      first_seen_at: now,
    });
  }

  const { data: existingSession } = await admin
    .from('analytics_sessions')
    .select('session_id, started_at')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existingSession) {
    const startedAt = new Date(String(existingSession.started_at));
    const durationSeconds = Number.isFinite(startedAt.getTime())
      ? Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000))
      : null;

    await admin
      .from('analytics_sessions')
      .update({
        ended_at: now,
        duration_seconds: durationSeconds,
        exit_path: path,
        country: headerLocation.country,
        region: headerLocation.region,
        city: headerLocation.city,
        device_type: parsedUa.deviceType,
        browser: parsedUa.browser,
        os: parsedUa.os,
        is_bot: parsedUa.isBot,
      })
      .eq('session_id', sessionId);
  } else {
    await admin.from('analytics_sessions').insert({
      session_id: sessionId,
      visitor_id: visitorId,
      started_at: now,
      entry_path: path,
      exit_path: path,
      referrer_url: referrerUrl,
      referrer_domain: referrerDomain,
      ...utm,
      country: headerLocation.country,
      region: headerLocation.region,
      city: headerLocation.city,
      device_type: parsedUa.deviceType,
      browser: parsedUa.browser,
      os: parsedUa.os,
      is_bot: parsedUa.isBot,
    });
  }

  const { data: pageView, error } = await admin
    .from('analytics_page_views')
    .insert({
      visitor_id: visitorId,
      session_id: sessionId,
      path,
      url,
      title: cleanText(payload.title, 300),
      referrer_url: referrerUrl,
      referrer_domain: referrerDomain,
      viewed_at: now,
      screen_width: clampInteger(payload.screenWidth, 0, 0, 20000) || null,
      screen_height: clampInteger(payload.screenHeight, 0, 0, 20000) || null,
      language,
      timezone,
    })
    .select('id')
    .single();

    if (error) {
      console.error('Analytics insert failed:', error.message);
      return NextResponse.json({ tracked: false, error: 'insert_failed' }, { status: 200 });
    }

    return NextResponse.json({ tracked: true, pageViewId: pageView.id });
  } catch (error) {
    console.error('Analytics tracking failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ tracked: false, error: 'tracking_failed' }, { status: 200 });
  }
}
