import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';
import styles from './stats.module.css';

export const metadata: Metadata = {
  title: 'Stats | Khunapoj Suttenon',
  description: 'A quick overview of public repositories, coding activity, and language usage.',
};

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

type GitHubUser = {
  login: string;
  name: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  private: boolean;
  updated_at: string;
};

type LanguageStat = {
  name: string;
  bytes: number;
  percent: number;
};

type GitHubStatsData = {
  user: GitHubUser;
  repos: GitHubRepo[];
  languages: LanguageStat[];
  totalStars: number;
  totalForks: number;
  topLanguage: string;
};

const GITHUB_API = 'https://api.github.com';
const USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME || 'NickKhunapoj';

type CSSVarStyle = CSSProperties & Record<`--${string}`, string | number>;

const LANGUAGE_THEMES: Record<string, { gradient: string; glow: string }> = {
  typescript: {
    gradient: 'linear-gradient(90deg, #2997ff, #64d2ff)',
    glow: 'rgba(41, 151, 255, 0.34)',
  },
  javascript: {
    gradient: 'linear-gradient(90deg, #ffd60a, #ff9f0a)',
    glow: 'rgba(255, 214, 10, 0.28)',
  },
  css: {
    gradient: 'linear-gradient(90deg, #64d2ff, #bf5af2)',
    glow: 'rgba(100, 210, 255, 0.28)',
  },
  scss: {
    gradient: 'linear-gradient(90deg, #ff6bd6, #bf5af2)',
    glow: 'rgba(255, 107, 214, 0.28)',
  },
  plpgsql: {
    gradient: 'linear-gradient(90deg, #30d158, #64d2ff)',
    glow: 'rgba(48, 209, 88, 0.28)',
  },
  processing: {
    gradient: 'linear-gradient(90deg, #ff9f0a, #ff453a)',
    glow: 'rgba(255, 159, 10, 0.3)',
  },
  other: {
    gradient: 'linear-gradient(90deg, #8e8e93, #d1d1d6)',
    glow: 'rgba(161, 161, 166, 0.22)',
  },
};

function getLanguageTheme(language: string) {
  return LANGUAGE_THEMES[language.toLowerCase()] ?? {
    gradient: 'linear-gradient(90deg, #5e5ce6, #30d158)',
    glow: 'rgba(94, 92, 230, 0.26)',
  };
}

function animationStyle(index: number, step = 70): CSSVarStyle {
  return { '--delay': `${index * step}ms` };
}

function languageStyle(language: LanguageStat, index: number): CSSVarStyle {
  const theme = getLanguageTheme(language.name);
  return {
    '--bar-width': `${language.percent}%`,
    '--delay': `${index * 80}ms`,
    '--language-gradient': theme.gradient,
    '--language-glow': theme.glow,
  };
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchGitHubJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    next: { revalidate },
  });

  if (!response.ok) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    const resetTime = rateLimitReset
      ? new Date(Number(rateLimitReset) * 1000).toISOString()
      : 'unknown';

    throw new Error(
      `GitHub request failed: ${response.status} ${response.statusText}. Remaining=${rateLimitRemaining ?? 'unknown'}, reset=${resetTime}`,
    );
  }

  return response.json() as Promise<T>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function calculateLanguagePercentages(languageBytes: Record<string, number>): LanguageStat[] {
  const sorted = Object.entries(languageBytes)
    .filter(([, bytes]) => bytes > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) return [];

  const visible = sorted.slice(0, 6);
  const remainingBytes = sorted.slice(6).reduce((total, [, bytes]) => total + bytes, 0);
  const entries = remainingBytes > 0 ? [...visible, ['Other', remainingBytes] as [string, number]] : visible;
  const totalBytes = entries.reduce((total, [, bytes]) => total + bytes, 0);

  const rawStats = entries.map(([name, bytes]) => {
    const exactPercent = (bytes / totalBytes) * 100;
    return {
      name,
      bytes,
      floor: Math.floor(exactPercent),
      remainder: exactPercent - Math.floor(exactPercent),
    };
  });

  let remainingPercent = 100 - rawStats.reduce((total, item) => total + item.floor, 0);
  const remainderOrder = rawStats
    .map((item, index) => ({ index, remainder: item.remainder }))
    .sort((a, b) => b.remainder - a.remainder);

  const percents = rawStats.map((item) => item.floor);
  for (const item of remainderOrder) {
    if (remainingPercent <= 0) break;
    percents[item.index] += 1;
    remainingPercent -= 1;
  }

  percents.forEach((percent, index) => {
    if (percent > 0) return;

    percents[index] = 1;
    const donorIndex = percents
      .map((value, donor) => ({ donor, value }))
      .filter((item) => item.donor !== index && item.value > 1)
      .sort((a, b) => b.value - a.value)[0]?.donor;

    if (donorIndex !== undefined) {
      percents[donorIndex] -= 1;
    }
  });

  return rawStats.map((item, index) => ({
    name: item.name,
    bytes: item.bytes,
    percent: percents[index],
  }));
}

