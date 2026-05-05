'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './MiniDashboard.module.css';
import { Profile } from '@/lib/types';

// ── SVG Icons (inline, no extra deps) ──────────────────────────────
const CodeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ── Hobby badge ─────────────────────────────────────────────────────
const hobbies: { icon: string; label: string }[] = [
  { icon: '🎨', label: 'Creative Work' },
  { icon: '📸', label: 'Nick GOGOGO' },
  { icon: '🎬', label: 'Nick GOGOGO Vlogs' },
];

// ── Single animated card ────────────────────────────────────────────
function DashCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────
interface Props {
  profile?: Profile | null;
}

export default function MiniDashboard({ profile }: Props) {
  const githubUrl = profile?.github_url || 'https://github.com/NickKhunapoj';
  const youtubeUrl = 'https://www.youtube.com/@NickGOGOGO';
  // Extract username from github URL
  const githubUser = githubUrl.replace(/\/$/, '').split('/').pop() || 'NickKhunapoj';

  return (
    <section className={styles.wrapper} aria-label="Quick overview">
      <div className={styles.grid}>

        {/* ── Card 1: Focuses Now ─────────────────────── */}
        <DashCard delay={0}>
          <div className={styles.cardIconRow}>
            <span className={`${styles.iconBubble} ${styles.iconBubbleBlue}`}>
              <CodeIcon />
            </span>
            <span className={styles.cardLabel}>Focuses Now</span>
          </div>
          <p className={styles.cardValue}>Software Development</p>
          <p className={styles.cardDesc}>
            Building practical web systems, full-stack tools, and clean user experiences.
          </p>
          <div className={styles.tagRow}>
            {['Full-Stack', 'Web Systems', 'UI/UX'].map((t) => (
              <span key={t} className={`${styles.tag} ${styles.tagBlue}`}>{t}</span>
            ))}
          </div>
        </DashCard>

        {/* ── Card 2: GitHub Stats ─────────────────────── */}
        <DashCard delay={0.1}>
          <div className={styles.cardIconRow}>
            <span className={`${styles.iconBubble} ${styles.iconBubblePurple}`}>
              <GitHubIcon />
            </span>
            <span className={styles.cardLabel}>GitHub</span>
          </div>
          <p className={styles.cardValue}>@{githubUser}</p>
          <p className={styles.cardDesc}>
            15+ repositories and 650+ total contributions across open-source projects and personal tools.
          </p>
          <div className={styles.githubStatRow}>
            <div className={styles.statPill}>
              <span className={styles.statIcon}>📦</span>
              <span className={styles.statText}>Repos</span>
            </div>
            <div className={styles.statPill}>
              <span className={styles.statIcon}>⭐</span>
              <span className={styles.statText}>Stars</span>
            </div>
            <div className={styles.statPill}>
              <span className={styles.statIcon}>🔀</span>
              <span className={styles.statText}>Activity</span>
            </div>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
            aria-label={`Visit @${githubUser} on GitHub`}
          >
            View Profile <ExternalLinkIcon />
          </a>
        </DashCard>

        {/* ── Card 3: Hobbies ──────────────────────────── */}
        <DashCard delay={0.2}>
          <div className={styles.cardIconRow}>
            <span className={`${styles.iconBubble} ${styles.iconBubbleGold}`}>
              <YouTubeIcon />
            </span>
            <span className={styles.cardLabel}>Hobbies</span>
          </div>
          <p className={styles.cardValue}>Beyond Code</p>
          <p className={styles.cardDesc}>
            Creative projects, content creation, and visual storytelling outside software development.
          </p>
          <div className={styles.tagRow}>
            {hobbies.map((h) => (
              <span key={h.label} className={`${styles.tag} ${styles.tagGold}`}>
                {h.icon} {h.label}
              </span>
            ))}
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.youtubeLink}
            aria-label="Visit Nick GOGOGO on YouTube"
          >
            View Channel <ExternalLinkIcon />
          </a>
        </DashCard>

      </div>
    </section>
  );
}
