'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface TrackResponse {
  tracked?: boolean;
  pageViewId?: string;
}

const visitorKey = 'portfolio_visitor_id';
const sessionKey = 'portfolio_session_id';
const sessionStartedKey = 'portfolio_session_started_at';

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function getStoredId(storage: Storage, key: string) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;

    const id = createId();
    storage.setItem(key, id);
    return id;
  } catch {
    return createId();
  }
}

function getSessionStartedAt() {
  try {
    const existing = sessionStorage.getItem(sessionStartedKey);
    if (existing) return existing;

    const startedAt = new Date().toISOString();
    sessionStorage.setItem(sessionStartedKey, startedAt);
    return startedAt;
  } catch {
    return new Date().toISOString();
  }
}

function shouldSkipPath(path: string) {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    /\.(?:css|js|map|png|jpe?g|webp|gif|svg|ico|txt|xml|json|pdf|woff2?)$/i.test(path)
  );
}

function getDoNotTrack() {
  const trackedWindow = window as Window & { doNotTrack?: string };
  return (
    navigator.doNotTrack === '1' ||
    trackedWindow.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const activeViewRef = useRef<{ pageViewId: string | null; path: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (!pathname || shouldSkipPath(pathname)) return;

    const visitorId = getStoredId(window.localStorage, visitorKey);
    const sessionId = getStoredId(window.sessionStorage, sessionKey);
    const sessionStartedAt = getSessionStartedAt();
    const url = window.location.href;
    const startedAt = Date.now();
    let cancelled = false;

    const endCurrentView = () => {
      const activeView = activeViewRef.current;
      if (!activeView?.pageViewId) return;

      const timeOnPageSeconds = Math.max(0, Math.round((Date.now() - activeView.startedAt) / 1000));
      const payload = JSON.stringify({
        eventType: 'page_end',
        pageViewId: activeView.pageViewId,
        visitorId,
        sessionId,
        sessionStartedAt,
        path: activeView.path,
        timeOnPageSeconds,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }

      activeViewRef.current = null;
    };

    endCurrentView();

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'page_view',
        visitorId,
        sessionId,
        sessionStartedAt,
        path: pathname,
        url,
        title: document.title,
        referrerUrl: document.referrer || null,
        screenWidth: window.screen?.width ?? null,
        screenHeight: window.screen?.height ?? null,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        doNotTrack: getDoNotTrack(),
      }),
    })
      .then(async (response) => (response.ok ? (await response.json()) as TrackResponse : null))
      .then((data) => {
        if (!cancelled && data?.tracked) {
          activeViewRef.current = {
            pageViewId: data.pageViewId || null,
            path: pathname,
            startedAt,
          };
        }
      })
      .catch(() => {});

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') endCurrentView();
    };

    window.addEventListener('beforeunload', endCurrentView);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      endCurrentView();
      window.removeEventListener('beforeunload', endCurrentView);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