async function fetchGitHubStats(username: string): Promise<GitHubStatsData> {
  const [user, rawRepos] = await Promise.all([
    fetchGitHubJson<GitHubUser>(`/users/${username}`),
    fetchGitHubJson<GitHubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`),
  ]);

  const repos = rawRepos
    .filter((repo) => !repo.fork && !repo.private)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const languageResults = await Promise.all(
    repos.map(async (repo) => {
      try {
        return await fetchGitHubJson<Record<string, number>>(`/repos/${repo.full_name}/languages`);
      } catch {
        return {};
      }
    })
  );

  const languageBytes = languageResults.reduce<Record<string, number>>((acc, repoLanguages) => {
    for (const [language, bytes] of Object.entries(repoLanguages)) {
      acc[language] = (acc[language] || 0) + bytes;
    }
    return acc;
  }, {});

  const languages = calculateLanguagePercentages(languageBytes);
  const totalStars = repos.reduce((total, repo) => total + repo.stargazers_count, 0);
  const totalForks = repos.reduce((total, repo) => total + repo.forks_count, 0);

  return {
    user,
    repos,
    languages,
    totalStars,
    totalForks,
    topLanguage: languages[0]?.name || 'N/A',
  };
}

function SummaryCard({ label, value, hint, index }: { label: string; value: string | number; hint: string; index: number }) {
  return (
    <div className={styles.summaryCard} style={animationStyle(index)}>
      <span className={styles.summaryLabel}>{label}</span>
      <strong className={styles.summaryValue}>{value}</strong>
      <span className={styles.summaryHint}>{hint}</span>
    </div>
  );
}

function RepoCard({ repo, index }: { repo: GitHubRepo; index: number }) {
  return (
    <article className={styles.repoCard} style={animationStyle(index, 45)}>
      <div className={styles.repoHeader}>
        <div>
          <h3 className={styles.repoName}>{repo.name}</h3>
          <p className={styles.repoUpdated}>Updated {formatDate(repo.updated_at)}</p>
        </div>
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className={styles.repoLink}>
          GitHub ↗
        </a>
      </div>

      <p className={styles.repoDescription}>
        {repo.description || 'No description provided.'}
      </p>

      <div className={styles.repoMeta}>
        <span>{repo.language || 'Unknown'}</span>
        <span>{repo.stargazers_count} stars</span>
        <span>{repo.forks_count} forks</span>
      </div>
    </article>
  );
}

function ErrorState() {
  return (
    <div className={styles.stateCard}>
      <h2>Unable to load GitHub stats right now.</h2>
      <p>Please try again later, or visit the GitHub profile directly.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.stateCard}>
      <h2>No public repositories found.</h2>
      <p>Repositories will appear here once they are available from GitHub.</p>
    </div>
  );
}

export default async function StatsPage() {
  let data: GitHubStatsData | null = null;
  let hasError = false;

  try {
    data = await fetchGitHubStats(USERNAME);
  } catch (error) {
    hasError = true;
    console.error(error);
  }

  const recentRepos = data?.repos.slice(0, 4) ?? [];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Public GitHub Profile</p>
          <h1>GitHub Stats</h1>
          <p>
            A quick overview of my public repositories, coding activity, and language usage.
          </p>
          {data && (
            <a href={data.user.html_url} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
              @{data.user.login} on GitHub ↗
            </a>
          )}
        </section>

        {hasError || !data ? (
          <ErrorState />
        ) : data.repos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section className={styles.summaryGrid} aria-label="GitHub stats summary">
              <SummaryCard index={0} label="Public Repositories" value={data.repos.length} hint={`${data.user.public_repos} total on profile`} />
              <SummaryCard index={1} label="Total Stars" value={data.totalStars} hint="Across public non-fork repos" />
              <SummaryCard index={2} label="Total Forks" value={data.totalForks} hint="Across public non-fork repos" />
              <SummaryCard index={3} label="Top Language" value={data.topLanguage} hint={`${data.languages[0]?.percent ?? 0}% of tracked bytes`} />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Language Breakdown</h2>
                <p>Aggregated from GitHub repository language byte counts.</p>
              </div>
              <div className={styles.languageList}>
                {data.languages.map((language, index) => (
                  <div key={language.name} className={styles.languageItem} style={languageStyle(language, index)}>
                    <div className={styles.languageTopLine}>
                      <span>{language.name}</span>
                      <strong>{language.percent}%</strong>
                    </div>
                    <div className={styles.languageTrack} aria-hidden="true">
                      <span />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Recently Updated</h2>
                <p>The latest public repositories touched on GitHub.</p>
              </div>
              <div className={styles.recentGrid}>
                {recentRepos.map((repo, index) => (
                  <RepoCard key={repo.id} repo={repo} index={index} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Public Repositories</h2>
                <p>Public non-fork repositories, sorted by most recently updated.</p>
              </div>
              <div className={styles.repoGrid}>
                {data.repos.map((repo, index) => (
                  <RepoCard key={repo.id} repo={repo} index={index} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
