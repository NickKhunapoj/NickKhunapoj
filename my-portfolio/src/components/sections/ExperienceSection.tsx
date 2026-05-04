import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Experience } from '@/lib/types';
import { formatDateRange, parseJsonArray } from '@/lib/utils';
import styles from './ContentStyles.module.css';

interface Props {
  data: Experience[];
}

export default function ExperienceSection({ data }: Props) {
  return (
    <ScrollReveal>
      <Section id="experience" title="Experience" subtitle="Professional journey">
        {data.length === 0 ? (
          <EmptyState icon="💼" message="No experience entries yet." />
        ) : (
          <div className={styles.list}>
            {data.map((item) => {
              const highlights = parseJsonArray(item.highlights);
              return (
                <Card
                  key={item.id}
                  title={item.role}
                  subtitle={item.company}
                  meta={formatDateRange(item.start_date, item.end_date)}
                >
                  {item.location && (
                    <p style={{ marginBottom: 8, color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                      📍 {item.location}
                    </p>
                  )}
                  {item.description && <p>{item.description}</p>}
                  {highlights.length > 0 && (
                    <ul className={styles.highlights}>
                      {highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
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
