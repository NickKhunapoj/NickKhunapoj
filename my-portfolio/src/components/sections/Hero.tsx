'use client';

import { motion } from 'framer-motion';
import styles from './Hero.module.css';
import { Profile } from '@/lib/types';

interface HeroProps {
  profile?: Profile | null;
}

const stagger = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// SVG Icons
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function Hero({ profile }: HeroProps) {
  const name = profile?.full_name || 'Khunapoj Suttenon';
  const headline = profile?.headline || 'Computer Engineering · Web Developer';
  const bio =
    profile?.hero_intro ||
    'Welcome to my digital portfolio. Explore the projects, skills, and experiences that shape how I build thoughtful web systems and keep learning as a Computer Engineering student.';
  const email = profile?.email || 'Khunapoj.s@gmail.com';
  const github = profile?.github_url || 'https://github.com/NickKhunapoj';
  const linkedin =
    profile?.linkedin_url || 'https://www.linkedin.com/in/khunapoj-suttenon-76406b1a0/';

  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('about');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.hero} id="hero">
      {/* Animated gradient mesh */}
      <div className={styles.meshGradient}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

      <div className={styles.content}>
        <motion.p
          className={styles.greeting}
          custom={0}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          Hello, I&apos;m
        </motion.p>
        <motion.h1
          className={styles.name}
          custom={1}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {name}
        </motion.h1>
        <motion.p
          className={styles.role}
          custom={2}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {headline}
        </motion.p>
        <motion.p
          className={styles.description}
          custom={3}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {bio}
        </motion.p>
        <motion.div
          className={styles.cta}
          custom={4}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <a
            href="#about"
            onClick={handleExploreClick}
            className={`${styles.exploreBtn} ${styles.exploreBtnPrimary}`}
          >
            Explore More
          </a>
          <a href={`mailto:${email}`} className={`${styles.exploreBtn} ${styles.exploreBtnSecondary}`}>
            Get in Touch
          </a>
        </motion.div>
        <motion.div
          className={styles.socials}
          custom={5}
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="LinkedIn"
            >
              <LinkedInIcon />
            </a>
          )}
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="GitHub"
            >
              <GitHubIcon />
            </a>
          )}
        </motion.div>
      </div>

      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
