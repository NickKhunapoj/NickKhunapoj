'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import adminStyles from '../admin.module.css';
import styles from './analytics.module.css';

interface CountItem {
  label: string;
  value: number;
}

interface AnalyticsSettings {
  data_retention_days: number;
  tracking_enabled: boolean;
  respect_do_not_track: boolean;
  anonymize_ip: boolean;
}

interface RecentView {
  id: string;
  viewedAt: string;
  path: string;
  title: string | null;
  referrer: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  sessionId: string;
  sessionShort: string;
  visitorShort: string;
  timeOnPage: number | null;
}

interface SessionDetail {
  session: {
    session_id: string;
    visitor_id: string;
    started_at: string;
    duration_seconds: number | null;
    entry_path: string | null;
    referrer_domain: string | null;
    country: string | null;
    city: string | null;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
  } | null;
  views: Array<{
    id: string;
    viewed_at: string;
    path: string;
    title: string | null;
    time_on_page_seconds: number | null;
  }>;
}

interface AnalyticsData {
  settings: AnalyticsSettings;
  summary: {
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    averageSessionDuration: number;
    topReferrer: string;
    topCountry: string;
  };
  series: Array<{ label: string; pageViews: number; visitors: number }>;
  breakdowns: {
    devices: CountItem[];
    browsers: CountItem[];
    referrers: CountItem[];
    countries: CountItem[];
    cities: CountItem[];
    topPages: CountItem[];
    utmCampaigns: CountItem[];
  };
  recentViews: RecentView[];
  sessionDetails: SessionDetail[];
}

const rangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en').format(value);
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 1) return `${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m ${remainingSeconds}s`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function BreakdownList({ items }: { items: CountItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) return <div className={styles.empty}>No data yet.</div>;

  return (
    <div className={styles.breakdownList}>
      {items.map((item) => (
        <div key={item.label} className={styles.breakdownRow}>
          <span>{item.label}</span>
          <span className={styles.track}>
            <span className={styles.fill} style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }} />
          </span>
          <strong>{formatNumber(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function TrafficChart({ series }: { series: AnalyticsData['series'] }) {
  const max = Math.max(...series.flatMap((item) => [item.pageViews, item.visitors]), 1);

  if (series.length === 0) return <div className={styles.empty}>No page views in this range.</div>;

  return (
    <div className={styles.barChart}>
      {series.map((item) => (
        <div key={item.label} className={styles.barGroup} title={`${item.label}: ${item.pageViews} views, ${item.visitors} visitors`}>
          <span className={styles.bar} style={{ height: `${Math.max((item.pageViews / max) * 100, 3)}%` }} />
          <span className={styles.barSecondary} style={{ height: `${Math.max((item.visitors / max) * 100, 3)}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filters, setFilters] = useState({ path: '', referrer: '', country: '', device: '' });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (range === 'custom') {
      if (from) params.set('from', from);
      if (to) params.set('to', to);
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    return params.toString();
  }, [filters, from, range, to]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/analytics?${queryString}`);
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || 'Unable to load analytics.');

      setData(payload);
      setSettings(payload.settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load analytics.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAnalytics();
    });
  }, [fetchAnalytics]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save settings.');
      setSettings(payload.settings);
      addToast('Analytics settings saved', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Unable to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runCleanup = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/analytics/cleanup', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to run cleanup.');
      addToast(`Cleanup complete: ${payload.cleanup?.deleted_page_views || 0} old page views removed`, 'success');
      await fetchAnalytics();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Unable to run cleanup', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedSession = data?.sessionDetails.find((detail) => detail.session?.session_id === selectedSessionId) || null;

  return (
    <div className={adminStyles.adminLayout}>
      <button className={adminStyles.mobileToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
        ☰
      </button>

      {sidebarOpen && <div className={adminStyles.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${adminStyles.sidebar} ${sidebarOpen ? adminStyles.sidebarOpen : ''}`}>
        <div className={adminStyles.sidebarHeader}>
          <div className={adminStyles.sidebarBrand}>
            <div className={adminStyles.sidebarMark}>N</div>
            <div className={adminStyles.sidebarCopy}>
              <div className={adminStyles.sidebarTitle}>Portfolio Admin</div>
              <div className={adminStyles.sidebarSubtitle}>Insights</div>
            </div>
          </div>
          <button
            type="button"
            className={adminStyles.sidebarCloseBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close admin menu"
          >
            ×
          </button>
        </div>
        <nav className={adminStyles.sidebarNav}>
          <div className={adminStyles.sidebarGroup}>
            <div className={adminStyles.groupLabel}>Content</div>
            <Link href="/admin" className={adminStyles.navItem} title="Manage Content" aria-label="Manage Content">
              <span className={adminStyles.navIcon}>✎</span>
              <span className={adminStyles.navLabel}>Manage Content</span>
            </Link>
          </div>
          <div className={adminStyles.sidebarGroup}>
            <div className={adminStyles.groupLabel}>Insights</div>
            <Link href="/admin/analytics" className={`${adminStyles.navItem} ${adminStyles.navItemActive}`} title="Analytics" aria-label="Analytics">
              <span className={adminStyles.navIcon}>↗</span>
              <span className={adminStyles.navLabel}>Analytics</span>
            </Link>
          </div>
        </nav>
        <div className={adminStyles.sidebarFooter}>
          <Link href="/" className={adminStyles.navItem} style={{ marginBottom: 8 }} title="View Site" aria-label="View Site">
            <span className={adminStyles.navIcon}>🌐</span>
            <span className={adminStyles.navLabel}>View Site</span>
          </Link>
          <button className={adminStyles.logoutBtn} onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
            <span className={adminStyles.navIcon}>🚪</span>
            <span className={adminStyles.navLabel}>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={adminStyles.mainContent}>
        <div className={adminStyles.pageHeader}>
          <div>
            <h1 className={adminStyles.pageTitle}>Analytics</h1>
            <p className={adminStyles.pageSubtitle}>First-party public website traffic and visitor insights</p>
          </div>
          <Button onClick={fetchAnalytics} variant="secondary" size="sm">Refresh</Button>
        </div>

        <div className={styles.analyticsShell}>
          <section className={styles.toolbar}>
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Path</span>
                <input className={styles.input} value={filters.path} onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value }))} placeholder="/projects" />
              </div>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Referrer</span>
                <input className={styles.input} value={filters.referrer} onChange={(e) => setFilters((prev) => ({ ...prev, referrer: e.target.value }))} placeholder="github.com" />
              </div>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Country</span>
                <input className={styles.input} value={filters.country} onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))} placeholder="TH" />
              </div>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Device</span>
                <select className={styles.select} value={filters.device} onChange={(e) => setFilters((prev) => ({ ...prev, device: e.target.value }))}>
                  <option value="">All</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                  <option value="bot">Bot</option>
                </select>
              </div>
            </div>
            <div className={styles.rangeTabs}>
              {rangeOptions.map((option) => (
                <button key={option.value} className={`${styles.tabButton} ${range === option.value ? styles.tabActive : ''}`} onClick={() => setRange(option.value)}>
                  {option.label}
                </button>
              ))}
              {range === 'custom' && (
                <>
                  <input className={styles.input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  <input className={styles.input} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </>
              )}
            </div>
          </section>

          {loading ? (
            <Skeleton count={8} />
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : data ? (
            <>
              <section className={styles.summaryGrid}>
                <div className={styles.summaryCard}><div className={styles.summaryLabel}>Page Views</div><div className={styles.summaryValue}>{formatNumber(data.summary.pageViews)}</div></div>
                <div className={styles.summaryCard}><div className={styles.summaryLabel}>Visitors</div><div className={styles.summaryValue}>{formatNumber(data.summary.uniqueVisitors)}</div></div>
                <div className={styles.summaryCard}><div className={styles.summaryLabel}>Sessions</div><div className={styles.summaryValue}>{formatNumber(data.summary.sessions)}</div></div>
                <div className={styles.summaryCard}><div className={styles.summaryLabel}>Avg Duration</div><div className={styles.summaryValue}>{formatDuration(data.summary.averageSessionDuration)}</div></div>
                <div className={styles.summaryCard}><div className={styles.summaryLabel}>Top Referrer</div><div className={styles.summaryValue}>{data.summary.topReferrer}</div></div>
                <div className={styles.summaryCard}><div className={styles.summaryLabel}>Top Country</div><div className={styles.summaryValue}>{data.summary.topCountry}</div></div>
              </section>

              <section className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionTitle}>Traffic Over Time</div>
                      <div className={styles.sectionHint}>Blue: page views, green: unique visitors</div>
                    </div>
                  </div>
                  <TrafficChart series={data.series} />
                </div>
                <div className={styles.chartCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Device Breakdown</div></div>
                  <BreakdownList items={data.breakdowns.devices} />
                </div>
              </section>

              <section className={styles.tablesGrid}>
                <div className={styles.tableCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Browsers</div></div>
                  <BreakdownList items={data.breakdowns.browsers} />
                </div>
                <div className={styles.tableCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Referrers</div></div>
                  <BreakdownList items={data.breakdowns.referrers} />
                </div>
                <div className={styles.tableCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Countries / Cities</div></div>
                  <BreakdownList items={[...data.breakdowns.countries, ...data.breakdowns.cities].slice(0, 12)} />
                </div>
                <div className={styles.tableCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionTitle}>UTM Campaigns</div></div>
                  <BreakdownList items={data.breakdowns.utmCampaigns} />
                </div>
              </section>

              <section className={styles.tableCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Recent Page Views</div></div>
                <div className={styles.tableWrap}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Path</th>
                        <th>Referrer</th>
                        <th>Location</th>
                        <th>Device</th>
                        <th>Browser / OS</th>
                        <th>Session</th>
                        <th>Visitor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentViews.map((view) => (
                        <tr key={view.id}>
                          <td>{formatDateTime(view.viewedAt)}</td>
                          <td>{view.path}</td>
                          <td>{view.referrer}</td>
                          <td>{[view.country, view.city].filter(Boolean).join(', ') || 'Unknown'}</td>
                          <td>{view.device}</td>
                          <td>{view.browser} / {view.os}</td>
                          <td className={styles.clickableCell} onClick={() => setSelectedSessionId(view.sessionId)}>{view.sessionShort}</td>
                          <td>{view.visitorShort}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.tablesGrid}>
                <div className={styles.tableCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Top Pages</div></div>
                  <BreakdownList items={data.breakdowns.topPages} />
                </div>
                <div className={styles.settingsPanel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionTitle}>Analytics Settings</div>
                      <div className={styles.sectionHint}>Tracking is first-party and admin-only.</div>
                    </div>
                  </div>
                  {settings && (
                    <div className={styles.settingsGrid}>
                      <label className={styles.toggleRow}><input type="checkbox" checked={settings.tracking_enabled} onChange={(e) => setSettings({ ...settings, tracking_enabled: e.target.checked })} /> Tracking</label>
                      <label className={styles.toggleRow}><input type="checkbox" checked={settings.respect_do_not_track} onChange={(e) => setSettings({ ...settings, respect_do_not_track: e.target.checked })} /> Respect DNT</label>
                      <label className={styles.toggleRow}><input type="checkbox" checked={settings.anonymize_ip} onChange={(e) => setSettings({ ...settings, anonymize_ip: e.target.checked })} /> Hash IP</label>
                      <label className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Retention days</span>
                        <input className={styles.input} type="number" min={1} max={730} value={settings.data_retention_days} onChange={(e) => setSettings({ ...settings, data_retention_days: Number(e.target.value) })} />
                      </label>
                      <div className={styles.settingsActions}>
                        <Button onClick={saveSettings} disabled={saving} size="sm">Save</Button>
                        <button className={styles.secondaryButton} onClick={runCleanup} disabled={saving}>Run cleanup</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {selectedSession && (
                <section className={styles.detailPanel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionTitle}>Session Timeline</div>
                      <div className={styles.sectionHint}>
                        {selectedSession.session?.referrer_domain || 'Direct'} · {selectedSession.session?.device_type || 'unknown'} · {formatDuration(selectedSession.session?.duration_seconds)}
                      </div>
                    </div>
                    <button className={styles.secondaryButton} onClick={() => setSelectedSessionId(null)}>Close</button>
                  </div>
                  <div className={styles.timeline}>
                    {selectedSession.views.map((view) => (
                      <div key={view.id} className={styles.timelineItem}>
                        <span>{formatDateTime(view.viewed_at)}</span>
                        <span>{view.path} {view.time_on_page_seconds ? `· ${formatDuration(view.time_on_page_seconds)}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className={styles.empty}>No analytics data yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
