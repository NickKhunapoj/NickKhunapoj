import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const ANALYTICS_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export interface AnalyticsSettings {
  id: string;
  data_retention_days: number;
  tracking_enabled: boolean;
  respect_do_not_track: boolean;
  anonymize_ip: boolean;
}

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string | null;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  isBot: boolean;
}

export interface RequestLocation {
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
}

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function createAnalyticsAdminClient() {
  return createAdminClient();
}

export async function getAnalyticsSettings() {
  const admin = createAnalyticsAdminClient();
  const { data, error } = await admin
    .from('analytics_settings')
    .select('*')
    .eq('id', ANALYTICS_SETTINGS_ID)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as AnalyticsSettings;

  const { data: inserted, error: insertError } = await admin
    .from('analytics_settings')
    .insert({ id: ANALYTICS_SETTINGS_ID })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return inserted as AnalyticsSettings;
}

export function isAdminOrAssetPath(path: string) {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    /\.(?:css|js|map|png|jpe?g|webp|gif|svg|ico|txt|xml|json|pdf|woff2?)$/i.test(path)
  );
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    null
  );
}

export function hashIp(ip: string | null) {
  if (!ip) return null;

  const salt =
    process.env.ANALYTICS_IP_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'portfolio-analytics';

  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent || '';
  const isBot = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|linkedinbot|preview/i.test(ua);
  const browserMatch =
    ua.match(/Edg\/([\d.]+)/) ||
    ua.match(/OPR\/([\d.]+)/) ||
    ua.match(/Chrome\/([\d.]+)/) ||
    ua.match(/Firefox\/([\d.]+)/) ||
    ua.match(/Version\/([\d.]+).*Safari/) ||
    ua.match(/Safari\/([\d.]+)/);

  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  let os = 'Unknown';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua) && !/Mobile/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/(iPhone|iPad|iPod)/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let deviceType: ParsedUserAgent['deviceType'] = 'desktop';
  if (isBot) deviceType = 'bot';
  else if (/(iPad|Tablet|Nexus 7|Nexus 10|SM-T|Kindle|Silk)/i.test(ua)) deviceType = 'tablet';
  else if (/(Mobile|iPhone|Android.*Mobile|Windows Phone)/i.test(ua)) deviceType = 'mobile';
  else if (!ua) deviceType = 'unknown';

  return {
    browser,
    browserVersion: browserMatch?.[1] ?? null,
    os,
    deviceType,
    isBot,
  };
}

export function getReferrerDomain(referrerUrl?: string | null) {
  if (!referrerUrl) return null;

  try {
    return new URL(referrerUrl).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getLocationFromHeaders(request: NextRequest): RequestLocation {
  const city = request.headers.get('x-vercel-ip-city');

  return {
    country: request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || null,
    region: request.headers.get('x-vercel-ip-country-region') || null,
    city: city ? decodeURIComponent(city) : null,
    timezone: request.headers.get('x-vercel-ip-timezone') || null,
  };
}

export function hasDoNotTrack(request: NextRequest, payloadDoNotTrack?: boolean) {
  return (
    payloadDoNotTrack ||
    request.headers.get('dnt') === '1' ||
    request.headers.get('sec-gpc') === '1' ||
    request.headers.get('global-privacy-control') === '1'
  );
}

export function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

export function shortId(value?: string | null) {
  if (!value) return 'unknown';
  return value.length > 10 ? `${value.slice(0, 8)}...` : value;
}
