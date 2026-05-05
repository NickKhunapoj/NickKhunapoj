'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import EmptyState from '@/components/ui/EmptyState';
import { Skill } from '@/lib/types';
import styles from './Skills.module.css';

// ── Category accent colours ───────────────────────────────────────────
const categoryAccents: Record<string, { color: string; bg: string; border: string }> = {
  'web & software dev':       { color: '#30d158', bg: 'rgba(48, 209, 88, 0.10)', border: 'rgba(48, 209, 88, 0.20)' },
  'frontend':                 { color: '#30d158', bg: 'rgba(48, 209, 88, 0.10)', border: 'rgba(48, 209, 88, 0.20)' },
  'backend':                  { color: '#2997ff', bg: 'rgba(41, 151, 255, 0.10)', border: 'rgba(41, 151, 255, 0.20)' },
  'devops & infrastructure':  { color: '#2997ff', bg: 'rgba(41, 151, 255, 0.10)', border: 'rgba(41, 151, 255, 0.20)' },
  'cloud & data solutions':   { color: '#64d2ff', bg: 'rgba(100, 210, 255, 0.10)', border: 'rgba(100, 210, 255, 0.20)' },
  'database':                 { color: '#64d2ff', bg: 'rgba(100, 210, 255, 0.10)', border: 'rgba(100, 210, 255, 0.20)' },
  'embedded systems':         { color: '#ff9f0a', bg: 'rgba(255, 159, 10, 0.10)',  border: 'rgba(255, 159, 10, 0.20)' },
  'ai & integration':         { color: '#ffd60a', bg: 'rgba(255, 214, 10, 0.10)',  border: 'rgba(255, 214, 10, 0.20)' },
  'ai/ml':                    { color: '#ffd60a', bg: 'rgba(255, 214, 10, 0.10)',  border: 'rgba(255, 214, 10, 0.20)' },
  'security awareness':       { color: '#bf5af2', bg: 'rgba(191, 90, 242, 0.10)', border: 'rgba(191, 90, 242, 0.20)' },
  'tools':                    { color: '#a1a1a6', bg: 'rgba(161, 161, 166, 0.10)', border: 'rgba(161, 161, 166, 0.20)' },
};
const defaultAccent = { color: '#2997ff', bg: 'rgba(41, 151, 255, 0.10)', border: 'rgba(41, 151, 255, 0.20)' };

function getAccent(category: string) {
  return categoryAccents[category.toLowerCase()] ?? defaultAccent;
}

/**
 * Parse a skill row's `name` into bullet strings.
 * Handles three formats:
 *  1. string[]  — new format saved via json-array textarea
 *  2. string with \n — multiline text
 *  3. plain string — old single-skill rows
 */
function parseBullets(name: unknown): string[] {
  if (Array.isArray(name)) {
    return (name as string[])
      .flatMap((s) => String(s).split('\n'))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof name === 'string' && name.trim()) {
    return name.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// ── Animated card ────────────────────────────────────────────────────
function SkillCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────
interface Props {
  data: Skill[];
}

export default function SkillSection({ data }: Props) {
  /**
   * Group ALL skill rows by category, then merge their bullets.
   * Works for both:
   *  - Old data: many rows per category, each with a single-word name
   *  - New data: one row per category, name is a newline/array of bullets
   */
  const grouped = new Map<string, { icon: string; bullets: string[] }>();

  for (const skill of data) {
    const cat = skill.category || 'Other';
    const bullets = parseBullets(skill.name);
    const icon = skill.icon || '';

    if (!grouped.has(cat)) {
      grouped.set(cat, { icon, bullets: [] });
    }
    const entry = grouped.get(cat)!;
    // Use the first non-empty icon found in this category
    if (!entry.icon && icon) entry.icon = icon;
    entry.bullets.push(...bullets);
  }

  const categories = Array.from(grouped.entries());

  return (
    <section id="skills" className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Skills</h2>

        {categories.length === 0 ? (
          <EmptyState icon="⚡" message="No skills listed yet." />
        ) : (
          <div className={styles.grid}>
            {categories.map(([category, { icon, bullets }], idx) => {
              const accent = getAccent(category);
              const displayIcon = icon || '✦';

              return (
                <SkillCard key={category} delay={idx * 0.07}>
                  {/* Category header */}
                  <div className={styles.cardHeader}>
                    <span className={styles.categoryIcon} style={{ color: accent.color }}>
                      {displayIcon}
                    </span>
                    <span
                      className={styles.categoryName}
                      style={{
                        background: accent.bg,
                        borderColor: accent.border,
                        color: accent.color,
                      }}
                    >
                      {category}
                    </span>
                  </div>

                  {/* Bullet skill list */}
                  <ul className={styles.skillList}>
                    {bullets.map((item, i) => (
                      <li key={i} className={styles.skillItem}>{item}</li>
                    ))}
                  </ul>
                </SkillCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
