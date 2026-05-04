'use client';

import { motion } from 'framer-motion';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { TestScore } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: TestScore[];
}

export default function TestScoreSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section id="test-scores" title="Test Scores" subtitle="Standardized test results">
        {data.length === 0 ? (
          <EmptyState icon="📊" message="No test scores listed yet." />
        ) : (
          <div className={`${styles.grid} ${styles.grid3}`}>
            {data.map((item) => {
              const scoreNum = item.score ? parseFloat(item.score) : null;
              const maxNum = item.max_score ? parseFloat(item.max_score) : null;
              const percentage =
                scoreNum !== null && maxNum !== null && maxNum > 0
                  ? (scoreNum / maxNum) * 100
                  : null;

              return (
                <Card
                  key={item.id}
                  title={item.test_name}
                  subtitle={item.issuer || undefined}
                  meta={formatDate(item.test_date)}
                >
                  <div className={styles.scoreDisplay}>
                    <span className={styles.scoreValue}>{item.score}</span>
                    {item.max_score && (
                      <span className={styles.scoreMax}>/ {item.max_score}</span>
                    )}
                  </div>
                  {percentage !== null && (
                    <div className={styles.scoreBar}>
                      <motion.div
                        className={styles.scoreBarFill}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                        viewport={{ once: true }}
                      />
                    </div>
                  )}
                  {item.description && (
                    <p style={{ marginTop: 8 }}>{item.description}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </ScrollReveal>
  );
}
